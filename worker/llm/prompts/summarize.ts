export function buildSummarizePrompt(testName: string, status: "failed" | "flaky", errorMessage: string): string {
  return `You are an AI QA analyst. Write a one-paragraph failure summary for a test report.

Test name: ${testName}
Status: ${status}
Error: ${errorMessage}

Return ONLY a single paragraph (3-5 sentences) explaining:
- What the test was checking
- What went wrong (root cause if inferable)
- Impact on user experience
- Suggested next step for debugging

No markdown, no bullet points, no JSON. Plain text only.`;
}