import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";

import { AuthLayout, SocialButtons } from "@/components/site/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/auth/client";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — AutoQA" },
      {
        name: "description",
        content:
          "Sign in to AutoQA to run AI-generated browser and API tests and review explained failures.",
      },
      { property: "og:title", content: "Sign in — AutoQA" },
      {
        property: "og:description",
        content:
          "Sign in to AutoQA to run AI-generated browser and API tests and review explained failures.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setState("error");
      setErrorMsg("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setState("loading");
    setErrorMsg("");

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      });
      if (error) {
        setState("error");
        setErrorMsg(error.message || "Sign in failed. Please try again.");
        return;
      }
      await navigate({ to: "/dashboard" }); setState("idle");
    } catch (e) {
      if (e && typeof e === "object" && "status" in e) throw e; // TanStack Router redirect
      setState("error");
      setErrorMsg("Sign in failed. Please try again.");
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to AutoQA"
      subtitle="Pick up where your last run left off."
      highlights={[
        "Resume suites, triage failures and re-run flaky specs.",
        "Every run stays local-first — your source never leaves your machine.",
        "Single workspace for browser, API and regression coverage.",
      ]}
      footer={
        <>
          New to AutoQA?{" "}
          <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <SocialButtons action="Continue" />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          or email
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setState("idle");
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setState("idle");
              }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox id="remember" defaultChecked />
          Keep me signed in for 30 days
        </label>

        <AnimatePresence initial={false}>
          {state === "error" ? (
            <motion.p
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-destructive"
            >
              {errorMsg}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <Button
          type="submit"
          className="w-full font-mono text-xs font-bold"
          disabled={state === "loading"}
        >
          {state === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" /> Sign in
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prefer the CLI? Run <code className="text-foreground">autoqa login</code> in your terminal.
      </p>
    </AuthLayout>
  );
}
