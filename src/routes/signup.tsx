import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { AuthLayout, SocialButtons } from "@/components/site/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/auth/client";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your AutoQA account" },
      {
        name: "description",
        content:
          "Start free with AutoQA — discover your app, generate browser and API tests, and get explained failures in minutes.",
      },
      { property: "og:title", content: "Create your AutoQA account" },
      {
        property: "og:description",
        content:
          "Start free with AutoQA — discover your app, generate browser and API tests, and get explained failures in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUpPage,
});

const rules = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "One number", test: (v: string) => /\d/.test(v) },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
];

function SignUpPage() {
  const [show, setShow] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const passed = useMemo(() => rules.filter((r) => r.test(form.password)).length, [form.password]);
  const strength = (passed / rules.length) * 100;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const { error } = await authClient.signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (error) {
        setState("idle");
        setErrorMsg(error.message || "Sign up failed. Please try again.");
        return;
      }
      setState("done");
    } catch (e) {
      if (e && typeof e === "object" && "status" in e) throw e; // TanStack Router redirect
      setState("idle");
      setErrorMsg("Sign up failed. Please try again.");
    }
  }

  return (
    <AuthLayout
      eyebrow="Get started free"
      title="Create your account"
      subtitle="No credit card. 500 test runs a month on the free tier."
      highlights={[
        "Point AutoQA at a URL — it maps routes, forms and API calls itself.",
        "Generated Playwright specs land in your repo as readable code.",
        "Failures come with a root-cause explanation, not just a red X.",
      ]}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/signin" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-border bg-card p-6 text-center"
            role="status"
          >
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Check className="h-5 w-5" strokeWidth={3} />
            </motion.span>
            <h2 className="mt-4 font-mono text-base font-bold text-foreground">Check your inbox</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a verification link to {form.email || "your email"}.
            </p>
            <Button asChild className="mt-5 w-full font-mono text-xs font-bold">
              <Link to="/dashboard">
                Preview the dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SocialButtons action="Sign up" />

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                or email
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="pr-10"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
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

                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full bg-foreground"
                    animate={{ width: `${strength}%` }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {rules.map((rule) => {
                    const ok = rule.test(form.password);
                    return (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs ${ok ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        <Check
                          className={`h-3 w-3 ${ok ? "opacity-100" : "opacity-30"}`}
                          strokeWidth={3}
                        />
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox id="terms" required className="mt-0.5" />
                <span>I agree to the terms of service and privacy policy.</span>
              </label>

              <AnimatePresence initial={false}>
                {state === "idle" && errorMsg ? (
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                  </>
                ) : (
                  <>
                    Create account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
