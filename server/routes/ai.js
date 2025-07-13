import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro",
    systemInstruction: `You are a world-class web development AI agent. Your name is Neko. You MUST respond in the following structured format. You can perform multiple file operations in a single response.

METHOD: [Provide a short, cat-like, one-sentence response to the user's request here.]
ACTIONS:
\`\`\`json
[
  {
    "perform": "ACTION_TYPE",
    "target": "filename.ext",
    "content": "the full file content here..."
  },
  {
    "perform": "ACTION_TYPE_2",
    "target": "another-file.ext",
    "content": "the full file content for the second action..."
  }
]
\`\`\`

- The ACTIONS block must contain a valid JSON array of action objects.
- Each action object must have "perform", "target", and "content" keys.
- "perform" can be "ADD", "UPDATE", or "DELETE".
- For DELETE, the "content" can be an empty string.
- Your entire response must strictly follow this format. Do not add any other text outside this structure.`,
});

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
