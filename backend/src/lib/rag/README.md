# RAG Ingestion Service

Smart document ingestion pipeline for RAG (Retrieval-Augmented Generation) system.

## Overview

This service implements a "Smart Ingestion" pipeline that processes documents through:
1. **Global Summarization** - Generates document-level summary and category
2. **Smart Chunking** - Splits documents with context prepending
3. **Embedding Generation** - Creates vector embeddings using OpenAI
4. **Vector Storage** - Stores embeddings in Pinecone with metadata

## Features

- **Context Preservation**: Every chunk includes global document context to solve "Lost in the Middle" issues
- **Smart Chunking**: Uses RecursiveCharacterTextSplitter with 1000 char chunks and 100 char overlap
- **Metadata Rich**: Stores original text, page numbers, summaries, and labels in Pinecone
- **User Namespacing**: Supports multi-tenant architecture with userId-based namespacing

## Setup

### Environment Variables

Add these to your `backend/.env` file:

```env
# Required
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name

# Optional (for existing OpenAI key)
# Already configured if you have LLM features working
```

### Pinecone Setup

1. Create a Pinecone account at https://www.pinecone.io/
2. Create a new index with:
   - Dimensions: `1536` (for `text-embedding-3-small`)
   - Metric: `cosine`
   - Pod type: Choose based on your needs
3. Copy your API key and index name to `.env`

## Usage

### Basic Example

```typescript
import { ragIngestionService } from './lib/rag/ingest';

// Ingest from text
const result = await ragIngestionService.ingestDocument(
  'Your document text here...',
  'user-123' // userId for namespacing
);

if (result.success) {
  console.log(`✅ Ingested ${result.chunksAdded} chunks`);
  console.log(`Summary: ${result.summary}`);
  console.log(`Label: ${result.label}`);
} else {
  console.error(`❌ Error: ${result.error}`);
}
```

### From File Buffer

```typescript
import fs from 'fs';
import { ragIngestionService } from './lib/rag/ingest';

const fileBuffer = fs.readFileSync('document.txt');
const result = await ragIngestionService.ingestFromBuffer(
  fileBuffer,
  'user-123',
  1 // Optional page number
);
```

## Implementation Details

### Step 1: Global Summarization

- Takes entire document (or first 4k tokens)
- Uses GPT-4o-mini to generate:
  - 2-line summary
  - Category/label (e.g., "Financial Report", "Meeting Notes")

### Step 2: Smart Chunking

- Uses `RecursiveCharacterTextSplitter`:
  - Chunk size: 1000 characters
  - Overlap: 100 characters
- **Critical**: Each chunk is prepended with:
  ```
  [DOC_CTX: {Summary}]
  [DOC_LABEL: {Label}]
  ---
  {Actual Chunk Text}
  ```

### Step 3: Embedding & Storage

- Generates embeddings using `text-embedding-3-small`
- Upserts to Pinecone with metadata:
  - `original_text`: The chunk content
  - `page_number`: Page number (if provided)
  - `doc_summary`: Global document summary
  - `doc_label`: Document category/label
  - `userId`: User identifier for namespacing
  - `chunk_index`: Position of chunk in document

## API Reference

### `ingestDocument(text: string, userId: string, pageNumber?: number): Promise<IngestionResult>`

Main ingestion function for text documents.

**Parameters:**
- `text`: Raw document text
- `userId`: User ID for namespacing
- `pageNumber`: Optional page number for metadata

**Returns:**
```typescript
{
  success: boolean;
  chunksAdded: number;
  summary: string;
  label: string;
  error?: string;
}
```

### `ingestFromBuffer(buffer: Buffer, userId: string, pageNumber?: number): Promise<IngestionResult>`

Ingest from file buffer (converts to UTF-8 text).

**Parameters:**
- `buffer`: File buffer
- `userId`: User ID for namespacing
- `pageNumber`: Optional page number

**Returns:** Same as `ingestDocument`

## Error Handling

The service handles errors gracefully and returns detailed error messages:
- Missing API keys
- Empty documents
- Pinecone connection issues
- Embedding generation failures

## Next Steps

- [ ] Add PDF parsing support (using pdf-parse or similar)
- [ ] Add support for other file formats (DOCX, Markdown, etc.)
- [ ] Implement batch processing for multiple documents
- [ ] Add document update/delete functionality
- [ ] Create retrieval service for querying ingested documents
