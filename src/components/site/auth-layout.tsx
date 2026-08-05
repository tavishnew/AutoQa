import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Check, Terminal } from "lucide-react";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { SpotlightGrid } from "@/components/motion/spotlight";

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  highlights,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  highlights: string[];
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <SpotlightGrid className="relative hidden border-r border-border/60 bg-card px-10 py-14 lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="relative z-10 flex items-center gap-2 text-foreground">
          <Terminal className="h-5 w-5" strokeWidth={2.5} />
          <span className="font-mono text-lg font-bold tracking-tight">AutoQA</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 font-mono text-3xl font-bold leading-tight text-foreground">
              Ship with a QA engineer that never sleeps.
            </h2>
          </Reveal>
          <ul className="mt-8 space-y-4">
            {highlights.map((item, index) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                  <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 rounded-lg border border-border bg-background/70 p-4 font-mono text-xs text-muted-foreground backdrop-blur">
          <span className="text-foreground">$ autoqa run --suite smoke</span>
          <br />
          42 tests · 41 passed · 1 explained failure · 18s
        </div>
      </SpotlightGrid>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-5 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-sm"
        >
          <Link to="/" className="mb-8 flex items-center gap-2 text-foreground lg:hidden">
            <Terminal className="h-5 w-5" strokeWidth={2.5} />
            <span className="font-mono text-lg font-bold tracking-tight">AutoQA</span>
          </Link>

          <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-8 text-sm text-muted-foreground">{footer}</div>
        </motion.div>
      </div>
    </div>
  );
}

export function SocialButtons({ action }: { action: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {["GitHub", "Google"].map((provider) => (
        <motion.button
          key={provider}
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {action} with {provider}
        </motion.button>
      ))}
    </div>
  );
}
