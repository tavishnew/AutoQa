export function buildDiscoverPrompt(domText: string, baseUrl: string): string {
  return `You are an AI QA agent. Given the text content of a web page, identify the 3-5 most important interactive elements a user would want to test.

Page URL: ${baseUrl}
Page text (truncated):
${domText.slice(0, 8000)}

Return ONLY a JSON array of 3-5 objects with this schema:
[
  {"selector": "string", "label": "string", "type": "button|link|input|form|other", "priority": 1-5}
]

Rules:
- selector: CSS selector that uniquely identifies the element (prefer data-testid, id, or stable class)
- label: human-readable name for test reporting
- type: categorize the element
- priority: 1 = highest (primary CTA), 5 = lowest
- Only include elements visible and interactive to users
- Skip navigation chrome, footer links, social icons
- If fewer than 3 interactive elements exist, return fewer items`;
}