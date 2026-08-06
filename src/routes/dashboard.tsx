import { createFileRoute, Link, redirect, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Menu,
  Play,
  Search,
  Settings,
  Terminal,
  TrendingUp,
  X,
} from "lucide-react";

import { CountUp } from "@/components/motion/interactions";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { GlowCard } from "@/components/motion/spotlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/auth/client";
import { getDashboardStats, getRuns } from "@/lib/server-functions";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AutoQA" },
      {
        name: "description",
        content:
          "Monitor AutoQA suites: pass rate, flaky specs, coverage by surface and explained failures from the latest runs.",
      },
      { property: "og:title", content: "Dashboard — AutoQA test runs & coverage" },
      {
        property: "og:description",
        content:
          "Monitor AutoQA suites: pass rate, flaky specs, coverage by surface and explained failures from the latest runs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/signin" });
    }
  },
  component: DashboardPage,
});

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FlaskConical },
  { label: "Runs", href: "/dashboard/runs", icon: Activity },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const statsConfig = [
  {
    label: "Pass rate",
    suffix: "%",
    icon: CheckCircle2,
    key: "passedRunCount",
    runCount: "runCount",
  },
  { label: "Tests run", suffix: "", icon: Activity, key: "runCount" },
  {
    label: "Failed",
    suffix: "",
    icon: AlertTriangle,
    key: "failedRunCount",
  },
];

const statusStyles: Record<string, string> = {
  passed: "border-border bg-muted text-foreground",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
  flaky: "border-border bg-card text-muted-foreground",
  pending: "border-border bg-muted text-foreground",
  running: "border-primary/40 bg-primary/10 text-primary",
  cancelled: "border-border bg-muted text-muted-foreground",
};

function DashboardPage() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: session } = authClient.useSession();
  const [search, setSearch] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
  });

  const recentRunsQuery = useQuery({
    queryKey: ["recentRuns"],
    queryFn: async () => {
      const all = await getRuns({});
      return all.slice(0, 10);
    },
  });

  const recentRuns = useMemo(() => {
    const runs = recentRunsQuery.data ?? [];
    if (!search.trim()) return runs;
    const q = search.toLowerCase();
    return runs.filter(
      (r) =>
        r.projectName?.toLowerCase().includes(q) ||
        r.targetUrl.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [recentRunsQuery.data, search]);

  const displayName = session?.user?.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const email = session?.user?.email || "";

  const runCount = stats?.runCount ?? 0;
  const progressPct = Math.min((runCount / 100) * 100, 100);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-card px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2 text-foreground">
          <Terminal className="h-5 w-5" strokeWidth={2.5} />
          <span className="font-mono text-lg font-bold tracking-tight">AutoQA</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href !== "/dashboard" && currentPath.startsWith(item.href));
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md bg-muted"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <item.icon
                  className={`relative z-10 h-4 w-4 ${isActive ? "text-foreground" : ""}`}
                />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="font-mono text-xs font-bold text-foreground">Workspace</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats ? `${runCount} runs this period` : "No runs yet"}
          </p>
          <Progress value={progressPct} className="mt-3 h-1.5" />
          <Button asChild size="sm" className="mt-4 w-full font-mono text-[11px] font-bold">
            <Link to="/dashboard/runs" search={{ new: "true" }}>
              <Play className="h-4 w-4" /> Run tests
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
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
                {navItems.map((item) => {
                  const isActive =
                    currentPath === item.href ||
                    (item.href !== "/dashboard" && currentPath.startsWith(item.href));
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-foreground" : ""}`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
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
            <Button asChild size="sm" className="font-mono text-xs font-bold">
              <Link to="/dashboard/runs" search={{ new: "true" }}>
                <Play className="h-4 w-4" /> Run tests
              </Link>
            </Button>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground"
              title={displayName}
            >
              {initials}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
                  {greeting}, {displayName.split(" ")[0]}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats
                    ? `${stats.projectCount} projects · ${stats.runCount} runs`
                    : "Welcome to AutoQA"}
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[11px]">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
                {stats && stats.runCount > 0 ? `${stats.runCount} runs` : "Ready"}
              </Badge>
            </div>
          </Reveal>

          {/* Stats */}
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statsConfig.map((stat) => (
              <StaggerItem key={stat.label}>
                <GlowCard className="h-full rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </span>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-3 font-mono text-3xl font-bold text-foreground">
                    {stat.key && stats
                      ? stat.key === "passedRunCount" && stats.runCount > 0
                        ? Math.round((stats.passedRunCount / stats.runCount) * 100)
                        : stats[stat.key as keyof typeof stats]
                      : "—"}
                    {stat.suffix}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {stat.key === "passedRunCount" && stats
                      ? `${stats.passedRunCount}/${stats.runCount} passed`
                      : "All time"}
                  </p>
                </GlowCard>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            {/* Recent runs */}
            <Reveal className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="font-mono text-sm font-bold text-foreground">Recent runs</h2>
                {search ? (
                  <span className="text-xs text-muted-foreground">
                    {recentRuns.length} match{recentRuns.length !== 1 ? "es" : ""}
                  </span>
                ) : (
                  <Link
                    to="/dashboard/runs"
                    className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <ul className="divide-y divide-border">
                {recentRunsQuery.isLoading ? (
                  <li className="flex items-center justify-center py-12 text-muted-foreground">
                    <span>Loading…</span>
                  </li>
                ) : recentRuns.length === 0 ? (
                  <li className="flex items-center justify-center py-12 text-muted-foreground">
                    <span>
                      {search ? "No matches" : "No runs yet. "}
                      {!search && (
                        <>
                          <Link
                            to="/dashboard/runs"
                            search={{ new: "true" }}
                            className="text-primary hover:underline"
                          >
                            Run your first test
                          </Link>{" "}
                          to get started.
                        </>
                      )}
                    </span>
                  </li>
                ) : (
                  recentRuns.map((run, index) => (
                    <motion.li
                      key={run.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <span
                          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase ${statusStyles[run.status]
                            }`}
                        >
                          {run.status}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {run.projectName || "Untitled"}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground truncate max-w-xs">
                            {run.targetUrl}
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/dashboard/runs/$runId"
                        params={{ runId: run.id }}
                        className="hidden text-xs font-medium text-primary hover:underline sm:block"
                      >
                        View details
                      </Link>
                    </motion.li>
                  ))
                )}
              </ul>
            </Reveal>

            <div className="space-y-6">
              {/* Quick actions */}
              <Reveal className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-mono text-sm font-bold text-foreground">Quick actions</h2>
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="font-mono text-xs font-bold"
                  >
                    <Link to="/dashboard/runs" search={{ new: "true" }}>
                      <Play className="h-4 w-4" /> Run new test suite
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs font-bold"
                  >
                    <Link to="/dashboard/projects">Create project</Link>
                  </Button>
                </div>
              </Reveal>

              {/* Settings reminder */}
              <Reveal className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-mono text-sm font-bold text-foreground">AI Providers</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Configure Ollama, NVIDIA, or OpenRouter in Settings to enable AI-powered test discovery.
                </p>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="mt-3 font-mono text-[11px] font-bold"
                >
                  <Link to="/dashboard/settings">Configure providers →</Link>
                </Button>
              </Reveal>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
