import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronRight,
  Clock,
  Download,
  FileText,
  LayoutDashboard,
  Loader2,
  Menu,
  Play,
  Settings,
  Terminal,
  X,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/auth/client";
import { getRuns } from "@/lib/server-functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/runs/$runId/report")({
  head: () => ({
    meta: [
      { title: "Run report — AutoQA" },
      { name: "description", content: "Test run report." },
    ],
  }),
  component: RunReportPage,
  loader: async ({ params }) => {
    const { data: session } = await authClient.getSession();
    if (!session) throw redirect({ to: "/signin" });
    return { runId: params.runId };
  },
});

function RunReportPage() {
  const { runId } = Route.useParams();

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["runs"],
    queryFn: () => getRuns({}),
  });

  const run = runs.find((r) => r.id === runId);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-card px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2 text-foreground">
          <Terminal className="h-5 w-5" strokeWidth={2.5} />
          <span className="font-mono text-lg font-bold tracking-tight">AutoQA</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          <Link to="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <LayoutDashboard className="h-4 w-4" /><span>Overview</span>
          </Link>
          <Link to="/dashboard/projects" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <svg className="h-4 w-4" strokeWidth={2.5} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
            <span>Projects</span>
          </Link>
          <Link to="/dashboard/runs" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground bg-muted">
            <Play className="h-4 w-4 text-foreground" /><span className="text-foreground">Runs</span>
          </Link>
          <Link to="/dashboard/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Settings className="h-4 w-4" /><span>Settings</span>
          </Link>
        </nav>
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
                <Link to="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <LayoutDashboard className="h-4 w-4" /><span>Overview</span>
                </Link>
                <Link to="/dashboard/projects" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <svg className="h-4 w-4" strokeWidth={2.5} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
                  <span>Projects</span>
                </Link>
                <Link to="/dashboard/runs" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground bg-muted">
                  <Play className="h-4 w-4 text-foreground" /><span className="text-foreground">Runs</span>
                </Link>
                <Link to="/dashboard/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <Settings className="h-4 w-4" /><span>Settings</span>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : run ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">Report · {run.id.slice(0, 8)}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{run.projectName} · {run.targetUrl}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-mono text-sm text-foreground">Report</span>
                </div>
                {run.reportUrl ? (
                  <Button asChild className="mt-4 font-mono text-xs font-bold">
                    <Link to={run.reportUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" /> Open report
                    </Link>
                  </Button>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">No report available yet.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Run not found.</p>
          )}
        </main>
      </div>
    </div>
  );
}
