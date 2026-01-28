/**
 * IndexedDB Service for Client-Side Chunk Storage
 * Stores document chunks locally for files < 5MB
 */

interface ChunkData {
  id: string;
  documentId: number;
  userId: string;
  content: string;
  embedding?: number[];
  metadata: {
    doc_summary: string;
    doc_label: string;
    chunk_index: number;
    original_text: string;
    page_number?: number;
  };
  createdAt: number;
}

interface DocumentMetadata {
  documentId: number;
  userId: string;
  title: string;
  label: string;
  summary: string;
  chunkCount: number;
  createdAt: number;
}

/**
 * LocalDoc schema for page-based document storage
 */
export interface LocalDoc {
  id: string; // file name + timestamp
  name: string;
  pages: {
    pageNum: number;
    summary: string;
    content: string;
    embedding: number[]; // Float32Array converted to number[]
  }[];
  timestamp: number;
}

const DB_NAME = 'rag-chunks-db';
const DB_VERSION = 2; // Increment version for schema update
const CHUNKS_STORE = 'chunks';
const DOCUMENTS_STORE = 'documents';
const LOCAL_DOCS_STORE = 'local_documents'; // New store for LocalDoc schema

class IndexedDBService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create chunks object store
        if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
          const chunksStore = db.createObjectStore(CHUNKS_STORE, { keyPath: 'id' });
          chunksStore.createIndex('documentId', 'documentId', { unique: false });
          chunksStore.createIndex('userId', 'userId', { unique: false });
        }

        // Create documents metadata store
        if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
          const docsStore = db.createObjectStore(DOCUMENTS_STORE, { keyPath: 'documentId' });
          docsStore.createIndex('userId', 'userId', { unique: false });
        }

        // Create local_documents store for page-based storage
        if (!db.objectStoreNames.contains(LOCAL_DOCS_STORE)) {
          const localDocsStore = db.createObjectStore(LOCAL_DOCS_STORE, { keyPath: 'id' });
          localDocsStore.createIndex('name', 'name', { unique: false });
          localDocsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Store chunks for a document
   */
  async storeChunks(
    documentId: number,
    userId: string,
    chunks: Array<{
      content: string;
      embedding?: number[];
      metadata: {
        doc_summary: string;
        doc_label: string;
        chunk_index: number;
        original_text: string;
        page_number?: number;
      };
    }>,
    documentMeta: {
      title: string;
      label: string;
      summary: string;
    }
  ): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHUNKS_STORE, DOCUMENTS_STORE], 'readwrite');
      const chunksStore = transaction.objectStore(CHUNKS_STORE);
      const docsStore = transaction.objectStore(DOCUMENTS_STORE);

      // Store document metadata
      const docMetadata: DocumentMetadata = {
        documentId,
        userId,
        title: documentMeta.title,
        label: documentMeta.label,
        summary: documentMeta.summary,
        chunkCount: chunks.length,
        createdAt: Date.now(),
      };

      docsStore.put(docMetadata);

      // Store chunks
      chunks.forEach((chunk, idx) => {
        const chunkData: ChunkData = {
          id: `doc_${documentId}_chunk_${idx}`,
          documentId,
          userId,
          content: chunk.content,
          embedding: chunk.embedding,
          metadata: chunk.metadata,
          createdAt: Date.now(),
        };
        chunksStore.put(chunkData);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Search chunks by query (simple text search for now)
   * In production, you'd want to implement semantic search with embeddings
   */
  async searchChunks(
    query: string,
    userId: string,
    documentId?: number,
    topK: number = 5
  ): Promise<ChunkData[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHUNKS_STORE], 'readonly');
      const store = transaction.objectStore(CHUNKS_STORE);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        let chunks: ChunkData[] = request.result;

        // Filter by documentId if provided
        if (documentId !== undefined) {
          chunks = chunks.filter((chunk) => chunk.documentId === documentId);
        }

        // Simple text-based search (in production, use embeddings for semantic search)
        const queryLower = query.toLowerCase();
        const scoredChunks = chunks.map((chunk) => {
          const contentLower = chunk.content.toLowerCase();
          const score = contentLower.includes(queryLower) ? 1 : 0;
          return { chunk, score };
        });

        // Sort by score and take top-K
        scoredChunks.sort((a, b) => b.score - a.score);
        const topChunks = scoredChunks
          .slice(0, topK)
          .map((item) => item.chunk);

        resolve(topChunks);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all chunks for a document
   */
  async getDocumentChunks(documentId: number, userId: string): Promise<ChunkData[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHUNKS_STORE], 'readonly');
      const store = transaction.objectStore(CHUNKS_STORE);
      const index = store.index('documentId');
      const request = index.getAll(documentId);

      request.onsuccess = () => {
        const chunks = request.result.filter((chunk) => chunk.userId === userId);
        resolve(chunks);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete all chunks for a document
   */
  async deleteDocumentChunks(documentId: number): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHUNKS_STORE, DOCUMENTS_STORE], 'readwrite');
      const chunksStore = transaction.objectStore(CHUNKS_STORE);
      const docsStore = transaction.objectStore(DOCUMENTS_STORE);
      const index = chunksStore.index('documentId');
      const request = index.getAll(documentId);

      request.onsuccess = () => {
        const chunks = request.result;
        chunks.forEach((chunk) => {
          chunksStore.delete(chunk.id);
        });
        docsStore.delete(documentId);
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Check if document is stored in IndexedDB
   */
  async hasDocument(documentId: number): Promise<boolean> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DOCUMENTS_STORE], 'readonly');
      const store = transaction.objectStore(DOCUMENTS_STORE);
      const request = store.get(documentId);

      request.onsuccess = () => {
        resolve(request.result !== undefined);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get document metadata
   */
  async getDocumentMetadata(documentId: number): Promise<DocumentMetadata | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DOCUMENTS_STORE], 'readonly');
      const store = transaction.objectStore(DOCUMENTS_STORE);
      const request = store.get(documentId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all document metadata for a user
   */
  async getAllDocumentMetadata(userId: string): Promise<DocumentMetadata[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DOCUMENTS_STORE], 'readonly');
      const store = transaction.objectStore(DOCUMENTS_STORE);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store LocalDoc (page-based document structure)
   */
  async storeLocalDoc(localDoc: LocalDoc): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([LOCAL_DOCS_STORE], 'readwrite');
      const store = transaction.objectStore(LOCAL_DOCS_STORE);
      const request = store.put(localDoc);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get LocalDoc by ID
   */
  async getLocalDoc(id: string): Promise<LocalDoc | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([LOCAL_DOCS_STORE], 'readonly');
      const store = transaction.objectStore(LOCAL_DOCS_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all LocalDocs
   */
  async getAllLocalDocs(): Promise<LocalDoc[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([LOCAL_DOCS_STORE], 'readonly');
      const store = transaction.objectStore(LOCAL_DOCS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete LocalDoc by ID
   */
  async deleteLocalDoc(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([LOCAL_DOCS_STORE], 'readwrite');
      const store = transaction.objectStore(LOCAL_DOCS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBService = new IndexedDBService();
