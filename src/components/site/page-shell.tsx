import { useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { Footer } from "@/components/site/footer";
import { Navigation } from "@/components/site/navigation";
import { Reveal } from "@/components/motion/reveal";
import { BackToTop, ScrollProgress } from "@/components/motion/interactions";
import { SpotlightGrid } from "@/components/motion/spotlight";
import { TextGenerate } from "@/components/motion/text-generate";

export function PageShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <Navigation />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main"
          key={pathname}
          className="flex-1"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
      <BackToTop />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <SpotlightGrid className="border-b border-border/60 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 font-mono text-xs font-medium text-foreground shadow-sm">
            {eyebrow}
          </span>
        </Reveal>
        <h1 className="mt-6 font-mono text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          <TextGenerate text={title} />
        </h1>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        </Reveal>
        {children ? (
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap justify-center gap-4">{children}</div>
          </Reveal>
        ) : null}
      </div>
    </SpotlightGrid>
  );
}

export function SectionHeading({
  title,
  description,
  align = "left",
}: {
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="mt-4 text-lg text-muted-foreground">{description}</p> : null}
    </Reveal>
  );
}
