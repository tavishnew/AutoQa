import { createFileRoute, Link, redirect, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  AlertTriangle,
  Bell,
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
import { getDashboardStats } from "@/lib/server-functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AutoQA test runs & coverage" },
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
  { label: "Tests run (7d)", suffix: "", icon: Activity, key: "runCount" },
  { label: "Median runtime", suffix: "s", icon: Clock, key: "medianRuntime", static: "18" },
  { label: "Flaky specs", suffix: "", icon: AlertTriangle, key: "flakyCount", static: "3" },
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

  const { data: stats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
  });

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
                className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
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
          <p className="font-mono text-xs font-bold text-foreground">Free plan</p>
          <p className="mt-1 text-xs text-muted-foreground">312 / 500 runs used</p>
          <Progress value={62} className="mt-3 h-1.5" />
          <Button asChild size="sm" className="mt-4 w-full font-mono text-[11px] font-bold">
            <Link to="/pricing">Upgrade</Link>
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
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "text-foreground bg-muted"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-foreground" : ""}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="relative hidden max-w-xs flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search suites, runs, specs…" className="pl-9" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button asChild size="sm" className="font-mono text-xs font-bold">
              <Link to="/dashboard/runs" search={{ new: "true" }}>
                <Play className="h-4 w-4" /> Run suite
              </Link>
            </Button>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">
              AL
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
                  Good afternoon
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats
                    ? `${stats.projectCount} projects · ${stats.runCount} runs`
                    : "5 projects · last run 3 minutes ago · 1 failure needs review"}
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[11px]">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
                Agents idle
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
                        : stats[stat.key as keyof typeof stats] || stat.static || "—"
                      : stat.static || "—"}
                    {stat.suffix}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {stat.key === "passedRunCount" && stats
                      ? `${stats.passedRunCount}/${stats.runCount} runs passed`
                      : stat.static
                        ? `${stat.static} vs last week`
                        : "vs last week"}
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
                <Link
                  to="/dashboard/runs"
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="divide-y divide-border">
                <li className="flex items-center justify-center py-12 text-muted-foreground">
                  <span>
                    No runs yet.{" "}
                    <Link
                      to="/dashboard/runs"
                      search={{ new: "true" }}
                      className="text-primary hover:underline"
                    >
                      Run a test suite
                    </Link>{" "}
                    to get started.
                  </span>
                </li>
              </ul>
            </Reveal>

            <div className="space-y-6">
              {/* Trend */}
              <Reveal className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-mono text-sm font-bold text-foreground">Pass rate trend</h2>
                <p className="mt-1 text-xs text-muted-foreground">Last 12 runs</p>
                <div className="mt-5 flex h-32 items-end gap-1.5">
                  {[42, 55, 48, 63, 59, 71, 68, 80, 76, 88, 84, 96].map((value, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${value}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-1 rounded-sm bg-foreground/80 transition-colors hover:bg-foreground"
                      title={`${value}%`}
                    />
                  ))}
                </div>
              </Reveal>

              {/* Coverage */}
              <Reveal className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-mono text-sm font-bold text-foreground">Coverage by surface</h2>
                <ul className="mt-5 space-y-4">
                  {[
                    { surface: "Routes", value: 92 },
                    { surface: "Forms", value: 78 },
                    { surface: "API endpoints", value: 84 },
                    { surface: "Auth flows", value: 61 },
                  ].map((item, index) => (
                    <li key={item.surface}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.surface}</span>
                        <span className="font-mono text-xs text-foreground">{item.value}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-foreground"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.value}%` }}
                          viewport={{ once: true }}
                          transition={{
                            delay: 0.1 + index * 0.08,
                            duration: 0.7,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
