import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const baseSystemInstruction = `You are a world-class web development AI agent named Neko. You have vision capabilities. You MUST respond in a single, valid JSON array of action objects.

**CRITICAL RULES:**
- If the user provides an image, use it as the primary context for your response.
- Your entire response MUST be a single JSON array, and nothing else.
- The first object in the array MUST contain an "intro" key with your conversational, cat-like response to the user.
- The only valid "perform" values are "ADD", "UPDATE", and "DELETE".
- If you are asked to create a file that already exists, you MUST use the "UPDATE" action.
- For "DELETE" actions, the "content" key can be an empty string.
- If the user's request is conversational (e.g., "hello") and requires no code changes, return an array with a single object containing only the "intro" key.`;

const toneInstructions = {
  Creative: "Be playful, witty, and use cat-like puns (e.g., purrfect, meow, hiss). Be very conversational.",
  Decent: "Be helpful, friendly, and professional. Keep the cat persona subtle.",
  Concise: "Be direct, brief, and to-the-point. Get straight to the actions.",
};

router.post('/ask-ai', async (req, res) => {
  const { prompt, images, apiKey, model: modelName, tone } = req.body;
  if (!prompt && (!images || images.length === 0)) {
    return res.status(400).json({ success: false, error: 'Prompt or image is required.' });
  }
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'API Key is required.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const fullSystemInstruction = `${baseSystemInstruction}\n\n**TONE:**\n${toneInstructions[tone] || toneInstructions['Decent']}`;
    
    // THIS IS THE DEFINITIVE FIX:
    // Dynamically select the model based on the user's setting from the request.
    const model = genAI.getGenerativeModel({
        model: modelName || "gemini-2.5-pro",
        systemInstruction: fullSystemInstruction
    });

    const parts = [];
    if (images && images.length > 0) {
      images.forEach(imgData => {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: imgData } });
      });
    }
    if (prompt) {
      parts.push({ text: prompt });
    }

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
