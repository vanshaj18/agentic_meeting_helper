# Agentic Meeting Helper

A full-stack app for interactive, AI-powered meeting sessions, knowledge management, and agent/automation workflows. Combines React, TypeScript (frontend), Node.js/Express (backend), and modern LLM + Retrieval techniques.

---

## Key Features

- **Session Management:** Create/review/manage/delete meetings
- **Knowledge Base:** Upload/manage documents, cue cards; PDF support
- **Agent Store:** Use/bundle pre-defined or custom AI helper agents
- **Active Meeting Support:** 
  - Screen/tab sharing with Google Meet, MS Teams, Zoom
  - Realtime Speech-to-Text, multi-device sync
  - AI chat with session/agent/document knowledge
- **Templates:** Reusable meeting templates (agents/documents/cue cards)
- **Email Recaps:** Automated professional meeting recap emails with transcript
- **Web Search:** On-demand live search for AI answers (Tavily API integration)
- **RAG Pipeline:** Smart vector retrieval, Graph search, ultra-fast reranking (Jina/HF/Groq/Cohere), citation-aware synthesis
- **Modern UI:** Responsive, chat-focused design

---

## Installation

### Requirements

- Node.js (18+), npm
- API keys for OpenAI (required), optional: Tavily, Pinecone, Neo4j, Cohere, Groq, etc.

### Setup Steps

1. **Clone & prepare:**
   ```bash
   git clone <repo-url>
   cd ai_remote_work
   ```

2. **Environment config:**
   ```bash
   cd backend
   cp .env.example .env
   # Fill in required API keys (at least OPENAI_API_KEY)
   ```

3. **Install dependencies:**
   ```bash
   npm run install:all
   # (Or install root, frontend, and backend individually)
   ```

4. **Run for development:**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

5. **Build for production:**
   ```bash
   npm run build
   ```

---