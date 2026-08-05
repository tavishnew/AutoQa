import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Boxes, Rocket, Settings2, TerminalSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem, HoverLift } from "@/components/motion/reveal";
import { PageHero, PageShell, SectionHeading } from "@/components/site/page-shell";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — AutoQA Quickstart & CLI" },
      {
        name: "description",
        content:
          "Install AutoQA, run your first discovery, configure models and budgets, and read the generated failure reports.",
      },
      { property: "og:title", content: "Documentation — AutoQA Quickstart & CLI" },
      {
        property: "og:description",
        content: "Quickstart, CLI reference, configuration, and report anatomy.",
      },
    ],
  }),
  component: DocsPage,
});

const sections = [
  {
    icon: Rocket,
    title: "Quickstart",
    description: "Install, point at a URL, and get your first report in under five minutes.",
  },
  {
    icon: TerminalSquare,
    title: "CLI reference",
    description: "Every flag for run, discover, generate, and report commands.",
  },
  {
    icon: Settings2,
    title: "Configuration",
    description: "Model selection, token budgets, auth profiles, and mutation policy.",
  },
  {
    icon: Boxes,
    title: "Report anatomy",
    description: "How to read root cause, evidence, severity, and suggested fixes.",
  },
];

const steps = [
  { label: "Install", code: "pip install autoqa" },
  { label: "Discover", code: "autoqa discover --target http://localhost:3000" },
  { label: "Run", code: "autoqa run --target http://localhost:3000 --budget 50k" },
  { label: "Report", code: "open reports/report.html" },
];

function DocsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Docs"
        title="From install to first failure report in five minutes."
        description="AutoQA ships as a CLI. Point it at a running app, let the agents work, and read the report."
      >
        <Button size="lg" className="font-mono text-sm font-bold" asChild>
          <Link to="/features">Explore features</Link>
        </Button>
      </PageHero>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading
              title="Quickstart"
              description="Four commands. No YAML, no scaffolding, no Playwright boilerplate."
            />
            <Stagger className="mt-10 space-y-4" gap={0.08}>
              {steps.map((step, index) => (
                <StaggerItem key={step.label}>
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        0{index + 1}
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {step.label}
                      </span>
                    </div>
                    <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs text-foreground/80">
                      <code>$ {step.code}</code>
                    </pre>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <div>
            <SectionHeading
              title="Browse the manual"
              description="Reference material for everything beyond the happy path."
            />
            <Stagger className="mt-10 grid gap-4 sm:grid-cols-2" gap={0.06}>
              {sections.map((section) => (
                <StaggerItem key={section.title}>
                  <HoverLift>
                    <div className="h-full rounded-xl border border-border bg-card p-6">
                      <section.icon className="h-5 w-5 text-foreground" />
                      <h3 className="mt-4 font-mono text-base font-bold text-foreground">
                        {section.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </HoverLift>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal delay={0.2} className="mt-8">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-5">
                <BookOpen className="h-5 w-5 shrink-0 text-foreground" />
                <p className="text-sm text-muted-foreground">
                  Missing something?{" "}
                  <Link
                    to="/contact"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Tell us what to document next
                  </Link>
                  .
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
