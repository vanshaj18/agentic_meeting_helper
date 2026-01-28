# Hybrid RAG Retriever Service

Hybrid retrieval system that combines Vector Search (Pinecone) with Graph Traversal (Neo4j) and Reranking (Cohere) for optimal RAG performance.

## Overview

This service implements a **Hybrid Retriever** that:
1. Runs **parallel searches** (Vector + Graph)
2. **Merges and deduplicates** results
3. **Reranks** to top-K most relevant chunks

## Architecture

### Step 1: Parallel Execution

**Branch A: Vector Search (Pinecone)**
- Embeds user query using OpenAI `text-embedding-3-small`
- Queries Pinecone for top 10 chunks
- Filters by `userId` namespace

**Branch B: Graph Context Search (Neo4j)**
- Uses vector index to find semantically closest node
- Traverses to Head Node (Document root)
- Extracts shortest path: `HeadNode -> TargetNode`
- Formats as hierarchical text: "Document: X > Section: Y > Content: Z"

### Step 2: Merge & Deduplicate
- Combines results from both branches
- Removes duplicates by ID or content hash

### Step 3: Reranking
- Uses Cohere Rerank API (or score-based fallback)
- Selects top 5 most relevant results

## Setup

### Environment Variables

Add these to your `backend/.env` file:

```env
# Required for vector search
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name

# Required for graph traversal (Neo4j AuraDB OAuth)
NEO4J_URI=neo4j+s://<instance-id>.databases.neo4j.io
NEO4J_CLIENT_ID=your_client_id
NEO4J_CLIENT_SECRET=your_client_secret

# Optional: For reranking (falls back to score-based if not provided)
COHERE_API_KEY=your_cohere_api_key
```

### Neo4j AuraDB Setup

1. **Create AuraDB Instance**:
   - Sign up at [neo4j.com/cloud/aura](https://neo4j.com/cloud/aura/)
   - Create a new AuraDB Free or Professional instance
   - Copy the connection URI (format: `neo4j+s://<instance-id>.databases.neo4j.io`)

2. **Set up OAuth Credentials**:
   - Go to your AuraDB instance dashboard
   - Navigate to "API" or "OAuth" section
   - Create OAuth credentials (Client ID and Client Secret)
   - Save these credentials securely

   **⚠️ Important Limits (AuraDB Free)**:
   - **200,000 nodes** maximum
   - **400,000 relationships** maximum
   - Monitor your usage to avoid hitting these limits
   - Consider upgrading to Professional tier for higher limits

2. **Connection URI Formats**:
   - **AuraDB Free/Professional**: `neo4j+s://<instance-id>.databases.neo4j.io`
   - **AuraDB with Self-Signed Cert**: `neo4j+ssc://<instance-id>.databases.neo4j.io`
   - The driver automatically handles SSL/TLS encryption

3. **Create Vector Index** (for semantic search):
   ```cypher
   CREATE VECTOR INDEX chunkEmbedding IF NOT EXISTS
   FOR (n:Chunk)
   ON n.embedding
   OPTIONS {
     indexConfig: {
       `vector.dimensions`: 1536,
       `vector.similarity_function`: 'cosine'
     }
   }
   ```

4. **Graph Schema**:
   - `Document` nodes (root/head nodes)
   - `Chunk` nodes (leaf nodes with embeddings)
   - Relationships: `Document-[*]->Chunk` (hierarchical structure)

3. **OAuth Authentication**:
   - The service uses OAuth token-based authentication
   - Tokens are automatically obtained from `https://api.neo4j.io/oauth/token`
   - Tokens are cached and automatically refreshed when expired
   - No manual token management required

### AuraDB OAuth Connection Example

After creating your AuraDB instance and OAuth credentials:

```
URI: neo4j+s://xxxxx.databases.neo4j.io
Client ID: your_client_id
Client Secret: your_client_secret
```

Add these to your `.env` file:
```env
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_CLIENT_ID=your_client_id
NEO4J_CLIENT_SECRET=your_client_secret
```

**Note**: The service automatically handles OAuth token acquisition and refresh. Tokens typically expire after 1 hour and are refreshed automatically.

### Cohere Setup (Optional)

1. Sign up at [cohere.com](https://cohere.com/)
2. Get your API key
3. Add to `.env` as `COHERE_API_KEY=your_key`

## Usage

### Basic Example

```typescript
import { hybridRetrieverService } from './lib/rag/retrieve';

const result = await hybridRetrieverService.retrieve(
  'What is the main topic discussed?',
  'user-123', // userId for filtering
  5 // top-K results
);

console.log(`Found ${result.chunks.length} chunks`);
console.log(`Vector: ${result.vectorCount}, Graph: ${result.graphCount}`);

result.chunks.forEach((chunk, idx) => {
  console.log(`${idx + 1}. [${chunk.source}] ${chunk.text.substring(0, 100)}...`);
  console.log(`   Score: ${chunk.score}`);
});
```

### Integration with LLM

```typescript
import { hybridRetrieverService } from './lib/rag/retrieve';
import { llmService } from '../../services/llmService';

async function answerWithRAG(question: string, userId: string) {
  // Retrieve relevant context
  const retrievalResult = await hybridRetrieverService.retrieve(
    question,
    userId,
    5
  );

  // Combine retrieved chunks into context
  const context = retrievalResult.chunks
    .map((chunk, idx) => `[${idx + 1}] ${chunk.text}`)
    .join('\n\n');

  // Use with LLM (example - adapt to your LLM service)
  const prompt = `Context:\n${context}\n\nQuestion: ${question}`;
  // ... send to LLM
}
```

## API Reference

### `retrieve(userQuery: string, userId: string, topK?: number): Promise<RetrievalResult>`

Main retrieval function.

**Parameters:**
- `userQuery`: The user's query/question
- `userId`: User ID for namespacing/filtering
- `topK`: Number of top results to return (default: 5)

**Returns:**
```typescript
{
  chunks: RetrievedChunk[];
  vectorCount: number;
  graphCount: number;
  rerankedCount: number;
}
```

### `RetrievedChunk` Interface

```typescript
{
  id: string;
  text: string;
  score?: number;
  metadata?: Record<string, any>;
  source: 'vector' | 'graph';
}
```

## Neo4j Cypher Queries

### Shortest Path Query

The service uses this Cypher query to find the shortest path:

```cypher
MATCH path = shortestPath(
  (head:Document {id: $headId})-[*]->(target:Chunk {id: $targetId})
)
WHERE head.userId = $userId
RETURN path
LIMIT 1
```

### Vector Index Query

For semantic search in Neo4j:

```cypher
CALL db.index.vector.queryNodes('chunkEmbedding', $topK, $embedding)
YIELD node, score
WHERE node.userId = $userId
RETURN node.id AS targetId, node.text AS targetText, score
ORDER BY score DESC
LIMIT 1
```

## Error Handling

The service handles errors gracefully:
- **Pinecone unavailable**: Returns empty vector results, continues with graph
- **Neo4j unavailable**: Returns empty graph results, continues with vector
- **Cohere unavailable**: Falls back to score-based sorting
- **Vector index missing**: Uses text-based fallback search

## Performance Considerations

- **Parallel execution**: Vector and Graph searches run simultaneously
- **Batch processing**: Embeddings generated efficiently
- **Deduplication**: Prevents duplicate context in results
- **Top-K limiting**: Reduces token usage in LLM context

## Monitoring & Limits

### AuraDB Free Instance Limits

- **200,000 nodes** maximum
- **400,000 relationships** maximum

### Check Database Statistics

Use the `checkDatabaseStats()` method to monitor your usage:

```typescript
const stats = await hybridRetrieverService.checkDatabaseStats();

console.log(`Nodes: ${stats.nodeCount.toLocaleString()}`);
console.log(`Relationships: ${stats.relationshipCount.toLocaleString()}`);

if (stats.warnings.length > 0) {
  stats.warnings.forEach(warning => console.warn(warning));
}
```

The method will warn you when you're approaching 90% of the limits.

## Next Steps

- [ ] Add caching for frequently asked queries
- [ ] Implement query expansion for better retrieval
- [ ] Add support for multiple graph traversal strategies
- [ ] Implement hybrid scoring (combine vector + graph scores)
- [ ] Add monitoring and metrics for retrieval performance
- [ ] Implement automatic cleanup of old nodes/relationships to stay within limits
