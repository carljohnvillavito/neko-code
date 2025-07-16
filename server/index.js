import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());

// THIS IS THE DEFINITIVE FIX:
// Increase the payload size limit for the Express server to handle large Base64 image strings.
app.use(express.json({ limit: '50mb' }));

// Root endpoint for health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Neko API is purring.' });
});

// API Routes
app.use('/api', aiRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
