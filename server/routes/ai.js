import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: `You are a world-class web development AI agent named Neko. You have vision capabilities. You MUST respond in a single, valid JSON array of action objects.

**CRITICAL RULES:**
- If the user provides an image, use it as the primary context for your response.
- Your entire response MUST be a single JSON array, and nothing else.
- The first object in the array MUST contain an "intro" key with your conversational, cat-like response to the user.
- The only valid "perform" values are "ADD", "UPDATE", and "DELETE".
- If you are asked to create a file that already exists, you MUST use the "UPDATE" action.
- For "DELETE" actions, the "content" key can be an empty string.
- If the user's request is conversational (e.g., "hello") and requires no code changes, return an array with a single object containing only the "intro" key.

**EXAMPLE (with image):**
User provides an image of a website mockup.
\`\`\`json
[
  {
    "intro": "Purrrr, that's a beautiful design! I'll build that mockup for you right meow!",
    "perform": "UPDATE",
    "target": "index.html",
    "content": "<!DOCTYPE html>..."
  }
]
\`\`\`
`,
});


// The single, reliable endpoint for all AI requests
router.post('/ask-ai', async (req, res) => {
  const { prompt, image } = req.body;
  if (!prompt && !image) {
    return res.status(400).json({ success: false, error: 'Prompt or image is required.' });
  }

  try {
    // THIS IS THE DEFINITIVE FIX:
    // The Gemini API expects the 'contents' array to contain a single object
    // with a 'parts' array inside it for multimodal requests.
    const parts = [];

    // Add image part if it exists
    if (image) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: image,
        },
      });
    }

    // Add text part if it exists
    if (prompt) {
      parts.push({ text: prompt });
    }

    // The entire payload must be wrapped correctly.
    const result = await model.generateContent({ contents: [{ parts }] });
    
    const response = await result.response;
    const text = response.text();
    
    const cleanedText = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    
    res.json({ success: true, output: cleanedText });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ success: false, error: 'Failed to get response from AI. ' + error.message });
  }
});


export default router;
