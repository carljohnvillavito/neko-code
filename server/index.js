import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*'
}));;
app.use(express.json());

//Image Size Limit
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api', aiRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'This API is purring.' });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
