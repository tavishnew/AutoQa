import { createFileRoute, Link } from "@tanstack/react-router";
import { Container, Eye, KeyRound, Lock, Server, Shield, Wallet, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal, Stagger, StaggerItem, HoverLift } from "@/components/motion/reveal";
import { PageHero, PageShell, SectionHeading } from "@/components/site/page-shell";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety & Cost Control — AutoQA" },
      {
        name: "description",
        content:
          "Sandboxed runs, encrypted credentials, read-only defaults, local-first models, and per-run token budgets.",
      },
      { property: "og:title", content: "Safety & Cost Control — AutoQA" },
      {
        property: "og:description",
        content: "How AutoQA stays autonomous without being reckless with your app or your budget.",
      },
    ],
  }),
  component: SafetyPage,
});

const pillars = [
  {
    icon: Shield,
    title: "Sandboxed runs",
    description: "Every run executes in an isolated container with no shared state between runs.",
  },
  {
    icon: Lock,
    title: "Encrypted credentials",
    description: "Target credentials and API keys are encrypted at rest and scoped per project.",
  },
  {
    icon: Zap,
    title: "Safe by default",
    description:
      "Read-only flows unless you explicitly pass --allow-mutations for non-localhost targets.",
  },
  {
    icon: Server,
    title: "Local-first models",
    description: "Ollama runs on your machine by default; cloud inference is opt-in per project.",
  },
  {
    icon: Wallet,
    title: "Budget caps",
    description: "Set a token ceiling per run. AutoQA degrades gracefully instead of overspending.",
  },
  {
    icon: Eye,
    title: "Full audit trail",
    description: "Every action an agent takes is logged with inputs, outputs, and timestamps.",
  },
];

const faqs = [
  {
    q: "Will AutoQA modify data in my app?",
    a: "Not unless you allow it. Against non-localhost targets, mutating flows are skipped until you pass --allow-mutations, and destructive verbs stay blocked behind an explicit allowlist.",
  },
  {
    q: "Where do my credentials live?",
    a: "Encrypted at rest and scoped to a single project. They are injected into the sandbox at run time and never written into generated test code or reports.",
  },
  {
    q: "Does my source code leave my machine?",
    a: "No. AutoQA works against the running application, not your repository. With local models, nothing leaves the machine at all.",
  },
  {
    q: "How do you handle rate limits?",
    a: "Requests use retries with exponential backoff, and each run carries a token budget. When the budget is exhausted, the run finishes with a partial report rather than failing hard.",
  },
];

function SafetyPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Safety"
        title="Autonomous, not reckless."
        description="Isolation, encryption, and cost control are part of the architecture — not features bolted on after the fact."
      >
        <Button size="lg" className="font-mono text-sm font-bold" asChild>
          <Link to="/docs">Review the guardrails</Link>
        </Button>
      </PageHero>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Six guardrails"
            description="Applied to every run, on every target, by default."
          />
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3" gap={0.06}>
            {pillars.map((item) => (
              <StaggerItem key={item.title}>
                <HoverLift>
                  <div className="h-full rounded-xl border border-border bg-card p-6">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                      <item.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="mt-4 font-mono text-base font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SectionHeading title="Common questions" align="center" />
          <Reveal delay={0.1} className="mt-10">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.q} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-mono text-base">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
          <Reveal
            delay={0.2}
            className="mt-10 flex items-center justify-center gap-3 text-muted-foreground"
          >
            <Container className="h-4 w-4" />
            <KeyRound className="h-4 w-4" />
            <span className="font-mono text-xs">Container isolation + per-project key scoping</span>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
