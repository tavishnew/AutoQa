import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Github, Loader2, Mail, MessageSquare, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/interactions";
import { PageHero, PageShell, SectionHeading } from "@/components/site/page-shell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Get Started with AutoQA" },
      {
        name: "description",
        content:
          "Request early access, ask about team pricing, or tell us what AutoQA should test next.",
      },
      { property: "og:title", content: "Contact — Get Started with AutoQA" },
      {
        property: "og:description",
        content: "Reach the AutoQA team about early access, pricing, or feedback.",
      },
    ],
  }),
  component: ContactPage,
});

const channels = [
  {
    icon: Mail,
    title: "Email",
    description: "hello@autoqa.dev — answered within one business day.",
  },
  {
    icon: Github,
    title: "GitHub",
    description: "Open an issue or a discussion on the open source repo.",
  },
  {
    icon: MessageSquare,
    title: "Community",
    description: "Join the chat to compare notes with other QA teams.",
  },
];

function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    window.setTimeout(() => setStatus("sent"), 700);
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Contact"
        title="Tell us what you need tested."
        description="Early access, team pricing, or a feature you are missing — send it over and we will get back to you."
      />

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-card p-8 shadow-sm"
            >
              <h2 className="font-mono text-xl font-bold text-foreground">Send a message</h2>
              <div className="mt-6 grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Ada Lovelace" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ada@company.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">What are you building?</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="We ship a React app and want API + browser coverage…"
                    required
                  />
                </div>
                <Magnetic className="w-fit" strength={0.18}>
                  <Button
                    type="submit"
                    className="font-mono text-xs font-bold"
                    disabled={status !== "idle"}
                  >
                    {status === "sending" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : status === "sent" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {status === "sending"
                      ? "Sending…"
                      : status === "sent"
                        ? "Message sent"
                        : "Send message"}
                  </Button>
                </Magnetic>
                <AnimatePresence>
                  {status === "sent" ? (
                    <motion.p
                      role="status"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-lg border border-border bg-muted px-4 py-3 font-mono text-xs text-muted-foreground"
                    >
                      Thanks — we will reply to you shortly.
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            </form>
          </Reveal>

          <div>
            <SectionHeading title="Other ways to reach us" />
            <Stagger className="mt-8 space-y-4" gap={0.08}>
              {channels.map((channel) => (
                <StaggerItem key={channel.title}>
                  <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                      <channel.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-mono text-sm font-bold text-foreground">
                        {channel.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{channel.description}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
