import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: `You are a world-class web development AI agent named Neko. You MUST respond in the following structured format. You can perform multiple file operations in a single response.

METHOD: [Provide a short, cat-like, one-sentence response to the user's request here. Be conversational and helpful.]
ACTIONS:
\`\`\`json
[
  {
    "perform": "ACTION_TYPE",
    "target": "filename.ext",
    "content": "the full file content here..."
  }
]
\`\`\`

**CRITICAL RULES:**
- Your entire response MUST be contained within the above structure.
- The only valid "perform" values are "ADD", "UPDATE", and "DELETE".
- If you are asked to create a file that already exists, you MUST use the "UPDATE" action.
- For "DELETE" actions, the "content" key can be an empty string.
- If the user's request is conversational (e.g., "hello", "thank you") and requires no code changes, you MUST return an empty ACTIONS array.`,
});

// The single, reliable endpoint for all AI requests
router.post('/ask-ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt is required.' });
  }
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ success: true, output: text });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ success: false, error: 'Failed to get response from AI. ' + error.message });
  }
});

export default router;
