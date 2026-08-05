import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  Camera,
  Gauge,
  Globe,
  Layers,
  Network,
  ScanLine,
  ShieldCheck,
  TestTube,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stagger, StaggerItem, HoverLift } from "@/components/motion/reveal";
import { GlowCard } from "@/components/motion/spotlight";
import { PageHero, PageShell, SectionHeading } from "@/components/site/page-shell";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — AutoQA AI QA Engineer" },
      {
        name: "description",
        content:
          "AI discovery, test generation, sandboxed execution, self-healing selectors, and failure analysis with screenshots and suggested fixes.",
      },
      { property: "og:title", content: "Features — AutoQA AI QA Engineer" },
      {
        property: "og:description",
        content:
          "Everything AutoQA does: crawl, generate, run, self-heal, and explain browser and API tests.",
      },
    ],
  }),
  component: FeaturesPage,
});

const core = [
  {
    icon: Globe,
    title: "AI Discovery",
    description:
      "Crawl your app and map pages, forms, navigation, auth flows, and CRUD paths. No sitemap or manual config required.",
  },
  {
    icon: Brain,
    title: "Test Generation",
    description:
      "Functional, smoke, negative, and auth tests for browser and API — plain-language intent compiled to executable code.",
  },
  {
    icon: TestTube,
    title: "Execution Engine",
    description:
      "Playwright and HTTPX inside an isolated sandbox. Chromium first, Firefox and WebKit on the roadmap.",
  },
  {
    icon: ScanLine,
    title: "Failure Analysis",
    description:
      "Root cause, screenshot, console and network logs, stack trace, severity, and a suggested fix for every failure.",
  },
];

const extended = [
  {
    icon: Wand2,
    title: "Self-healing selectors",
    description: "Selectors re-validate before each run and repair themselves when the DOM drifts.",
  },
  {
    icon: Network,
    title: "API contract checks",
    description:
      "Status codes, schemas, latency budgets, and auth boundaries verified per endpoint.",
  },
  {
    icon: Camera,
    title: "Evidence capture",
    description: "Screenshots, traces, and HAR-style network logs attached to every failing step.",
  },
  {
    icon: Layers,
    title: "HTML + JSON reports",
    description: "Human-readable reports for the team, machine-readable output for your pipeline.",
  },
  {
    icon: Gauge,
    title: "Budget controls",
    description: "Per-run token caps, retries with backoff, and local models by default.",
  },
  {
    icon: ShieldCheck,
    title: "Read-only mode",
    description: "Mutations are blocked on non-localhost targets unless you explicitly opt in.",
  },
];

function FeaturesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Features"
        title="Everything a QA engineer does, automated."
        description="AutoQA replaces the repetitive half of quality engineering: exploring the app, writing the tests, running them, and explaining what broke."
      >
        <Button size="lg" className="font-mono text-sm font-bold" asChild>
          <Link to="/workflow">See the workflow</Link>
        </Button>
        <Button size="lg" variant="outline" className="font-mono text-sm font-bold" asChild>
          <Link to="/docs">Read the docs</Link>
        </Button>
      </PageHero>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="The core loop"
            description="Four capabilities that run end-to-end on every target you point AutoQA at."
          />
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {core.map((feature) => (
              <StaggerItem key={feature.title}>
                <HoverLift>
                  <GlowCard className="h-full">
                    <Card className="h-full border-border/60 bg-card/60">
                      <CardHeader>
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                          <feature.icon className="h-5 w-5 text-foreground" />
                        </div>
                        <CardTitle className="font-mono text-lg">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </GlowCard>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="And the details that matter"
            description="The unglamorous work that makes autonomous testing trustworthy."
          />
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3" gap={0.06}>
            {extended.map((item) => (
              <StaggerItem key={item.title}>
                <HoverLift>
                  <div className="h-full rounded-xl border border-border bg-card p-6">
                    <item.icon className="h-5 w-5 text-foreground" />
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
    </PageShell>
  );
}
