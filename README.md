# AI Remote Work - Meeting Session Management

A full-stack React + TypeScript + Node.js application for managing meeting sessions with AI-powered assistance, web search integration, and RAG (Retrieval-Augmented Generation) capabilities.

## Project Structure

```
ai_remote_work/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context for state management
│   │   ├── services/     # API service layer
│   │   └── App.tsx       # Main app component
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── lib/          # Library modules
│   │   │   └── rag/      # RAG pipeline (ingestion & retrieval)
│   │   └── index.ts      # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── shared/               # Shared TypeScript types
│   └── types/
│       └── index.ts
└── package.json          # Root package.json for workspace

```

## Features

### Core Features
- **Session Management**: Create, review, delete, and manage meeting sessions
- **Knowledge Base**: Upload and manage documents and cue cards with PDF viewer
- **Agent Store**: Pre-defined and custom AI agents for meeting assistance
- **Templates**: Create reusable meeting templates with agents, documents, and cue cards
- **Active Session**: 
  - Screen/tab sharing integration with Google Meet, MS Teams, Zoom
  - Real-time Speech-to-Text using Web Speech API
  - Broadcast Channel API for meeting platform integration
  - AI-powered chat with session context (agents, documents)

### AI & LLM Features
- **LLM Integration**: OpenAI-powered AI features (summary, Q&A, insights)
- **Web Search Integration**: Tavily API integration for real-time web search
  - Globe icon toggle to enable/disable web search per query
  - Rate limiting: 100 requests per minute
  - Credit tracking: 1000 credits limit with usage monitoring
- **RAG Pipeline**: Smart document ingestion with vector storage
  - Global document summarization
  - Context-aware chunking
  - Pinecone vector database integration
  - OpenAI embeddings (`text-embedding-3-small`)

### UI/UX
- **Responsive Design**: Mobile-first responsive UI
- **Modern Chat Interface**: Clean chat UI with user/AI message distinction
- **Web Search Toggle**: Visual indicator for web search enabled/disabled

## Prerequisites

- Node.js 18+ and npm
- TypeScript knowledge
- **Required API Keys**:
  - **OpenAI API Key** (for LLM features and embeddings)
    - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
  - **Tavily API Key** (optional, for web search features)
    - Get your API key from [Tavily](https://tavily.com/)
  - **Pinecone API Key** (optional, for RAG features)
    - Get your API key from [Pinecone](https://www.pinecone.io/)

## Installation

1. **Set up environment variables**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY from Google AI Studio
   ```

2. **Install all dependencies** (root, frontend, and backend):
   ```bash
   npm run install:all
   ```

   Or install individually:
   ```bash
   # Root dependencies
   npm install

   # Frontend dependencies
   cd frontend && npm install && cd ..

   # Backend dependencies
   cd backend && npm install && cd ..
   ```

## Development

### Run both frontend and backend concurrently:
```bash
npm run dev
```

### Run individually:

**Backend** (runs on http://localhost:3001):
```bash
npm run dev:backend
# or
cd backend && npm run dev
```

**Frontend** (runs on http://localhost:3000):
```bash
npm run dev:frontend
# or
cd frontend && npm run dev
```

The frontend is configured to proxy API requests to the backend automatically.

## Building for Production

```bash
# Build both frontend and backend
npm run build

# Build individually
npm run build:frontend
npm run build:backend
```

## Project Architecture

### Frontend Structure

- **Components**: Reusable UI components (Sidebar, MobileHeader, Modals)
- **Pages**: Main page components (HomePage, SessionsPage, etc.)
- **Context**: React Context API for global state management
- **Services**: API service layer using Axios
- **Types**: Shared TypeScript types from `shared/types`

### Backend Structure

- **Routes**: Express route handlers organized by resource (sessions, documents, agents)
- **Services**: Business logic and data management (currently in-memory, ready for database integration)
- **Types**: Shared TypeScript types

### Shared Types

All TypeScript interfaces are defined in `shared/types/index.ts` and imported by both frontend and backend.

## API Endpoints

### Sessions
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session

### Documents
- `GET /api/documents?type=document|cuecard` - Get documents
- `POST /api/documents` - Create document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Agents
- `GET /api/agents?type=predefined|my` - Get agents
- `GET /api/agents/:id` - Get agent by ID
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Axios (HTTP client)

### Backend
- Node.js
- Express.js
- TypeScript
- CORS enabled
- OpenAI SDK (for LLM and embeddings)
- Tavily SDK (for web search)
- Pinecone SDK (for vector database)
- Neo4j Driver (for graph database - AuraDB)
- Cohere SDK (for reranking)
- LangChain (for text processing)

## Environment Setup

Create a `.env` file in the `backend` directory with the following variables:

```bash
cd backend
cp .env.example .env
# Edit .env and add your API keys
```

### Required Environment Variables

```env
# Required: OpenAI API Key (for LLM features and embeddings)
OPENAI_API_KEY=your_openai_api_key_here
```

### Optional Environment Variables

```env
# Optional: Tavily API Key (for web search features)
TAVILY_API_KEY=tvly-your_tavily_api_key_here

# Optional: Pinecone Configuration (for RAG features)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=your_index_name_here
PINECONE_REGION=us-east-1
EMBEDDING_MODEL=llama-text-embed-v2
EMBEDDING_DIMENSIONS=1024

# Optional: Neo4j AuraDB Configuration (for RAG graph traversal - OAuth)
NEO4J_URI=neo4j+s://<instance-id>.databases.neo4j.io
NEO4J_CLIENT_ID=your_client_id
NEO4J_CLIENT_SECRET=your_client_secret

# Optional: Cohere API Key (for RAG reranking fallback)
COHERE_API_KEY=your_cohere_api_key

# Optional: Jina API Key (for high-speed race reranker - Racer A)
JINA_API_KEY=jina_your_jina_api_key_here

# Optional: Hugging Face Token (for high-speed race reranker - Racer B)
HF_TOKEN=your_huggingface_token_here

# Optional: Groq API Key (for high-speed race reranker - Racer C: Listwise Llama)
GROQ_API_KEY=your_groq_api_key_here
```

### Getting API Keys

1. **OpenAI API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Add to `backend/.env` as `OPENAI_API_KEY=your_key_here`

2. **Tavily API Key** (for web search):
   - Visit [Tavily](https://tavily.com/)
   - Sign up and get your API key
   - Add to `backend/.env` as `TAVILY_API_KEY=tvly-your_key_here`

3. **Pinecone API Key** (for RAG):
   - Visit [Pinecone](https://www.pinecone.io/)
   - Create an account and index
   - **Hosted on AWS**: Configure index in AWS us-east-1 region
   - Set index dimensions to `1024` (for `llama-text-embed-v2`)
   - Add to `backend/.env` as:
     - `PINECONE_API_KEY=your_key_here`
     - `PINECONE_INDEX_NAME=your_index_name`
     - `PINECONE_REGION=us-east-1` (optional, defaults to us-east-1)
     - `EMBEDDING_MODEL=llama-text-embed-v2` (optional, defaults to llama-text-embed-v2)
     - `EMBEDDING_DIMENSIONS=1024` (optional, defaults to 1024)

4. **Neo4j AuraDB** (for RAG graph traversal):
   - Visit [Neo4j AuraDB](https://neo4j.com/cloud/aura/)
   - Create a free or professional AuraDB instance
   - Copy the connection URI (format: `neo4j+s://<instance-id>.databases.neo4j.io`)
   - Create OAuth credentials (Client ID and Client Secret) in the AuraDB dashboard
   - Add to `backend/.env` as `NEO4J_URI=your_uri`, `NEO4J_CLIENT_ID=your_client_id`, and `NEO4J_CLIENT_SECRET=your_client_secret`
   - **⚠️ AuraDB Free Limits**: 200,000 nodes and 400,000 relationships maximum
   - **Note**: Uses OAuth token authentication (tokens auto-refresh)

5. **Cohere API Key** (optional, for RAG reranking fallback):
   - Visit [Cohere](https://cohere.com/)
   - Sign up and get your API key
   - Add to `backend/.env` as `COHERE_API_KEY=your_key_here`

6. **Jina API Key** (optional, for high-speed race reranker - Racer A):
   - Visit [Jina AI](https://jina.ai/)
   - Sign up and get your API key
   - Add to `backend/.env` as `JINA_API_KEY=jina_your_key_here`
   - Used in race reranker for sub-second latency (<1000ms)

7. **Hugging Face Token** (optional, for high-speed race reranker - Racer B):
   - Visit [Hugging Face](https://huggingface.co/)
   - Create an account and generate an access token
   - Add to `backend/.env` as `HF_TOKEN=your_token_here`
   - Used in race reranker for sub-second latency (<1000ms)

8. **Groq API Key** (optional, for race reranker and RAG generation):
   - Visit [Groq](https://console.groq.com/)
   - Create an account and generate an API key
   - Add to `backend/.env` as `GROQ_API_KEY=your_key_here`
   - **Race Reranker**: Uses `llama3-8b-8192` model for fast listwise ranking (sub-second latency)
   - **RAG Generation**: Uses `llama-3.3-70b-versatile` model for high-quality answer generation with citations
   - **Note**: At least one reranker (Jina, HF, or Groq) should be configured for race reranker to work

## Feature Details

### LLM Integration (OpenAI API)
- **Agent-based processing**: Modular LLM agents for different tasks
- **Session Summary**: Auto-generates meeting summaries using GPT-4o-mini
- **Ask AI**: Interactive Q&A about session content
- **Answers & Insights**: Generates key insights from conversations
- **Dynamic agent selection**: Use predefined agents for specialized processing

### Web Search Integration (Tavily)
- **Real-time web search**: Search the web for additional context during Q&A
- **Toggle control**: Globe icon to enable/disable web search per query
- **Rate limiting**: 100 requests per minute (RPM) limit
- **Credit tracking**: 1000 credits limit with usage monitoring
- **Smart context**: Web search results automatically included in LLM context

### RAG Pipeline (Retrieval-Augmented Generation)

#### Ingestion
- **Smart Ingestion**: Document processing with global summarization
- **Context-aware chunking**: Each chunk includes document-level context
- **Dynamic Storage Strategy**:
  - **Files < 5MB**: Stored in client-side IndexedDB (fast, local access)
  - **Files >= 5MB**: Stored in Pinecone (cloud vector database)
- **Vector storage**: Pinecone integration for semantic search (large files)
- **Client-side storage**: IndexedDB for small files (fast retrieval, offline support)
- **Embedding generation**: Pinecone Inference API `llama-text-embed-v2` (1024 dimensions) with OpenAI fallback
- **Metadata rich**: Stores summaries, labels, and user namespacing

#### Hybrid Retrieval
- **Vector Search**: Pinecone semantic search (top 10 chunks)
- **Graph Traversal**: Neo4j AuraDB shortest path extraction
- **Parallel Execution**: Both searches run simultaneously for performance
- **High-Speed Race Reranker**: Sub-second latency (<1000ms) reranking system
  - **Racer A**: Jina Rerank API (fast, commercial)
  - **Racer B**: Hugging Face Inference API with `BAAI/bge-reranker-v2-m3` (SOTA open source)
  - **Racer C**: Groq Llama Listwise Reranker (`llama3-8b-8192`) - Fast LLM-based ranking
  - **Race Logic**: All configured rerankers race in parallel; first to return wins
  - **Timeout**: 950ms timeout to guarantee sub-second SLA
  - **Fallback**: Falls back to Cohere reranker or score-based sorting if race reranker unavailable
- **OAuth Authentication**: Automatic token management for Neo4j AuraDB

#### Generation
- **Context Formatting**: Formats reranked documents into structured context blocks with citations
- **Source Attribution**: Each document includes source ID, origin type (Graph-Node/Vector-Chunk), and context metadata
- **Citation Generation**: Uses Groq `llama-3.3-70b-versatile` for high-quality reasoning with automatic citation extraction
- **Strict Context**: System prompt enforces citation rules and prevents hallucination
- **Citation Extraction**: Automatically extracts `[Source: X]` patterns from generated text
- **Deduplication**: Removes duplicate chunks from combined results

See [RAG Documentation](./backend/src/lib/rag/README.md) and [Retrieval Documentation](./backend/src/lib/rag/retrieve-README.md) for detailed usage.

## API Endpoints

### LLM Endpoints
- `POST /api/llm/sessions/:sessionId/summary` - Generate session summary
- `POST /api/llm/sessions/:sessionId/ask` - Ask question (supports `useWebSearch` parameter)
- `POST /api/llm/sessions/:sessionId/answers` - Generate answers and insights

### RAG Services

**Ingestion**:
- `ragIngestionService.ingestDocument(text, userId, pageNumber?)` - Ingest text document
- `ragIngestionService.ingestFromBuffer(buffer, userId, pageNumber?)` - Ingest from file buffer

**Retrieval**:
- `hybridRetrieverService.retrieve(query, userId, topK?)` - Hybrid retrieval (vector + graph)
- `hybridRetrieverService.checkDatabaseStats()` - Monitor Neo4j usage and limits

See [RAG Documentation](./backend/src/lib/rag/README.md) and [Retrieval Documentation](./backend/src/lib/rag/retrieve-README.md) for details.

## Usage Examples

### Web Search in Chat
1. Type your question in the chat input
2. Click the globe icon to enable web search (icon turns blue when enabled)
3. Click send to submit with web search context

### RAG Document Ingestion
```typescript
import { ragIngestionService } from './backend/src/lib/rag/ingest';

const result = await ragIngestionService.ingestDocument(
  'Your document text...',
  'user-123'
);

if (result.success) {
  console.log(`Ingested ${result.chunksAdded} chunks`);
  console.log(`Summary: ${result.summary}`);
  console.log(`Label: ${result.label}`);
}
```

### RAG Hybrid Retrieval
```typescript
import { hybridRetrieverService } from './backend/src/lib/rag/retrieve';

const result = await hybridRetrieverService.retrieve(
  'What is the main topic?',
  'user-123',
  5 // top-K results
);

console.log(`Found ${result.chunks.length} chunks`);
console.log(`Vector: ${result.vectorCount}, Graph: ${result.graphCount}`);

// Check database statistics
const stats = await hybridRetrieverService.checkDatabaseStats();
console.log(`Nodes: ${stats.nodeCount}, Relationships: ${stats.relationshipCount}`);
```

### RAG Generation (Complete Pipeline)
```typescript
import { hybridRetrieverService } from './backend/src/lib/rag/retrieve';
import { generateAnswer } from './backend/src/lib/rag/generate';

// Step 1: Retrieve relevant documents
const retrievalResult = await hybridRetrieverService.retrieve(
  'What were the key financial results?',
  'user-123',
  5
);

// Step 2: Generate answer with citations
const generationResult = await generateAnswer(
  'What were the key financial results?',
  retrievalResult.chunks.map(chunk => ({
    id: chunk.id,
    content: chunk.text,
    original_score: chunk.score,
    metadata: chunk.metadata,
  })),
  5 // top-K documents to use
);

console.log(`Answer: ${generationResult.answer}`);
console.log(`Citations: ${generationResult.citations.join(', ')}`);
```

## Development Notes

### Rate Limits
- **Tavily**: 100 requests per minute (RPM)
- **Tavily Credits**: 1000 credits total (1 credit per basic search)
- Credits reset on server restart (in-memory tracking)

### RAG Pipeline

**Ingestion**:
- Chunk size: 1000 characters
- Chunk overlap: 100 characters
- **File size threshold**: 5MB (determines storage location)
- **Small files (< 5MB)**: Client-side IndexedDB storage
  - Fast local access
  - Offline support
  - No server round-trip
- **Large files (>= 5MB)**: Pinecone cloud storage
  - Scalable vector search
  - Server-side processing
- Embedding model: `llama-text-embed-v2` via Pinecone Inference API (1024 dimensions)
- Pinecone region: AWS us-east-1
- Pinecone batch size: 100 vectors per upsert
- Fallback: OpenAI `text-embedding-3-small` if Pinecone Inference API unavailable

**Retrieval**:
- Vector search: Top 10 chunks from Pinecone
- Graph search: Shortest path extraction from Neo4j
- Reranking: Top 5 results using race reranker (Jina/HF/Groq race) → Cohere fallback → score-based fallback
- OAuth token refresh: Automatic refresh 100 seconds before expiry

**Generation**:
- Model: Groq `llama-3.3-70b-versatile` for high-quality reasoning
- Context formatting: Structured blocks with source IDs, origin types, and metadata
- Citation extraction: Automatic extraction of `[Source: X]` patterns from generated text
- Temperature: 0.3 for factual accuracy
- Max tokens: 1024 for comprehensive answers

## Next Steps

1. **Database Integration**: Replace in-memory storage with a database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Add user authentication and authorization
3. **File Upload**: Implement actual file upload handling for PDFs
4. **Real-time Features**: Add WebSocket support for real-time updates
5. **Testing**: Add unit and integration tests
6. **RAG Integration**: Integrate hybrid retriever with LLM service for enhanced Q&A
7. **Credit Persistence**: Store credit usage in database for persistence
8. **Graph Schema**: Implement automatic graph schema creation during ingestion

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
