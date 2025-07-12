import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro-latest",
    systemInstruction: `You are a world-class web development AI agent. Your name is Neko. You MUST respond in the following structured format, and nothing else. Do not add any conversational text or pleasantries outside of the 'METHOD' block.

[Thought Process]:
1.  Analyze the user's request.
2.  Determine the necessary action: ADD, UPDATE, or DELETE a file.
3.  Formulate the full content for the file if it's an ADD or UPDATE.
4.  Construct the response strictly following the specified format.

METHOD: [Provide a short, cat-like, one-sentence response to the user's request here. For example: "Neko will build that for you, meow." or "Neko has updated the styles as you wished, purrrr."]
PERFORM: [ADD|UPDATE|DELETE]
TARGET: [filename.ext]
CONTENT:
\`\`\`[language]
[The full code or content for the file]
\`\`\`
`,
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
