import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Bot,
  Brain,
  CheckCircle,
  ChevronRight,
  Globe,
  Lock,
  Play,
  ScanLine,
  Shield,
  TestTube,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverLift, Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { GlowCard, SpotlightGrid } from "@/components/motion/spotlight";
import {
  CountUp,
  Magnetic,
  Marquee,
  Parallax,
  ScrollLine,
  ShineOverlay,
  TiltCard,
} from "@/components/motion/interactions";
import { TextGenerate } from "@/components/motion/text-generate";
import { PageShell, SectionHeading } from "@/components/site/page-shell";
import heroImage from "@/assets/hero-qa.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoQA — AI QA Engineer" },
      {
        name: "description",
        content:
          "Discover, generate, run, and explain software tests automatically. Local-first AI QA engineering for browser and API.",
      },
      { property: "og:title", content: "AutoQA — AI QA Engineer" },
      {
        property: "og:description",
        content:
          "Discover, generate, run, and explain software tests automatically. Local-first AI QA engineering for browser and API.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageShell>
      <HeroSection />
      <LogoStrip />
      <FeaturesSection />
      <WorkflowSection />
      <SafetySection />
      <CTASection />
    </PageShell>
  );
}

function HeroSection() {
  return (
    <SpotlightGrid className="border-b border-border/60 px-4 pb-24 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
        <div className="max-w-2xl">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground" />
              </span>
              <span className="font-mono text-xs font-medium text-foreground">
                v1.0 MVP now open
              </span>
            </div>
          </Reveal>

          <h1 className="font-mono text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            <TextGenerate text="The AI QA engineer that never sleeps." delay={0.1} />
          </h1>

          <Reveal delay={0.35}>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              AutoQA maps your app, writes functional and API tests, runs them in a sandbox, and
              explains failures with root cause, screenshots, and suggested fixes. Local-first with
              an optional cloud boost.
            </p>
          </Reveal>

          <Reveal delay={0.45}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Magnetic>
                <Button size="lg" className="font-mono text-sm font-bold" asChild>
                  <Link to="/docs">
                    <Play className="h-4 w-4" />
                    Start a test run
                  </Link>
                </Button>
              </Magnetic>
              <Magnetic>
                <Button
                  size="lg"
                  variant="outline"
                  className="group font-mono text-sm font-bold"
                  asChild
                >
                  <Link to="/docs">
                    Read the docs
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
            </div>
          </Reveal>

          <Stagger className="mt-10 grid gap-3 sm:grid-cols-2" gap={0.07}>
            {[
              "No manual Playwright scripts",
              "Browser + API coverage",
              "Self-healing selectors",
              "Local-first by default",
            ].map((item) => (
              <StaggerItem
                key={item}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle className="h-4 w-4 text-foreground" />
                {item}
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <Parallax className="relative" distance={28}>
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-border via-transparent to-border opacity-50 blur-2xl" />
            <TiltCard>
              <img
                src={heroImage}
                alt="AutoQA AI agent scanning a web application for bugs"
                width={1024}
                height={768}
                className="relative rounded-2xl border border-border bg-card shadow-2xl"
              />
            </TiltCard>
          </motion.div>
        </Parallax>
      </div>
    </SpotlightGrid>
  );
}

function LogoStrip() {
  const labels = ["Playwright", "LangGraph", "FastAPI", "Ollama", "Groq", "HTTPX"];
  return (
    <section className="border-b border-border/60 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-center font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Built with the tools you already trust
        </p>
        <Marquee>
          {labels.map((label) => (
            <span
              key={label}
              className="font-mono text-sm font-bold text-foreground/40 transition-colors hover:text-foreground/80"
            >
              {label}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Globe,
      title: "AI Discovery",
      description:
        "Crawl your app, map pages, forms, navigation, auth flows, and CRUD paths automatically. No sitemap required.",
    },
    {
      icon: Brain,
      title: "Test Generation",
      description:
        "Generate functional, smoke, negative, and auth tests for browser and API. Plain-language intent, executable code.",
    },
    {
      icon: TestTube,
      title: "Execution Engine",
      description:
        "Run tests in an isolated sandbox with Playwright and HTTPX. Chromium first, with Firefox and WebKit coming later.",
    },
    {
      icon: ScanLine,
      title: "Failure Analysis",
      description:
        "Every failure gets root cause, a screenshot, console and network logs, stack trace, severity, and a suggested fix.",
    },
  ];

  return (
    <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Discover. Generate. Run. Explain."
          description="The core loop of autonomous QA, end-to-end. Let AutoQA handle the repetitive parts so you can ship with confidence."
        />

        <Stagger className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" gap={0.08}>
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <HoverLift>
                <TiltCard>
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
                </TiltCard>
              </HoverLift>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.2} className="mt-10">
          <Button variant="outline" className="font-mono text-xs font-bold" asChild>
            <Link to="/features">
              See all features
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    {
      number: "01",
      title: "Planner",
      description: "Decides the test strategy and coverage goals for the target app.",
    },
    {
      number: "02",
      title: "Explorer",
      description: "Crawls pages and API endpoints to build a structured map of the application.",
    },
    {
      number: "03",
      title: "Generator",
      description: "Writes Playwright browser tests and HTTPX API tests from the discovered flows.",
    },
    {
      number: "04",
      title: "Runner",
      description:
        "Executes tests in a sandboxed container, re-validates selectors, and auto-repairs drift.",
    },
    {
      number: "05",
      title: "Analysis",
      description: "Diagnoses failures and produces an HTML/JSON report with evidence and fixes.",
    },
  ];

  return (
    <section
      id="workflow"
      className="border-y border-border/60 bg-muted/30 px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="One agent, five agents."
          description="An orchestrator coordinates specialised agents, each responsible for a single stage of the run."
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Stagger className="relative space-y-5 pl-6" gap={0.09}>
            <ScrollLine className="left-0" />
            {steps.map((step) => (
              <StaggerItem key={step.number}>
                <div className="flex gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-card">
                  <span className="font-mono text-sm font-bold text-muted-foreground">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-mono text-base font-bold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
            <Reveal delay={0.2}>
              <Button variant="outline" className="mt-2 font-mono text-xs font-bold" asChild>
                <Link to="/workflow">
                  Explore the workflow
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </Reveal>
          </Stagger>

          <Reveal delay={0.15} className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <Bot className="h-5 w-5 text-foreground" />
                <span className="font-mono text-sm font-bold text-foreground">Orchestrator</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">live</span>
              </div>
              <div className="space-y-3 pt-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.number}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.12, duration: 0.4 }}
                  >
                    <span className="h-2 w-2 rounded-full bg-foreground/30" />
                    <span className="font-mono text-xs text-muted-foreground">
                      {step.title} agent
                    </span>
                    <span className="ml-auto font-mono text-xs text-foreground/60">idle</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-border bg-muted p-3">
                <code className="block font-mono text-xs text-foreground/80">
                  $ autoqa run --target https://demo.app
                  <br />→ discovery: <CountUp value={20} /> pages mapped
                  <br />→ generated: <CountUp value={47} /> tests
                  <br />→ failures: <CountUp value={2} /> (report.html)
                </code>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function SafetySection() {
  const items = [
    {
      icon: Shield,
      title: "Sandboxed runs",
      description:
        "Every test run executes in an isolated container. No shared state between runs.",
    },
    {
      icon: Lock,
      title: "Encrypted credentials",
      description:
        "Target-app credentials and API keys are encrypted at rest and scoped per project.",
    },
    {
      icon: Zap,
      title: "Safe by default",
      description:
        "Read-only flows unless you explicitly pass --allow-mutations for non-localhost targets.",
    },
  ];

  return (
    <section id="safety" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Autonomous, not reckless."
          description="Safety and cost control are built into the design, not bolted on later."
        />

        <Stagger className="mt-16 grid gap-6 md:grid-cols-3" gap={0.08}>
          {items.map((item) => (
            <StaggerItem key={item.title}>
              <HoverLift>
                <Card className="h-full border-border/60 bg-card/60">
                  <CardHeader>
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                      <item.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <CardTitle className="font-mono text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
          ))}
        </Stagger>

        <Stagger
          className="mt-12 grid gap-6 rounded-2xl border border-border bg-muted/30 p-6 sm:grid-cols-2 lg:grid-cols-4"
          gap={0.07}
        >
          {[
            { value: "Ollama", label: "Local-first default" },
            { value: "Groq", label: "Optional cloud boost" },
            { value: "Token cap", label: "Per-run budget" },
            { value: "Retry + backoff", label: "Rate limit handling" },
          ].map((stat) => (
            <StaggerItem key={stat.label} className="text-center">
              <div className="font-mono text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative isolate overflow-hidden rounded-3xl border border-border bg-foreground p-10 text-center text-background sm:p-16">
          <ShineOverlay />
          <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            Ship fewer bugs, faster.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-background/80">
            Join the early release and let AutoQA take the first pass on your QA so your team can
            focus on the hard problems.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Magnetic>
              <Button
                size="lg"
                variant="secondary"
                className="font-mono text-sm font-bold text-foreground"
                asChild
              >
                <Link to="/contact">
                  <Play className="h-4 w-4" />
                  Run AutoQA
                </Link>
              </Button>
            </Magnetic>
            <Magnetic>
              <Button
                size="lg"
                variant="outline"
                className="border-background/30 bg-transparent font-mono text-sm font-bold text-background hover:bg-background/10 hover:text-background"
                asChild
              >
                <Link to="/pricing">View pricing</Link>
              </Button>
            </Magnetic>
          </div>
          <p className="mt-6 font-mono text-xs text-background/60">MIT licensed. Open source.</p>
        </div>
      </Reveal>
    </section>
  );
}
