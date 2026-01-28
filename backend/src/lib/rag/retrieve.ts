import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { CohereClient } from 'cohere-ai';
import { logger } from '../../utils/logger';
import { raceRerank, isRerankerRaceAvailable } from './race-rerank';
require('dotenv').config();

const openaiApiKey = process.env.OPENAI_API_KEY || '';
const pineconeApiKey = process.env.PINECONE_API_KEY || '';
const pineconeIndexName = process.env.PINECONE_INDEX_NAME || '';
const pineconeIndexHost = process.env.PINECONE_INDEX_HOST || ''; // Optional: specific host for index
const pineconeRegion = process.env.PINECONE_REGION || 'us-east-1';
const embeddingModel = process.env.EMBEDDING_MODEL || 'llama-text-embed-v2';
const embeddingDimensions = parseInt(process.env.EMBEDDING_DIMENSIONS || '1024');
// Neo4j AuraDB OAuth configuration
const neo4jUri = process.env.NEO4J_URI || '';
const neo4jClientId = process.env.NEO4J_CLIENT_ID || '';
const neo4jClientSecret = process.env.NEO4J_CLIENT_SECRET || '';
const neo4jUsername = process.env.NEO4J_USERNAME || 'neo4j';
const neo4jPassword = process.env.NEO4J_PASSWORD || '';
const neo4jOAuthTokenUrl = 'https://api.neo4j.io/oauth/token';
const cohereApiKey = process.env.COHERE_API_KEY || '';

if (!openaiApiKey) {
  console.warn('⚠️  Warning: OPENAI_API_KEY not set. RAG retrieval will not work.');
}

if (!pineconeApiKey) {
  console.warn('⚠️  Warning: PINECONE_API_KEY not set. Vector search will not work.');
}

if (!pineconeIndexName) {
  console.warn('⚠️  Warning: PINECONE_INDEX_NAME not set. Vector search will not work.');
}

if (!neo4jClientId || !neo4jClientSecret) {
  console.warn('⚠️  Warning: NEO4J_CLIENT_ID or NEO4J_CLIENT_SECRET not set. Graph traversal will not work.');
}

if (!neo4jUri) {
  console.warn('⚠️  Warning: NEO4J_URI not set. Graph traversal will not work.');
}

if (!cohereApiKey) {
  console.warn('⚠️  Warning: COHERE_API_KEY not set. Reranking will use placeholder.');
}

interface RetrievedChunk {
  id: string;
  text: string;
  score?: number;
  metadata?: Record<string, any>;
  source: 'vector' | 'graph';
}

interface RetrievalResult {
  chunks: RetrievedChunk[];
  vectorCount: number;
  graphCount: number;
  rerankedCount: number;
}

/**
 * Hybrid RAG Retriever Service
 * Combines Vector Search (Pinecone) with Graph Traversal (Neo4j) and Reranking
 */
export class HybridRetrieverService {
  private openaiClient: OpenAI;
  private pineconeClient: Pinecone | null = null;
  private neo4jDriver: Driver | null = null;
  private cohereClient: CohereClient | null = null;
  private neo4jAccessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.openaiClient = new OpenAI({
      apiKey: openaiApiKey || '',
    });

    if (pineconeApiKey) {
      this.pineconeClient = new Pinecone({
        apiKey: pineconeApiKey,
        // Pinecone hosted on AWS us-east-1
        // Note: Pinecone SDK automatically uses the correct endpoint based on index configuration
      });
    }

    // Initialize Cohere client for reranking
    if (cohereApiKey) {
      try {
        this.cohereClient = new CohereClient({
          token: cohereApiKey,
        });
        console.log('✅ Cohere client initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Cohere client:', error);
      }
    }

    // Initialize Neo4j driver will be done lazily when needed (after OAuth token is obtained)
  }

  /**
   * Get OAuth access token from Neo4j AuraDB
   * Falls back to username/password authentication if OAuth fails
   */
  private async getNeo4jAccessToken(): Promise<string | null> {
    // Check if we have a valid cached token
    if (this.neo4jAccessToken && Date.now() < this.tokenExpiry) {
      return this.neo4jAccessToken;
    }

    if (!neo4jClientId || !neo4jClientSecret) {
      console.warn('⚠️  NEO4J_CLIENT_ID and NEO4J_CLIENT_SECRET not set. Will try username/password authentication.');
      return null; // Signal to use username/password fallback
    }

    try {
      const response = await fetch(neo4jOAuthTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: neo4jClientId,
          client_secret: neo4jClientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OAuth token request failed: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage += ` - ${JSON.stringify(errorJson)}`;
        } catch {
          errorMessage += ` - ${errorText}`;
        }
        console.warn(`⚠️  ${errorMessage}. Falling back to username/password authentication.`);
        return null; // Signal to use username/password fallback
      }

      const data = await response.json() as { access_token: string; expires_in?: number };
      this.neo4jAccessToken = data.access_token;
      
      // Set expiry time (usually tokens expire in 3600 seconds, use 3500 for safety)
      const expiresIn = data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn - 100) * 1000; // Refresh 100 seconds before expiry

      console.log('✅ Neo4j OAuth token obtained');
      return this.neo4jAccessToken;
    } catch (error: any) {
      console.warn(`⚠️  Failed to get Neo4j OAuth token: ${error.message}. Falling back to username/password authentication.`);
      return null; // Signal to use username/password fallback
    }
  }

  /**
   * Initialize Neo4j driver with OAuth token or username/password fallback
   */
  private async initializeNeo4jDriver(): Promise<boolean> {
    // Check if token is expired and refresh if needed
    if (this.neo4jDriver && Date.now() >= this.tokenExpiry) {
      try {
        await this.neo4jDriver.close();
        this.neo4jDriver = null;
      } catch (error) {
        // Ignore close errors
      }
    }

    if (this.neo4jDriver) {
      return true; // Already initialized with valid token
    }

    if (!neo4jUri) {
      console.warn('⚠️  NEO4J_URI not set');
      return false;
    }

    // Try OAuth authentication first
    const token = await this.getNeo4jAccessToken();
    
    try {
      if (token) {
        // Use OAuth bearer token authentication
        this.neo4jDriver = neo4j.driver(neo4jUri, neo4j.auth.bearer(token));
        await this.neo4jDriver.verifyConnectivity();
        console.log('✅ Neo4j AuraDB driver initialized and connected (OAuth)');
        return true;
      } else if (neo4jUsername && neo4jPassword) {
        // Fallback to username/password authentication
        console.log('🔄 Attempting Neo4j connection with username/password authentication...');
        this.neo4jDriver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUsername, neo4jPassword));
        await this.neo4jDriver.verifyConnectivity();
        console.log('✅ Neo4j AuraDB driver initialized and connected (Username/Password)');
        return true;
      } else {
        console.error('❌ No authentication method available. Set either OAuth credentials (NEO4J_CLIENT_ID, NEO4J_CLIENT_SECRET) or username/password (NEO4J_USERNAME, NEO4J_PASSWORD)');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize Neo4j AuraDB driver:', error.message);
      this.neo4jDriver = null;
      return false;
    }
  }

  /**
   * Generate embedding for query using Pinecone Inference API (llama-text-embed-v2)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Use Pinecone Inference API for embeddings
    if (embeddingModel === 'llama-text-embed-v2' && pineconeApiKey) {
      try {
        logger.debug('Using Pinecone Inference API for query embedding', {
          component: 'RAG',
          model: embeddingModel,
        });

        const response = await fetch(`https://api.pinecone.io/inference/generate_embeddings`, {
          method: 'POST',
          headers: {
            'Api-Key': pineconeApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: embeddingModel,
            inputs: [text],
            parameters: {
              input_type: 'query', // Use 'query' for search queries
              dimensions: embeddingDimensions,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Pinecone Inference API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as any;
        
        // Pinecone Inference API returns embeddings in data.embeddings array
        if (data.embeddings && Array.isArray(data.embeddings) && data.embeddings.length > 0) {
          return data.embeddings[0];
        } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          // Alternative response format
          return data.data[0];
        } else {
          throw new Error('Unexpected response format from Pinecone Inference API');
        }
      } catch (error: any) {
        logger.ragError('Pinecone Inference API failed, falling back to OpenAI', error, {
          component: 'RAG',
        });
        // Fallback to OpenAI if Pinecone fails
        return this.generateEmbeddingOpenAI(text);
      }
    } else {
      // Fallback to OpenAI embeddings
      return this.generateEmbeddingOpenAI(text);
    }
  }

  /**
   * Fallback: Generate embedding using OpenAI
   */
  private async generateEmbeddingOpenAI(text: string): Promise<number[]> {
    try {
      const response = await this.openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error: any) {
      console.error('Error generating embedding with OpenAI:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Branch A: Vector Search in Pinecone using namespaces
   * Returns top 10 chunks from user's namespace
   */
  private async vectorSearch(
    queryEmbedding: number[],
    userId: string,
    topK: number = 10
  ): Promise<RetrievedChunk[]> {
    if (!this.pineconeClient || !pineconeIndexName) {
      console.warn('⚠️  Pinecone not configured, skipping vector search');
      return [];
    }

    try {
      // Get index with optional host, then namespace by userId
      const index = pineconeIndexHost 
        ? this.pineconeClient.index(pineconeIndexName, pineconeIndexHost)
        : this.pineconeClient.index(pineconeIndexName);
      
      const namespace = index.namespace(userId || 'default');

      // Query the namespace (namespaces automatically filter by userId)
      const queryResponse = await namespace.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });

      const chunks: RetrievedChunk[] = queryResponse.matches.map((match) => ({
        id: match.id || '',
        // Try chunk_text first (new API), then original_text (old API)
        text: (match.metadata?.chunk_text as string) || 
              (match.metadata?.original_text as string) || 
              '',
        score: match.score,
        metadata: match.metadata as Record<string, any>,
        source: 'vector',
      }));

      console.log(`✅ Vector search returned ${chunks.length} chunks from namespace: ${userId}`);
      return chunks;
    } catch (error: any) {
      console.error('Error in vector search:', error);
      return [];
    }
  }

  /**
   * Branch B: Graph Context Search in Neo4j
   * 1. Find target node using vector similarity
   * 2. Traverse to head node (Document root)
   * 3. Extract shortest path
   */
  private async graphSearch(
    queryEmbedding: number[],
    userId: string
  ): Promise<RetrievedChunk[]> {
    // Initialize driver if needed (will get OAuth token)
    const initialized = await this.initializeNeo4jDriver();
    if (!initialized || !this.neo4jDriver) {
      console.warn('⚠️  Neo4j not configured or failed to initialize, skipping graph search');
      return [];
    }

    const session: Session = this.neo4jDriver.session();

    try {
      // Step 1: Find target node using vector similarity
      // Assuming you have a vector index on Neo4j nodes with embedding property
      const findTargetQuery = `
        CALL db.index.vector.queryNodes('chunkEmbedding', $topK, $embedding)
        YIELD node, score
        WHERE node.userId = $userId
        RETURN node.id AS targetId, node.text AS targetText, score
        ORDER BY score DESC
        LIMIT 1
      `;

      const targetResult = await session.run(findTargetQuery, {
        topK: 1,
        embedding: queryEmbedding,
        userId,
      });

      if (targetResult.records.length === 0) {
        console.warn('⚠️  No target node found in graph');
        return [];
      }

      const targetId = targetResult.records[0].get('targetId');
      const targetText = targetResult.records[0].get('targetText');

      // Step 2: Find the Head Node (Document root) that owns this target
      const findHeadQuery = `
        MATCH (target:Chunk {id: $targetId})
        MATCH (head:Document)-[*]->(target)
        WHERE head.userId = $userId
        RETURN head.id AS headId, head.title AS headTitle
        LIMIT 1
      `;

      const headResult = await session.run(findHeadQuery, {
        targetId,
        userId,
      });

      if (headResult.records.length === 0) {
        console.warn('⚠️  No head node found for target');
        return [];
      }

      const headId = headResult.records[0].get('headId');
      const headTitle = headResult.records[0].get('headTitle') || 'Document';

      // Step 3: Extract shortest path from Head -> Target
      const shortestPathQuery = `
        MATCH path = shortestPath((head:Document {id: $headId})-[*]->(target:Chunk {id: $targetId}))
        WHERE head.userId = $userId
        RETURN path
        LIMIT 1
      `;

      const pathResult = await session.run(shortestPathQuery, {
        headId,
        targetId,
        userId,
      });

      if (pathResult.records.length === 0) {
        console.warn('⚠️  No path found between head and target');
        return [];
      }

      const path = pathResult.records[0].get('path');
      const nodes = path.segments.map((segment: any) => segment.start).concat([path.end]);

      // Format path as hierarchical text
      const pathText = nodes
        .map((node: any, index: number) => {
          const label = node.labels[0];
          const content = node.properties.text || node.properties.title || node.properties.name || '';
          return `${label}: ${content}`;
        })
        .join(' > ');

      const formattedText = `Document: ${headTitle} > ${pathText}`;

      const chunk: RetrievedChunk = {
        id: `graph_${headId}_${targetId}`,
        text: formattedText,
        score: targetResult.records[0].get('score'),
        metadata: {
          headId,
          targetId,
          pathLength: path.length,
        },
        source: 'graph',
      };

      console.log(`✅ Graph search returned 1 path chunk`);
      return [chunk];
    } catch (error: any) {
      console.error('Error in graph search:', error);
      // If vector index doesn't exist, try alternative approach
      if (error.message.includes('index') || error.message.includes('Index')) {
        console.warn('⚠️  Vector index not found, using text-based search fallback');
        return this.graphSearchFallback(session, userId);
      }
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Fallback graph search using text similarity (if vector index not available)
   */
  private async graphSearchFallback(session: Session, userId: string): Promise<RetrievedChunk[]> {
    try {
      // Simple text-based search - find chunks by userId
      const query = `
        MATCH (chunk:Chunk {userId: $userId})
        RETURN chunk.id AS id, chunk.text AS text
        LIMIT 1
      `;

      const result = await session.run(query, { userId });

      if (result.records.length === 0) {
        return [];
      }

      const record = result.records[0];
      return [
        {
          id: `graph_${record.get('id')}`,
          text: record.get('text'),
          source: 'graph',
        },
      ];
    } catch (error: any) {
      console.error('Error in graph search fallback:', error);
      return [];
    }
  }

  /**
   * Deduplicate chunks by ID or content hash
   */
  private deduplicateChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
    const seen = new Set<string>();
    const deduplicated: RetrievedChunk[] = [];

    for (const chunk of chunks) {
      // Use ID if available, otherwise hash the text
      const key = chunk.id || this.hashText(chunk.text);

      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(chunk);
      }
    }

    return deduplicated;
  }

  /**
   * Simple hash function for text deduplication
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Step 3: Rerank using Cohere Rerank API
   * Falls back to score-based sorting if Cohere not available
   */
  private async rerankChunks(
    chunks: RetrievedChunk[],
    query: string,
    topK: number = 5
  ): Promise<RetrievedChunk[]> {
    if (chunks.length === 0) {
      return [];
    }

    // Priority 1: Use race reranker if available (fastest, sub-second latency)
    if (isRerankerRaceAvailable()) {
      try {
        logger.rag('Using race reranker for sub-second latency', { chunkCount: chunks.length, topK });
        
        const raceDocs = chunks.map((chunk, idx) => ({
          id: chunk.id || `chunk_${idx}`,
          content: chunk.text,
          original_score: chunk.score || 0,
        }));

        const rerankedDocs = await raceRerank(query, raceDocs);
        
        // Map back to RetrievedChunk format and take top-K
        const rerankedChunks: RetrievedChunk[] = rerankedDocs
          .slice(0, topK)
          .map((doc) => {
            const originalChunk = chunks.find((c) => c.id === doc.id) || chunks[0];
            return {
              ...originalChunk,
              score: doc.rank_meta ? doc.original_score : originalChunk.score,
              metadata: {
                ...originalChunk.metadata,
                rank_meta: doc.rank_meta,
              },
            };
          });

        logger.rag('Race reranker completed', {
          rerankedCount: rerankedChunks.length,
          winner: rerankedDocs[0]?.rank_meta?.winner,
          latency: rerankedDocs[0]?.rank_meta?.latency,
        });

        return rerankedChunks;
      } catch (error: any) {
        logger.ragError('Race reranker failed, falling back to Cohere', error, {
          chunkCount: chunks.length,
        });
        // Fall through to Cohere fallback
      }
    }

    // Priority 2: Use Cohere reranker if configured
    if (this.cohereClient && cohereApiKey) {
      try {
        logger.rag('Using Cohere reranker', { chunkCount: chunks.length, topK });
        const documents = chunks.map((chunk) => chunk.text);

        const rerankResponse = await this.cohereClient.rerank({
          model: 'rerank-english-v3.0',
          query,
          documents,
          topN: topK,
        });

        // Map reranked results back to chunks
        // Cohere returns results array with index and relevance_score
        const rerankedChunks: RetrievedChunk[] = rerankResponse.results.map((result: any) => {
          const originalChunk = chunks[result.index];
          return {
            ...originalChunk,
            score: result.relevanceScore || result.relevance_score,
          };
        });

        logger.rag('Cohere reranker completed', { rerankedCount: rerankedChunks.length });
        return rerankedChunks;
      } catch (error: any) {
        logger.ragError('Cohere reranker failed, falling back to score-based sorting', error, {
          chunkCount: chunks.length,
        });
        // Fall through to score-based fallback
      }
    }

    // Priority 3: Fallback to score-based sorting
    logger.warn('Using score-based sorting fallback', { component: 'RAG', chunkCount: chunks.length });
    return chunks
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);
  }

  /**
   * Main retrieval function
   * Implements the hybrid retrieval pipeline:
   * 1. Parallel vector + graph search
   * 2. Merge & deduplicate
   * 3. Rerank to top-K
   */
  async retrieve(
    userQuery: string,
    userId: string,
    topK: number = 5
  ): Promise<RetrievalResult> {
    try {
      logger.rag('Starting hybrid retrieval', { userId, query: userQuery.substring(0, 100), topK });

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(userQuery);
      logger.debug('Query embedding generated', { userId, embeddingLength: queryEmbedding.length });

      // Step 1: Parallel Execution
      // Note: IndexedDB search happens on frontend, backend focuses on Pinecone and Neo4j
      logger.rag('Step 1: Running parallel searches', { userId });
      const [vectorChunks, graphChunks] = await Promise.all([
        this.vectorSearch(queryEmbedding, userId, 10),
        this.graphSearch(queryEmbedding, userId),
      ]);

      logger.rag('Parallel searches completed', { 
        userId, 
        vectorCount: vectorChunks.length, 
        graphCount: graphChunks.length 
      });

      // Step 2: Merge & Deduplicate
      logger.rag('Step 2: Merging and deduplicating', { userId });
      const allChunks = [...vectorChunks, ...graphChunks];
      const deduplicatedChunks = this.deduplicateChunks(allChunks);
      logger.rag('Deduplication completed', { 
        userId, 
        beforeDedup: allChunks.length, 
        afterDedup: deduplicatedChunks.length 
      });

      // Step 3: Rerank to Top-K
      logger.rag('Step 3: Reranking to top-K', { userId, topK });
      const rerankedChunks = await this.rerankChunks(deduplicatedChunks, userQuery, topK);

      logger.rag('Hybrid retrieval completed', { 
        userId, 
        finalChunkCount: rerankedChunks.length,
        vectorCount: vectorChunks.length,
        graphCount: graphChunks.length
      });

      return {
        chunks: rerankedChunks,
        vectorCount: vectorChunks.length,
        graphCount: graphChunks.length,
        rerankedCount: rerankedChunks.length,
      };
    } catch (error: any) {
      logger.ragError('Hybrid retrieval failed', error, { userId, query: userQuery.substring(0, 100) });
      return {
        chunks: [],
        vectorCount: 0,
        graphCount: 0,
        rerankedCount: 0,
      };
    }
  }

  /**
   * Check Neo4j database statistics (node and relationship counts)
   * Useful for monitoring AuraDB Free limits (200k nodes, 400k relationships)
   */
  async checkDatabaseStats(): Promise<{
    nodeCount: number;
    relationshipCount: number;
    warnings: string[];
  }> {
    // Initialize driver if needed (will get OAuth token)
    const initialized = await this.initializeNeo4jDriver();
    if (!initialized || !this.neo4jDriver) {
      return {
        nodeCount: 0,
        relationshipCount: 0,
        warnings: ['Neo4j driver not initialized or failed to connect'],
      };
    }

    const session: Session = this.neo4jDriver.session();
    const warnings: string[] = [];

    try {
      // Count all nodes
      const nodeResult = await session.run('MATCH (n) RETURN count(n) AS count');
      const nodeCount = nodeResult.records[0]?.get('count').toNumber() || 0;

      // Count all relationships
      const relResult = await session.run('MATCH ()-[r]->() RETURN count(r) AS count');
      const relationshipCount = relResult.records[0]?.get('count').toNumber() || 0;

      // Check against AuraDB Free limits
      const AURADB_FREE_NODE_LIMIT = 200000;
      const AURADB_FREE_REL_LIMIT = 400000;

      if (nodeCount >= AURADB_FREE_NODE_LIMIT * 0.9) {
        warnings.push(
          `⚠️  Node count (${nodeCount.toLocaleString()}) is approaching AuraDB Free limit (${AURADB_FREE_NODE_LIMIT.toLocaleString()})`
        );
      }

      if (relationshipCount >= AURADB_FREE_REL_LIMIT * 0.9) {
        warnings.push(
          `⚠️  Relationship count (${relationshipCount.toLocaleString()}) is approaching AuraDB Free limit (${AURADB_FREE_REL_LIMIT.toLocaleString()})`
        );
      }

      if (nodeCount >= AURADB_FREE_NODE_LIMIT) {
        warnings.push(
          `❌ Node limit exceeded! Current: ${nodeCount.toLocaleString()}, Limit: ${AURADB_FREE_NODE_LIMIT.toLocaleString()}`
        );
      }

      if (relationshipCount >= AURADB_FREE_REL_LIMIT) {
        warnings.push(
          `❌ Relationship limit exceeded! Current: ${relationshipCount.toLocaleString()}, Limit: ${AURADB_FREE_REL_LIMIT.toLocaleString()}`
        );
      }

      return {
        nodeCount,
        relationshipCount,
        warnings,
      };
    } catch (error: any) {
      console.error('Error checking database stats:', error);
      return {
        nodeCount: 0,
        relationshipCount: 0,
        warnings: [`Error checking stats: ${error.message}`],
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Refresh Neo4j OAuth token if expired
   * Called automatically before operations, but can be called manually
   */
  async refreshNeo4jToken(): Promise<boolean> {
    const token = await this.getNeo4jAccessToken();
    if (!token) {
      return false;
    }

    // If driver exists but token expired, recreate driver with new token
    if (this.neo4jDriver && Date.now() >= this.tokenExpiry) {
      try {
        await this.neo4jDriver.close();
        this.neo4jDriver = null;
      } catch (error) {
        // Ignore close errors
      }
    }

    return await this.initializeNeo4jDriver();
  }

  /**
   * Close Neo4j driver connection
   */
  async close(): Promise<void> {
    if (this.neo4jDriver) {
      await this.neo4jDriver.close();
      this.neo4jDriver = null;
      console.log('✅ Neo4j driver closed');
    }
  }
}

export const hybridRetrieverService = new HybridRetrieverService();
