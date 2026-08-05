import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bot, Compass, FileSearch, PlayCircle, Sparkles, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { PageHero, PageShell, SectionHeading } from "@/components/site/page-shell";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title: "Workflow — How AutoQA Runs a Test Cycle" },
      {
        name: "description",
        content:
          "Planner, Explorer, Generator, Runner, and Analysis: the five agents behind every AutoQA run, step by step.",
      },
      { property: "og:title", content: "Workflow — How AutoQA Runs a Test Cycle" },
      {
        property: "og:description",
        content:
          "Five specialised agents orchestrate discovery, generation, execution, and analysis.",
      },
    ],
  }),
  component: WorkflowPage,
});

const steps = [
  {
    icon: Compass,
    number: "01",
    title: "Planner",
    description:
      "Sets the strategy: which flows matter, what coverage looks like, and the budget for the run.",
  },
  {
    icon: FileSearch,
    number: "02",
    title: "Explorer",
    description:
      "Crawls pages and endpoints, building a structured map of routes, forms, and auth boundaries.",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "Generator",
    description:
      "Writes Playwright browser tests and HTTPX API tests directly from the discovered flows.",
  },
  {
    icon: PlayCircle,
    number: "04",
    title: "Runner",
    description:
      "Executes everything in a sandboxed container, re-validating selectors and repairing drift.",
  },
  {
    icon: Workflow,
    number: "05",
    title: "Analysis",
    description:
      "Diagnoses failures and produces an HTML/JSON report with evidence and suggested fixes.",
  },
];

const timeline = [
  "discovery: 20 pages mapped",
  "planning: 6 critical flows selected",
  "generation: 47 tests written",
  "execution: 47 tests, 2 failures",
  "analysis: report.html ready",
];

function WorkflowPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Workflow"
        title="One orchestrator, five specialised agents."
        description="Each agent owns one job and hands off structured state to the next. You watch the run, you do not babysit it."
      >
        <Button size="lg" className="font-mono text-sm font-bold" asChild>
          <Link to="/docs">Run your first cycle</Link>
        </Button>
      </PageHero>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="The pipeline"
            description="From a bare URL to an annotated failure report."
          />

          <div className="relative mt-14">
            <div className="absolute left-[19px] top-2 hidden h-[calc(100%-1rem)] w-px bg-border sm:block" />
            <Stagger className="space-y-8" gap={0.1}>
              {steps.map((step) => (
                <StaggerItem key={step.number}>
                  <div className="relative flex gap-6">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card sm:flex">
                      <step.icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex-1 rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                          {step.number}
                        </span>
                        <h3 className="font-mono text-lg font-bold text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            title="Watch it think."
            description="The orchestrator streams progress as each agent completes its stage, so you always know where the run is."
          />
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <Bot className="h-5 w-5 text-foreground" />
                <span className="font-mono text-sm font-bold text-foreground">Orchestrator</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">live</span>
              </div>
              <div className="space-y-3 pt-4 font-mono text-xs">
                {timeline.map((line, index) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.18, duration: 0.4 }}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                    <span>→ {line}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
