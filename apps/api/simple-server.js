// Simple express server to test API connectivity
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Public health check
app.get('/api/public-health', (req, res) => {
  res.json({ status: 'ok', message: 'Simple API is running' });
});

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', message: 'Simple API is running' });
});

// AI query endpoint
app.post('/api/ai-query', (req, res) => {
  const { query } = req.body;
  console.log('Received AI query:', query);
  
  // Mock response
  setTimeout(() => {
    res.json({
      success: true,
      result: {
        response: `This is a mock response to your query: "${query}"`,
        data: { mockData: true, timestamp: new Date().toISOString() }
      }
    });
  }, 1000);
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple API server running on port ${PORT}`);
}); 