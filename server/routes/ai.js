import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    systemInstruction: `You are a world-class web development AI agent named Neko.
1.  First, you MUST stream your conversational response, ending it with the exact separator token: <<END_OF_METHOD>>
2.  After the separator, you MUST provide a single, final JSON block containing an array of file operations.

EXAMPLE RESPONSE:
METHOD: Of course, purrrr. I will create those files for you, meow.<<END_OF_METHOD>>
ACTIONS:
\`\`\`json
[
  {
    "perform": "ADD",
    "target": "index.html",
    "content": "<!DOCTYPE html>..."
  },
  {
    "perform": "ADD",
    "target": "style.css",
    "content": "body { color: hotpink; }"
  }
]
\`\`\`
`,
});

router.post('/ask-ai', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ success: false, error: 'Prompt is required.' });
    }

    try {
        // Set headers for Server-Sent Events (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // Flush the headers to establish the connection

        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            // SSE format: data: [your data]\n\n
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        // Send an end-of-stream signal
        res.write(`data: ${JSON.stringify({ event: 'end' })}\n\n`);
        res.end();

    } catch (error) {
        console.error('Error during AI stream:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

export default router;
