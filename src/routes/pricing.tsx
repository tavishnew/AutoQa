import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Stagger, StaggerItem, HoverLift, Reveal } from "@/components/motion/reveal";
import { GlowCard } from "@/components/motion/spotlight";
import { Magnetic } from "@/components/motion/interactions";
import { PageHero, PageShell, SectionHeading } from "@/components/site/page-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — AutoQA" },
      {
        name: "description",
        content:
          "Free local-first open source tier, a Pro plan with cloud inference, and Team plans with shared reports and CI integration.",
      },
      { property: "og:title", content: "Pricing — AutoQA" },
      {
        property: "og:description",
        content: "Start free and local. Scale to cloud inference and CI when you need it.",
      },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Local",
    price: "Free",
    note: "MIT licensed, forever",
    features: [
      "Unlimited local runs",
      "Ollama models",
      "Browser + API tests",
      "HTML & JSON reports",
      "Community support",
    ],
    cta: "Clone the repo",
    featured: false,
  },
  {
    name: "Pro",
    price: "$29",
    note: "per developer / month",
    features: [
      "Everything in Local",
      "Groq cloud boost",
      "Self-healing selector history",
      "Parallel sandboxes",
      "Priority support",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Team",
    price: "Custom",
    note: "annual, invoiced",
    features: [
      "Everything in Pro",
      "Shared run history",
      "CI/CD integration",
      "SSO & audit logs",
      "Dedicated onboarding",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

function PricingPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Pricing"
        title="Start local and free. Scale when it pays off."
        description="The core engine is open source. You only pay when you want cloud inference, parallel sandboxes, or shared team reporting."
      />

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Stagger className="grid gap-6 lg:grid-cols-3" gap={0.1}>
            {plans.map((plan) => (
              <StaggerItem key={plan.name}>
                <HoverLift>
                  <GlowCard className="h-full">
                    <div
                      className={cn(
                        "flex h-full flex-col rounded-xl border bg-card p-8",
                        plan.featured
                          ? "border-foreground shadow-xl lg:-translate-y-2"
                          : "border-border",
                      )}
                    >
                      {plan.featured ? (
                        <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-foreground px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-background">
                          <Sparkles className="h-3 w-3" />
                          Most popular
                        </span>
                      ) : null}
                      <h3 className="font-mono text-lg font-bold text-foreground">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-mono text-4xl font-bold text-foreground">
                          {plan.price}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{plan.note}</p>
                      <ul className="mt-6 flex-1 space-y-3">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="mt-8 font-mono text-xs font-bold"
                        variant={plan.featured ? "default" : "outline"}
                        asChild
                      >
                        <Link to="/contact">{plan.cta}</Link>
                      </Button>
                    </div>
                  </GlowCard>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            align="center"
            title="Not sure which tier fits?"
            description="Run the open source version against a staging environment first. Upgrade only when parallel runs or shared reporting start to matter."
          />
          <Reveal delay={0.15} className="mt-8">
            <Magnetic>
              <Button size="lg" className="font-mono text-sm font-bold" asChild>
                <Link to="/contact">Get a recommendation</Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
