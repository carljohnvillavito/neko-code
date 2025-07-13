/**
 * Parses the structured text response from the AI, which can contain multiple actions.
 * @param {string} text - The raw text from the AI.
 * @returns {{method: string, actions: {perform: string, target: string, content: string}[]}}
 */
export function parseAIResponse(text) {
  if (!text || typeof text !== 'string') {
    return { method: null, actions: [] };
  }

  const cleanedText = text.replace(/\r\n/g, '\n').trim();

  // Extract the conversational method
  const methodMatch = /METHOD:\s*([\s\S]*?)\nACTIONS:/i.exec(cleanedText);
  const method = methodMatch ? methodMatch[1].trim() : "Neko didn't provide a message.";

  // Extract the JSON block content
  const actionsMatch = /ACTIONS:\s*```json\n([\s\S]+?)\n```/i.exec(cleanedText);
  if (!actionsMatch) {
    return { method, actions: [] };
  }

  const jsonString = actionsMatch[1];
  try {
    // Parse the JSON string into an array of actions
    const actions = JSON.parse(jsonString);
    return { method, actions: Array.isArray(actions) ? actions : [] };
  } catch (error) {
    console.error("Failed to parse AI actions JSON:", error);
    return { method, actions: [] }; // Return empty array on parsing error
  }
}
