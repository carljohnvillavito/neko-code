/**
 * Parses the JSON response from the AI.
 * @param {string} text - The raw JSON string from the AI.
 * @returns {{intro: string, actions: {perform: string, target: string, content: string}[]}}
 */
export function parseAIResponse(text) {
  try {
    const actions = JSON.parse(text);
    if (!Array.isArray(actions) || actions.length === 0) {
      return { intro: "Neko had a problem thinking, purrlease try again.", actions: [] };
    }
    
    // The intro is in the first object.
    const intro = actions[0]?.intro || "Neko didn't provide a message.";
    
    // Filter out any objects that are not valid actions (like the first one if it only has an intro).
    const validActions = actions.filter(action => action.perform && action.target);
    
    return { intro, actions: validActions };
  } catch (error) {
    console.error("Failed to parse AI actions JSON:", error);
    return { intro: "Neko's response was a bit fuzzy, try again!", actions: [] };
  }
}
