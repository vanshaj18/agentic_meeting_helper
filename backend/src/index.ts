import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sessionsRouter from './routes/sessions';
import documentsRouter from './routes/documents';
import agentsRouter from './routes/agents';
import templatesRouter from './routes/templates';
import llmRouter from './routes/llm';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/sessions', sessionsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/llm', llmRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
