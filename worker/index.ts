import { eq, and } from "drizzle-orm";
import { db, runs, testResults, projects } from "./db";
import { chromium, Page } from "playwright";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import DOMPurify from "isomorphic-dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

interface TestResult {
  name: string;
  status: "passed" | "failed" | "skipped" | "flaky";
  duration: number;
  evidenceUrl?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

async function discoverUrls(page: Page, baseUrl: string): Promise<string[]> {
  const urls = new Set<string>();
  const visited = new Set<string>();

  async function crawl(url: string, depth: number = 0) {
    if (depth > 2 || visited.has(url) || urls.size > 50) return;
    visited.add(url);

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      urls.add(url);

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href]"))
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((href) => href.startsWith(window.location.origin));
      });

      for (const link of links) {
        if (!visited.has(link)) {
          await crawl(link, depth + 1);
        }
      }
    } catch (e) {
      console.error(`Failed to crawl ${url}:`, e);
    }
  }

  await crawl(baseUrl);
  return Array.from(urls);
}

async function runTests(page: Page, urls: string[]): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const url of urls) {
    const startTime = Date.now();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForLoadState("domcontentloaded");

      const title = await page.title();
      const hasContent = await page.evaluate(() => document.body.innerText.length > 100);

      results.push({
        name: `Page load: ${url}`,
        status: hasContent ? "passed" : "failed",
        duration: Date.now() - startTime,
        metadata: { url, title },
        errorMessage: hasContent ? undefined : "Page has minimal content",
      });

      const links = await page.$$eval("a[href]", (els: HTMLAnchorElement[]) =>
        els.map((el) => el.href).slice(0, 10),
      );

      for (const link of links) {
        const linkStart = Date.now();
        try {
          const response = await page.request.get(link);
          results.push({
            name: `Link check: ${link}`,
            status: response.ok() ? "passed" : "failed",
            duration: Date.now() - linkStart,
            metadata: { url: link, status: response.status() },
            errorMessage: response.ok() ? undefined : `HTTP ${response.status()}`,
          });
        } catch (e) {
          results.push({
            name: `Link check: ${link}`,
            status: "failed",
            duration: Date.now() - linkStart,
            metadata: { url: link },
            errorMessage: String(e),
          });
        }
      }
    } catch (e) {
      results.push({
        name: `Page load: ${url}`,
        status: "failed",
        duration: Date.now() - startTime,
        metadata: { url },
        errorMessage: String(e),
      });
    }
  }

  return results;
}

function generateHtmlReport(
  runId: string,
  projectName: string,
  targetUrl: string,
  results: TestResult[],
  startedAt: Date,
  finishedAt: Date,
): string {
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  const sanitizedResults = results.map((r) => ({
    ...r,
    errorMessage: r.errorMessage ? purify.sanitize(r.errorMessage) : undefined,
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AutoQA Run Report - ${runId}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #1e293b; line-height: 1.6; }
    .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 32px; }
    .header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; }
    .header .meta { opacity: 0.9; font-size: 14px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 24px 32px; border-bottom: 1px solid #e2e8f0; }
    .stat { text-align: center; padding: 16px; background: #f8fafc; border-radius: 8px; }
    .stat-value { font-size: 32px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 4px; }
    .stat.passed .stat-value { color: #10b981; }
    .stat.failed .stat-value { color: #ef4444; }
    .stat.skipped .stat-value { color: #64748b; }
    .stat.duration .stat-value { color: #3b82f6; }
    .content { padding: 32px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    .run-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .info-item { background: #f8fafc; padding: 16px; border-radius: 8px; }
    .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
    .info-value { font-family: 'SF Mono', Monaco, monospace; font-size: 13px; word-break: break-all; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { font-weight: 600; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; }
    tr:hover td { background: #f8fafc; }
    .status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .status.passed { background: #dcfce7; color: #166534; }
    .status.failed { background: #fef2f2; color: #991b1b; }
    .status.skipped { background: #f1f5f9; color: #475569; }
    .status.flaky { background: #fef3c7; color: #92400e; }
    .error { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; color: #ef4444; background: #fef2f2; padding: 8px 12px; border-radius: 6px; max-width: 400px; overflow-x: auto; }
    .duration { font-variant-numeric: tabular-nums; font-family: 'SF Mono', Monaco, monospace; color: #64748b; }
    .empty { text-align: center; color: #94a3b8; padding: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AutoQA Test Run Report</h1>
      <div class="meta">Run ID: ${runId} · ${new Date().toLocaleString()}</div>
    </div>
    <div class="stats">
      <div class="stat passed">
        <div class="stat-value">${passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat failed">
        <div class="stat-value">${failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat skipped">
        <div class="stat-value">${skipped}</div>
        <div class="stat-label">Skipped</div>
      </div>
      <div class="stat duration">
        <div class="stat-value">${(totalDuration / 1000).toFixed(1)}s</div>
        <div class="stat-label">Total Duration</div>
      </div>
    </div>
    <div class="content">
      <div class="section">
        <h2>Run Information</h2>
        <div class="run-info">
          <div class="info-item">
            <div class="info-label">Project</div>
            <div class="info-value">${purify.sanitize(projectName)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Target URL</div>
            <div class="info-value"><a href="${purify.sanitize(targetUrl)}" target="_blank" rel="noopener">${purify.sanitize(targetUrl)}</a></div>
          </div>
          <div class="info-item">
            <div class="info-label">Started</div>
            <div class="info-value">${startedAt.toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Finished</div>
            <div class="info-value">${finishedAt.toLocaleString()}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <h2>Test Results (${results.length})</h2>
        ${
          results.length === 0
            ? '<div class="empty">No tests were executed.</div>'
            : `<table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              ${sanitizedResults
                .map(
                  (r) => `
                <tr>
                  <td>${purify.sanitize(r.name)}</td>
                  <td><span class="status ${r.status}">${r.status}</span></td>
                  <td class="duration">${(r.duration / 1000).toFixed(2)}s</td>
                  <td>${r.errorMessage ? `<div class="error">${r.errorMessage}</div>` : "—"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>`
        }
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function uploadToR2(key: string, content: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: content,
    ContentType: "text/html",
  });
  await r2Client.send(command);
  return `${R2_PUBLIC_URL}/${key}`;
}

async function processRun(runId: string) {
  console.log(`Processing run ${runId}...`);

  const run = await db.select().from(runs).where(eq(runs.id, runId)).limit(1);
  if (run.length === 0) {
    throw new Error(`Run ${runId} not found`);
  }
  const runData = run[0];

  if (runData.status !== "pending") {
    console.log(`Run ${runId} is not pending (status: ${runData.status}), skipping`);
    return;
  }

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, runData.projectId))
    .limit(1);
  if (project.length === 0) {
    throw new Error(`Project ${runData.projectId} not found`);
  }
  const projectData = project[0];

  await db.update(runs).set({ status: "running", startedAt: new Date() }).where(eq(runs.id, runId));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`Discovering URLs for ${runData.targetUrl}...`);
    const urls = await discoverUrls(page, runData.targetUrl);
    console.log(`Found ${urls.length} URLs to test`);

    console.log(`Running tests...`);
    const testResultsData = await runTests(page, urls);

    const finishedAt = new Date();
    await db.insert(testResults).values(
      testResultsData.map((tr) => ({
        runId,
        name: tr.name,
        status: tr.status,
        duration: tr.duration,
        evidenceUrl: tr.evidenceUrl,
        errorMessage: tr.errorMessage,
        metadata: tr.metadata,
      })),
    );

    const passed = testResultsData.filter((r) => r.status === "passed").length;
    const failed = testResultsData.filter((r) => r.status === "failed").length;
    const finalStatus = failed > 0 ? "failed" : "completed";

    console.log(`Generating report...`);
    const reportHtml = generateHtmlReport(
      runId,
      projectData.name,
      runData.targetUrl,
      testResultsData,
      runData.startedAt || new Date(),
      finishedAt,
    );

    const reportKey = `reports/${runId}/report.html`;
    const reportUrl = await uploadToR2(reportKey, reportHtml);
    console.log(`Report uploaded to ${reportUrl}`);

    await db
      .update(runs)
      .set({
        status: finalStatus,
        finishedAt,
        reportUrl,
      })
      .where(eq(runs.id, runId));

    console.log(`Run ${runId} completed with status: ${finalStatus}`);
  } catch (error) {
    console.error(`Run ${runId} failed:`, error);
    await db
      .update(runs)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorMessage: String(error),
      })
      .where(eq(runs.id, runId));
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("AutoQA Worker starting...");

  while (true) {
    try {
      const pendingRuns = await db
        .select()
        .from(runs)
        .where(eq(runs.status, "pending"))
        .orderBy(runs.createdAt)
        .limit(5);

      for (const run of pendingRuns) {
        await processRun(run.id);
      }

      if (pendingRuns.length === 0) {
        console.log("No pending runs, waiting...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    } catch (error) {
      console.error("Worker error:", error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main().catch(console.error);
