import { Link } from "@tanstack/react-router";
import { Terminal } from "lucide-react";

const groups = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/features" },
      { label: "Workflow", to: "/workflow" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", to: "/docs" },
      { label: "Safety", to: "/safety" },
      { label: "Contact", to: "/contact" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/60 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <Terminal className="h-5 w-5" strokeWidth={2.5} />
            <span className="font-mono text-lg font-bold tracking-tight">AutoQA</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            The local-first AI QA engineer. Discover, generate, run, and explain tests without
            writing a single Playwright script.
          </p>
        </div>

        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
              {group.title}
            </h3>
            <ul className="mt-4 space-y-2">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row">
        <p className="font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()} AutoQA. Released under MIT.
        </p>
        <p className="font-mono text-xs text-muted-foreground">Built for teams who ship daily.</p>
      </div>
    </footer>
  );
}
