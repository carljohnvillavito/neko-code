import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai.js';

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Neko API is purring.' });
});

app.use('/api', aiRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
