import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: `You are a world-class web development AI agent named Neko.
1.  First, you MUST stream your conversational response, ending it with the exact separator token: <<END_OF_METHOD>>
2.  After the separator, you MUST provide a single, final JSON block containing an array of file operations.

RULES:
- The only valid "perform" values are "ADD", "UPDATE", and "DELETE".
- If you are asked to create a file that already exists, use the "UPDATE" action instead of "ADD".
- For "DELETE", the "content" can be an empty string.

EXAMPLE RESPONSE:
METHOD: Of course, purrrr. I will create those files for you, meow.<<END_OF_METHOD>>
ACTIONS:
\`\`\`json
[
  {
    "perform": "UPDATE",
    "target": "index.html",
    "content": "<!DOCTYPE html>..."
  },
  {
    "perform": "ADD",
    "target": "new-feature.js",
    "content": "console.log('new feature');"
  }
]
\`\`\`
`,
});

router.post('/ask-ai-stream', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) { return res.status(400).json({ success: false, error: 'Prompt is required.' }); }
    try {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        const result = await model.generateContentStream(prompt);
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ event: 'end' })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Error during AI stream:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

router.post('/ask-ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) { return res.status(400).json({ success: false, error: 'Prompt is required.' }); }
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    res.json({ success: true, output: text });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
