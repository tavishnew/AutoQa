import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Loader2,
  Menu,
  Play,
  Settings,
  Terminal,
  TrendingUp,
  X,
} from "lucide-react";

import { authClient } from "@/auth/client";
import { getDashboardStats, getUserSettings, saveUserSettings, deleteAccount } from "@/lib/server-functions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";

type LLMProvider = "ollama" | "nvidia" | "openrouter";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AutoQA" },
      { name: "description", content: "Manage your AutoQA account settings." },
    ],
  }),
  component: SettingsPage,
});

type NotificationPrefs = {
  emailRunComplete: boolean;
  emailRunFailed: boolean;
  weeklyDigest: boolean;
};

type SettingsInput = {
  ollamaBaseUrl: string;
  nvidiaApiKey: string | undefined;
  openRouterApiKey: string | undefined;
  preferredProvider: LLMProvider;
  notificationPrefs: NotificationPrefs;
};

function SettingsPage() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const [ollamaUrl, setOllamaUrl] = useState("");
  const [nvidiaKey, setNvidiaKey] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [preferredProvider, setPreferredProvider] = useState<LLMProvider>("ollama");
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    emailRunComplete: true,
    emailRunFailed: true,
    weeklyDigest: true,
  });
  const [maskedNvidia, setMaskedNvidia] = useState<string | null>(null);
  const [maskedOpenRouter, setMaskedOpenRouter] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<
    Record<string, "idle" | "checking" | "ok" | "failed">
  >({});
  const [testErrors, setTestErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: getUserSettings,
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
  });

  // Populate local state when settings load
  useEffect(() => {
    if (!settings) return;
    setOllamaUrl(settings.ollamaBaseUrl ?? "http://localhost:11434");
    setMaskedNvidia(settings.nvidiaApiKeyMasked);
    setMaskedOpenRouter(settings.openRouterApiKeyMasked);
    setPreferredProvider(settings.preferredProvider as LLMProvider);
    setNotifPrefs(settings.notificationPrefs);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (input: SettingsInput) => saveUserSettings({ data: input }),
    onSuccess: (result) => {
      setMaskedNvidia(result.nvidiaApiKeyMasked);
      setMaskedOpenRouter(result.openRouterApiKeyMasked);
      setNvidiaKey("");
      setOpenRouterKey("");
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccount({ data: { confirm: true } }),
    onSuccess: () => {
      // server returns redirect; signOut then navigate to /
      authClient.signOut();
      window.location.href = "/";
    },
  });

  const handleSave = useCallback(() => {
    saveMutation.mutate({
      ollamaBaseUrl: ollamaUrl || "http://localhost:11434",
      nvidiaApiKey: nvidiaKey || undefined,
      openRouterApiKey: openRouterKey || undefined,
      preferredProvider,
      notificationPrefs: notifPrefs,
    });
  }, [ollamaUrl, nvidiaKey, openRouterKey, preferredProvider, notifPrefs, saveMutation]);

  const debouncedSave = useCallback(
    (prefs: NotificationPrefs) => {
      setNotifPrefs(prefs);
      const timer = setTimeout(() => {
        saveMutation.mutate({
          ollamaBaseUrl: ollamaUrl || "http://localhost:11434",
          nvidiaApiKey: nvidiaKey || undefined,
          openRouterApiKey: openRouterKey || undefined,
          preferredProvider,
          notificationPrefs: prefs,
        });
      }, 300);
      return () => clearTimeout(timer);
    },
    [ollamaUrl, nvidiaKey, openRouterKey, preferredProvider, saveMutation],
  );

  const handleTestConnection = useCallback(async () => {
    const checks = [
      {
        key: "ollama",
        label: "Ollama",
        fn: async () => {
          const url = ollamaUrl.replace(/\/$/, "");
          const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return "ok";
        },
      },
      {
        key: "nvidia",
        label: "NVIDIA NIM",
        fn: async () => {
          if (!nvidiaKey && !maskedNvidia) throw new Error("No API key set");
          const envKey = nvidiaKey || maskedNvidia;
          const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
            headers: { Authorization: `Bearer ${envKey}` },
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return "ok";
        },
      },
      {
        key: "openRouter",
        label: "OpenRouter",
        fn: async () => {
          if (!openRouterKey && !maskedOpenRouter) throw new Error("No API key set");
          const envKey = openRouterKey || maskedOpenRouter;
          const res = await fetch("https://openrouter.ai/api/v1/models", {
            headers: { Authorization: `Bearer ${envKey}` },
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return "ok";
        },
      },
    ];

    setTestStatus({});
    setTestErrors({});

    const results = await Promise.allSettled(
      checks.map(async (c) => {
        setTestStatus((s) => ({ ...s, [c.key]: "checking" }));
        try {
          await c.fn();
          setTestStatus((s) => ({ ...s, [c.key]: "ok" }));
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown error";
          setTestStatus((s) => ({ ...s, [c.key]: "failed" }));
          setTestErrors((s) => ({ ...s, [c.key]: msg }));
        }
      }),
    );
  }, [ollamaUrl, nvidiaKey, maskedNvidia, openRouterKey, maskedOpenRouter]);

  // Derive display name / initials from session
  const displayName = session?.user?.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || displayName.slice(0, 2).toUpperCase();
  const email = session?.user?.email || "";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
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
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2"
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
            className="relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground"
          >
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-md bg-muted"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
            <Settings className="relative z-10 h-4 w-4 text-foreground" />
            <span className="relative z-10">Settings</span>
          </Link>
        </nav>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="font-mono text-xs font-bold text-foreground">Workspace</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats ? `${stats.runCount} runs this period` : "No runs yet"}
          </p>
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
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
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
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground bg-muted"
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
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2"
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
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground bg-muted"
                >
                  <Settings className="h-4 w-4 text-foreground" />
                  <span className="text-foreground">Settings</span>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <div className="relative hidden max-w-xs flex-1 sm:block">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input placeholder="Search…" className="pl-9" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground"
              title={displayName}
            >
              {initials}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-2xl">
          <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences</p>

          <div className="mt-8 space-y-6">
            {/* Account (read-only) */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-mono text-lg font-bold text-foreground">Account</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-email">Email</Label>
                  <Input id="account-email" type="email" value={email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-name">Name</Label>
                  <Input id="account-name" value={displayName} disabled />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Contact support to update your account details.
              </p>
            </section>

            {/* AI Provider */}
            <section className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-lg font-bold text-foreground">AI Provider</h2>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Keys encrypted at rest
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Configure LLM providers used by the worker. Leave empty to keep existing value.
              </p>

              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ollama-url">Ollama base URL</Label>
                  <Input
                    id="ollama-url"
                    placeholder="http://localhost:11434"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nvidia-key">NVIDIA API key</Label>
                  <Input
                    id="nvidia-key"
                    type="password"
                    placeholder={maskedNvidia ?? "••••••••"}
                    value={nvidiaKey}
                    onChange={(e) => setNvidiaKey(e.target.value)}
                  />
                  {maskedNvidia && !nvidiaKey && (
                    <p className="text-[11px] font-mono text-muted-foreground">
                      existing: {maskedNvidia}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openrouter-key">OpenRouter API key</Label>
                  <Input
                    id="openrouter-key"
                    type="password"
                    placeholder={maskedOpenRouter ?? "••••••••"}
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                  />
                  {maskedOpenRouter && !openRouterKey && (
                    <p className="text-[11px] font-mono text-muted-foreground">
                      existing: {maskedOpenRouter}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred-provider">Preferred provider</Label>
                  <Select
                    value={preferredProvider}
                    onValueChange={(v) => setPreferredProvider(v as LLMProvider)}
                  >
                    <SelectTrigger id="preferred-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ollama">Ollama (local)</SelectItem>
                      <SelectItem value="nvidia">NVIDIA NIM</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Test Connection */}
                <div className="space-y-2">
                  <Label>Connection test</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={
                        testStatus.ollama === "checking" ||
                        testStatus.nvidia === "checking" ||
                        testStatus.openRouter === "checking"
                      }
                      className="font-mono text-[11px] font-bold"
                    >
                      {(testStatus.ollama || testStatus.nvidia || testStatus.openRouter) ===
                      "checking" ? (
                        <>
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          Checking…
                        </>
                      ) : (
                        "Test connection"
                      )}
                    </Button>
                    {(["ollama", "nvidia", "openRouter"] as const).map((provider) => {
                      const status = testStatus[provider] || "idle";
                      const label =
                        provider === "openRouter"
                          ? "OpenRouter"
                          : provider === "nvidia"
                            ? "NVIDIA NIM"
                            : "Ollama";
                      if (status === "idle") return null;
                      return (
                        <span
                          key={provider}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase ${
                            status === "ok"
                              ? "border-border bg-muted text-foreground"
                              : "border-destructive/40 bg-destructive/10 text-destructive"
                          }`}
                          title={testErrors[provider]}
                        >
                          {status === "ok" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {label}
                          {status === "failed" && testErrors[provider]
                            ? `: ${testErrors[provider].slice(0, 60)}`
                            : ""}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="font-mono text-xs font-bold"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save AI settings"
                    )}
                  </Button>
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-mono text-lg font-bold text-foreground">Notifications</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Saved automatically on change.
              </p>

              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={notifPrefs.emailRunComplete}
                    onCheckedChange={(checked) =>
                      debouncedSave({
                        ...notifPrefs,
                        emailRunComplete: checked === true,
                      })
                    }
                  />
                  <span className="text-foreground">
                    Email when a test run completes
                  </span>
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={notifPrefs.emailRunFailed}
                    onCheckedChange={(checked) =>
                      debouncedSave({
                        ...notifPrefs,
                        emailRunFailed: checked === true,
                      })
                    }
                  />
                  <span className="text-foreground">
                    Email when a test run fails
                  </span>
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={notifPrefs.weeklyDigest}
                    onCheckedChange={(checked) =>
                      debouncedSave({
                        ...notifPrefs,
                        weeklyDigest: checked === true,
                      })
                    }
                  />
                  <span className="text-foreground">
                    Weekly digest email
                  </span>
                </label>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
              <h2 className="font-mono text-lg font-bold text-destructive">Danger zone</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Irreversible actions — proceed with care.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">Delete account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="font-mono text-xs font-bold"
                  >
                    Delete account
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      className="font-mono text-xs font-bold"
                    >
                      {deleteMutation.isPending ? (
                        <>
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          Deleting…
                        </>
                      ) : (
                        "Confirm delete"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
