import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  ChevronRight,
  Clock,
  Download,
  FileText,
  LayoutDashboard,
  Loader2,
  Menu,
  Play,
  Search,
  Settings,
  Terminal,
  X,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/auth/client";
import { getRuns } from "@/lib/server-functions";
import { useQuery } from "@tanstack/react-query";

const statusStyles: Record<string, string> = {
  passed: "border-border bg-muted text-foreground",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
  flaky: "border-border bg-card text-muted-foreground",
  pending: "border-border bg-muted text-foreground",
  running: "border-primary/40 bg-primary/10 text-primary",
  cancelled: "border-border bg-muted text-muted-foreground",
};

const statusIcons: Record<string, React.ReactNode> = {
  passed: (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  failed: (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  flaky: (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  pending: (
    <svg
      className="h-3 w-3 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4" />
    </svg>
  ),
  running: (
    <svg
      className="h-3 w-3 animate-pulse"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  cancelled: (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16l8-8" />
    </svg>
  ),
};

export const Route = createFileRoute("/dashboard/runs/$runId")({
  head: ({ params }) => ({
    meta: [
      { title: `Run ${params.runId} — AutoQA` },
      { name: "description", content: "View the AutoQA test run details." },
    ],
  }),
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/signin" });
    }
  },
  component: RunDetailsPage,
});

function RunDetailsPage() {
  const params = useParams({ from: "/dashboard/runs/$runId" });
  const runId = params.runId as string;
  const runsQuery = useQuery({
    queryKey: ["runs"],
    queryFn: async () => {
      return await getRuns({});
    },
  });
  const { data: runs = [], isLoading, refetch } = runsQuery;

  const run = runs.find((r) => r.id === params.runId!);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-card px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2 text-foreground">
          <Terminal className="h-5 w-5" strokeWidth={2.5} />
          <span className="font-mono text-lg font-bold tracking-tight">AutoQA</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </Link>
          <Link
            to="/dashboard/projects"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg
              className="h-4 w-4"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <span>Projects</span>
          </Link>
          <Link
            to="/dashboard/runs"
            className="relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground"
          >
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-md bg-muted"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
            <Play className="relative z-10 h-4 w-4 text-foreground" />
            <span className="relative z-10">Runs</span>
          </Link>
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="font-mono text-xs font-bold text-foreground">Free plan</p>
          <p className="mt-1 text-xs text-muted-foreground">312 / 500 runs used</p>
          <Progress value={62} className="mt-3 h-1.5" />
          <Button asChild size="sm" className="mt-4 w-full font-mono text-[11px] font-bold">
            <Link to="/pricing">Upgrade</Link>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-foreground lg:hidden">
            <Terminal className="h-5 w-5" strokeWidth={2.5} />
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="px-4 py-3 border-b border-border">
                <SheetTitle className="flex items-center gap-2 text-foreground">
                  <Terminal className="h-5 w-5" strokeWidth={2.5} />
                  <span className="font-mono text-lg font-bold tracking-tight">AutoQA</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Overview</span>
                </Link>
                <Link
                  to="/dashboard/projects"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <svg
                    className="h-4 w-4"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                  </svg>
                  <span>Projects</span>
                </Link>
                <Link
                  to="/dashboard/runs"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Play className="h-4 w-4" />
                  <span>Runs</span>
                </Link>
                <Link
                  to="/dashboard/settings"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="relative hidden max-w-xs flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search runs…" className="pl-9" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Link
              to="/dashboard/runs"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" /> Back to runs
            </Link>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">
              AL
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : run ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
                      Run {run.id.slice(0, 8)}
                    </h1>
                    <span
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase ${statusStyles[run.status]}`}
                    >
                      {statusIcons[run.status]}
                      <span className="text-xs font-medium capitalize">{run.status}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {run.projectName} · {run.targetUrl} · {new Date(run.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {run.status === "running" || run.status === "pending" ? (
                    <Button asChild variant="outline" size="sm" onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                  ) : null}
                  {run.reportUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={run.reportUrl} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" /> Download HTML
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-4 gap-4 border-b border-border px-4 py-3 bg-background/50 text-sm">
                  <div className="font-medium text-foreground">Target URL</div>
                  <div className="col-span-3 font-mono text-muted-foreground truncate">
                    {run.targetUrl}
                  </div>
                  <div className="font-medium text-foreground">Status</div>
                  <div className="col-span-3">
                    <span
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase ${statusStyles[run.status]}`}
                    >
                      {statusIcons[run.status]}
                      <span className="text-xs font-medium capitalize">{run.status}</span>
                    </span>
                  </div>
                  <div className="font-medium text-foreground">Started at</div>
                  <div className="col-span-3 font-mono text-muted-foreground">
                    {run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}
                  </div>
                  <div className="font-medium text-foreground">Finished at</div>
                  <div className="col-span-3 font-mono text-muted-foreground">
                    {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "—"}
                  </div>
                </div>

                {run.errorMessage && (
                  <div className="border-b border-border px-4 py-3 bg-destructive/5">
                    <div className="flex items-center gap-2 text-sm">
                      <svg
                        className="h-4 w-4 text-destructive"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01" />
                      </svg>
                      <span className="font-medium text-destructive">Error</span>
                    </div>
                    <pre className="mt-2 font-mono text-xs text-destructive/90 whitespace-pre-wrap">
                      {run.errorMessage}
                    </pre>
                  </div>
                )}

                {run.reportUrl ? (
                  <div className="overflow-hidden">
                    <iframe
                      src={run.reportUrl}
                      className="w-full h-[70vh] border-0 bg-white"
                      title="Test run report"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 font-mono text-lg font-bold text-foreground">
                      Report not available yet
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This run is still {run.status}. The report will be available once the run
                      completes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-mono text-lg font-bold text-foreground">Run not found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The run you're looking for doesn't exist.
              </p>
              <Button asChild className="mt-4 font-mono text-xs font-bold">
                <Link to="/dashboard/runs">Back to runs</Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
