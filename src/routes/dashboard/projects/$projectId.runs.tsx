import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/auth/client";
import { getProjects } from "@/lib/server-functions";
import { getRuns, createRun } from "@/lib/server-functions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/projects/$projectId/runs")({
  head: ({ params }) => ({
    meta: [
      { title: `Project ${params.projectId} — Runs` },
      { name: "description", content: "View runs for this project." },
    ],
  }),
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/signin" });
    }
  },
  component: ProjectRunsPage,
});

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

function ProjectRunsPage() {
  const params = useParams({ from: "/dashboard/projects/$projectId/runs" });
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [newRunDialogOpen, setNewRunDialogOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const project = projects.find((p) => p.id === projectId);

  const runsQuery = useQuery({
    queryKey: ["runs", projectId],
    queryFn: async () => {
      const result = await (
        getRuns as (data: { projectId?: string }) => Promise<import("@/lib/server-functions").Run[]>
      )(projectId ? { projectId } : {});
      return result;
    },
    enabled: !!projectId,
  });
  const { data: runs = [], isLoading, refetch } = runsQuery;

  const createRunMutation = useMutation({
    mutationFn: async (data: { projectId: string; targetUrl: string }) => {
      return await createRun({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runs", projectId] });
      setTargetUrl("");
      setNewRunDialogOpen(false);
    },
    onError: (err) => {
      alert(err.message || "Failed to create run");
    },
  });

  function handleCreateRun(e: React.FormEvent) {
    e.preventDefault();
    createRunMutation.mutate({ projectId: params.projectId!, targetUrl });
  }

  const filteredRuns = runs.filter(
    (run) =>
      run.targetUrl.toLowerCase().includes(search.toLowerCase()) ||
      run.id.toLowerCase().includes(search.toLowerCase()),
  );

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
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Play className="h-4 w-4" />
            <span>Runs</span>
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
                  className="flex items-center gaps-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
            <Input
              placeholder="Search runs…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Dialog open={newRunDialogOpen} onOpenChange={setNewRunDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="font-mono text-xs font-bold">
                  <Play className="h-4 w-4" /> Run suite
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Run new test suite</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateRun} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Target URL</label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      required
                      disabled={createRunMutation.isPending}
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setNewRunDialogOpen(false)}
                      disabled={createRunMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createRunMutation.isPending || !targetUrl}>
                      {createRunMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" /> Run suite
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                to="/dashboard/projects"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Back to projects
              </Link>
              <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
                {project?.name || "Project"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {project?.targetUrl || "No target URL set"} · {runs.length} runs
              </p>
            </div>
          </div>

          <div className="mt-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRuns.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <Play className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-mono text-lg font-bold text-foreground">No runs yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click "Run suite" to start your first test execution for this project
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <ul className="divide-y divide-border">
                  {filteredRuns.map((run, index) => (
                    <motion.li
                      key={run.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <span
                          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase ${statusStyles[run.status]}`}
                        >
                          {statusIcons[run.status]}
                          <span className="text-xs font-medium capitalize">{run.status}</span>
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {run.targetUrl}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground truncate max-w-md">
                            {run.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden text-xs text-muted-foreground sm:block">
                          {new Date(run.createdAt).toLocaleDateString()}
                        </span>
                        <Link
                          to="/dashboard/runs/$runId/report"
                          params={{ runId: run.id }}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {run.status === "completed" ? "View report" : "View details"}
                        </Link>
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
