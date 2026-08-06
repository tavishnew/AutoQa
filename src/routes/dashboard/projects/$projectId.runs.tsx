import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  Menu,
  Play,
  Search,
  Settings,
  Terminal,
  Trash2,
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

export const Route = createFileRoute("/dashboard/projects/$projectId/runs")({
  head: () => ({
    meta: [
      { title: "Project runs — AutoQA" },
      { name: "description", content: "Test runs for this project." },
    ],
  }),
  component: ProjectRunsPage,
  loader: async ({ params }) => {
    const { data: session } = await authClient.getSession();
    if (!session) throw redirect({ to: "/signin" });
    return { projectId: params.projectId };
  },
});

const statusStyles: Record<string, string> = {
  passed: "border-border bg-muted text-foreground",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
  flaky: "border-border bg-card text-muted-foreground",
  pending: "border-border bg-muted text-foreground",
  running: "border-primary/40 bg-primary/10 text-primary",
  cancelled: "border-border bg-muted text-muted-foreground",
};

function ProjectRunsPage() {
  const { projectId } = Route.useParams();
  const [search, setSearch] = useState("");

  const { data: runs = [], isLoading, refetch } = useQuery({
    queryKey: ["runs", projectId],
    queryFn: async () => getRuns({ data: { projectId } }),
  });

  const filteredRuns = runs.filter(
    (r) =>
      r.targetUrl.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-card px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2 text-foreground">
          <Terminal className="h-5 w-5" strokeWidth={2.5} />
          <span className="font-mono text-lg font-bold tracking-tight">AutoQA</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          <Link to="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <LayoutDashboard className="h-4 w-4" /> <span>Overview</span>
          </Link>
          <Link to="/dashboard/projects" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <svg className="h-4 w-4" strokeWidth={2.5} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
            <span>Projects</span>
          </Link>
          <Link to="/dashboard/runs" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Play className="h-4 w-4" /> <span>Runs</span>
          </Link>
          <Link to="/dashboard/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Settings className="h-4 w-4" /> <span>Settings</span>
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
                <Link to="/dashboard/projects" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground bg-muted">
                  <svg className="h-4 w-4" strokeWidth={2.5} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
                  <span>Projects</span>
                </Link>
                <Link to="/dashboard/runs" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground bg-muted">
                  <Play className="h-4 w-4 text-foreground" /><span>Runs</span>
                </Link>
                <Link to="/dashboard/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <Settings className="h-4 w-4" /><span>Settings</span>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="relative hidden max-w-xs flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search runs…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">Project runs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Test executions for this project</p>
          <div className="mt-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredRuns.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-mono text-lg font-bold text-foreground">No runs yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Run a test suite to see results here</p>
                <Button asChild className="mt-4 font-mono text-xs font-bold">
                  <Link to="/dashboard/runs" search={{ new: "true" }}><Play className="h-4 w-4" /> Run suite</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <ul className="divide-y divide-border">
                  {filteredRuns.map((run, index) => (
                    <motion.li key={run.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03, duration: 0.3 }} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/60">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase ${statusStyles[run.status]}`}>
                          {run.status}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{run.projectName || "Unknown"}</p>
                          <p className="font-mono text-xs text-muted-foreground truncate max-w-xs">{run.targetUrl}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden text-xs text-muted-foreground sm:block">{new Date(run.createdAt).toLocaleDateString()}</span>
                        <Link to="/dashboard/runs/$runId" params={{ runId: run.id }} className="text-xs font-medium text-primary hover:underline">View details</Link>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
