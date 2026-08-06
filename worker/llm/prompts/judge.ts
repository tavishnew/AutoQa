export function buildJudgePrompt(pageText: string, title: string, errors: string[]): string {
  return `You are an AI QA judge. Determine if a page load test passed based on the page content and any errors.

Page title: ${title}
Page text (truncated):
${pageText.slice(0, 5000)}
Errors detected: ${errors.length > 0 ? errors.join("; ") : "none"}

Return ONLY a JSON object with this schema:
{"passed": boolean, "reason": "string"}

Rules:
- passed = true if page has meaningful content (not blank, not error page, not loading spinner)
- passed = false if: blank page, 4xx/5xx error text, "page not found", "access denied", loading indefinitely, or critical JS errors
- reason: ONE sentence explaining the decision
- Be strict: default to failed if uncertain`;
}