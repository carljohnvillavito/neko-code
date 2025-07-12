/**
 * Parses the structured text response from the AI.
 * @param {string} text - The raw text from the AI.
 * @returns {{method: string, perform: string, target: string, content: string}}
 */
export function parseAIResponse(text) {
  if (!text || typeof text !== 'string') {
    return { method: null, perform: null, target: null, content: '' };
  }

  // Handle potential variations in line breaks and spacing
  const cleanedText = text.replace(/\r\n/g, '\n').trim();

  const methodMatch = /METHOD:\s*([\s\S]*?)\nPERFORM:/i.exec(cleanedText);
  const method = methodMatch ? methodMatch[1].trim() : "Neko didn't provide a message.";

  const performMatch = /PERFORM:\s*(ADD|UPDATE|DELETE)/i.exec(cleanedText);
  const perform = performMatch ? performMatch[1].trim().toUpperCase() : null;

  const targetMatch = /TARGET:\s*([^\n]+)/i.exec(cleanedText);
  const target = targetMatch ? targetMatch[1].trim() : null;
  
  // Regex to capture content within ```, optionally with a language identifier
  const contentMatch = /CONTENT:\s*```(?:\w+)?\n([\s\S]+?)```/i.exec(cleanedText);
  // If no content block is found, it might be a DELETE operation, so content can be empty.
  const content = contentMatch ? contentMatch[1] : '';

  return { method, perform, target, content };
}
