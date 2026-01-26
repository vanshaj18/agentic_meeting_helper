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
│   │   │   └── rag/      # RAG ingestion pipeline
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
   - Set index dimensions to `1536` (for `text-embedding-3-small`)
   - Add to `backend/.env` as `PINECONE_API_KEY=your_key_here` and `PINECONE_INDEX_NAME=your_index_name`

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
- **Smart Ingestion**: Document processing with global summarization
- **Context-aware chunking**: Each chunk includes document-level context
- **Vector storage**: Pinecone integration for semantic search
- **Embedding generation**: OpenAI `text-embedding-3-small` embeddings
- **Metadata rich**: Stores summaries, labels, and user namespacing

See [RAG Ingestion Documentation](./backend/src/lib/rag/README.md) for detailed usage.

## API Endpoints

### LLM Endpoints
- `POST /api/llm/sessions/:sessionId/summary` - Generate session summary
- `POST /api/llm/sessions/:sessionId/ask` - Ask question (supports `useWebSearch` parameter)
- `POST /api/llm/sessions/:sessionId/answers` - Generate answers and insights

### RAG Endpoints
- Use `ragIngestionService.ingestDocument()` or `ragIngestionService.ingestFromBuffer()` directly
- See [RAG Documentation](./backend/src/lib/rag/README.md) for details

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
}
```

## Development Notes

### Rate Limits
- **Tavily**: 100 requests per minute (RPM)
- **Tavily Credits**: 1000 credits total (1 credit per basic search)
- Credits reset on server restart (in-memory tracking)

### RAG Pipeline
- Chunk size: 1000 characters
- Chunk overlap: 100 characters
- Embedding model: `text-embedding-3-small` (1536 dimensions)
- Pinecone batch size: 100 vectors per upsert

## Next Steps

1. **Database Integration**: Replace in-memory storage with a database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Add user authentication and authorization
3. **File Upload**: Implement actual file upload handling for PDFs
4. **Real-time Features**: Add WebSocket support for real-time updates
5. **Testing**: Add unit and integration tests
6. **RAG Retrieval**: Implement query retrieval from Pinecone
7. **Credit Persistence**: Store credit usage in database for persistence

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
