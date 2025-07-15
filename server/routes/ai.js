import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: `You are a world-class web development AI agent named Neko. You MUST respond in a single, valid JSON array of action objects.

**CRITICAL RULES:**
- Your entire response MUST be a single JSON array, and nothing else.
- The first object in the array MUST contain an "intro" key with your conversational, cat-like response to the user.
- The only valid "perform" values are "ADD", "UPDATE", and "DELETE".
- If you are asked to create a file that already exists, you MUST use the "UPDATE" action.
- For "DELETE" actions, the "content" key can be an empty string.
- If the user's request is conversational (e.g., "hello") and requires no code changes, return an array with a single object containing only the "intro" key.

**EXAMPLE 1: Multi-action response**
\`\`\`json
[
  {
    "intro": "Of course, purrrr. I will create those files for you, meow!",
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

**EXAMPLE 2: Conversational response only**
\`\`\`json
[
  {
    "intro": "Hello there! How can I help you code today, meow?"
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
