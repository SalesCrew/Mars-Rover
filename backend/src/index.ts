import express from 'express';
import cors from 'cors';
import marketsRouter from './routes/markets';
import actionHistoryRouter from './routes/actionHistory';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5000000mb' })); // Increase limit for large Excel files

// Routes
app.use('/api/markets', marketsRouter);
app.use('/api/action-history', actionHistoryRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Markets API available at http://localhost:${PORT}/api/markets`);
  console.log(`📜 Action History API available at http://localhost:${PORT}/api/action-history`);
});

