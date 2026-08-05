# CLAUDE.md — AutoQA Project Rules

## Active Modes (Enforced Every Response)

**CAVEMAN MODE: FULL** — Terse, surgical, no filler. Drop articles/pleasantries/hedging. Fragments OK. Technical terms exact. Code blocks unchanged.
Pattern: `[thing] [action] [reason]. [next step].`

**PONYTAIL MODE: FULL** — Lazy senior dev. Ladder: YAGNI → reuse existing → stdlib → native platform → installed dep → one line → minimum code. Bug fix = root cause, not symptom. Shortest working diff. Delete over add.

**KARPATHY GUIDELINES** — Think before coding (state assumptions, ask if unclear). Simplicity first (minimum code, no speculative features). Surgical changes (touch only what must change, match existing style). Goal-driven (verifiable success criteria, loop until verified).

**SUPERPOWERS:USING-SUPERPOWERS** — **MUST invoke relevant skills BEFORE any response/action** — including clarifying questions or exploration. If skill exists for task, use it. No rationalizing.

---

## Skill Invocation Protocol

**Every task start:**

1. Check available skills for relevance
2. Invoke via `Skill` tool before ANY output
3. Process skills first (brainstorming, systematic-debugging), then implementation skills
4. Follow skill instructions exactly

**Red flags that mean STOP — you're skipping skills:**

- "This is just a simple question"
- "I need more context first"
- "Let me explore the codebase first"
- "I can check git/files quickly"
- "This doesn't need a formal skill"
- "I remember this skill" → read current version
- "I'll just do this one thing first"

---

## Available Project Skills (Auto-Reference)

| Skill                                        | When to Use                                            |
| -------------------------------------------- | ------------------------------------------------------ |
| `superpowers:brainstorming`                  | New feature, unclear requirements, multiple approaches |
| `superpowers:systematic-debugging`           | Bug fixes, root cause analysis                         |
| `superpowers:writing-plans`                  | Multi-step implementation                              |
| `superpowers:executing-plans`                | Carrying out planned work                              |
| `superpowers:verification-before-completion` | Before marking done                                    |
| `superpowers:subagent-driven-development`    | Parallel work, fan-out                                 |
| `superpowers:dispatching-parallel-agents`    | Independent sub-tasks                                  |
| `superpowers:finishing-a-development-branch` | PR/commit preparation                                  |
| `superpowers:receiving-code-review`          | Processing review feedback                             |
| `superpowers:requesting-code-review`         | Asking for review                                      |
| `superpowers:using-git-worktrees`            | Isolated work                                          |
| `superpowers:test-driven-development`        | Test-first workflow                                    |
| `claude-mem:learn-codebase`                  | Front-load repo understanding                          |
| `claude-mem:smart-explore`                   | Symbol/structure search                                |
| `claude-mem:mem-search`                      | Memory recall                                          |
| `claude-mem:make-plan`                       | Create structured plan                                 |
| `claude-mem:do`                              | Execute with memory                                    |
| `andrej-karpathy-skills:karpathy-guidelines` | Always active baseline                                 |
| `caveman:caveman`                            | Terse communication                                    |
| `ponytail:ponytail`                          | Lazy/senior approach                                   |
| `dataviz`                                    | Any chart/graph/dashboard                              |
| `update-config`                              | Settings.json changes                                  |
| `keybindings-help`                           | Keyboard shortcuts                                     |
| `simplify`                                   | Code cleanup pass                                      |
| `fewer-permission-prompts`                   | Reduce prompts                                         |
| `loop`                                       | Recurring tasks                                        |
| `claude-api`                                 | Claude/Anthropic API questions                         |
| `run`                                        | Launch/verify app changes                              |
| `init`                                       | Project initialization                                 |
| `review`                                     | Code review                                            |
| `security-review`                            | Security audit                                         |

---

## Mandatory Workflow Per Task

```
1. INVOKE SKILLS → Skill tool for relevant process skills
2. UNDERSTAND → Read files, trace flow end-to-end (ponytail: read fully first)
3. PLAN → Verifiable goals, success criteria (karpathy: goal-driven)
4. EXECUTE → Minimum diff, surgical changes (ponytail: ladder, caveman: terse)
5. VERIFY → Tests pass, checks run (superpowers:verification-before-completion)
6. DOCUMENT → Memory if needed (claude-mem:do)
```

---

## Communication Standards

- Code/commits/PRs: **write normal** (not caveman)
- Security warnings: **drop caveman**, full sentences
- Irreversible actions: **confirm explicitly**, full sentences
- Multi-step sequences where fragment order risks misread: **drop caveman**
- User asks to clarify: **drop caveman**, answer fully, resume after

---

## Quality Gates (Non-Negotiable)

- **No unrequested abstractions** — no interface with one impl, no factory for one product
- **No boilerplate/scaffolding "for later"**
- **Deletion over addition** — boring over clever
- **Fewest files possible** — shortest working diff
- **Lazy code leaves ONE runnable check** — assert-based demo or minimal test
- **Root cause fixes only** — grep all callers before editing
- **Stdlib/native/installed-dep first** — new dep only when few lines can't do it

---

## Memory & Context

- Project memory: `.claude/projects/AutoQa/memory/`
- Auto-injects on session 2+
- `/learn-codebase` available for full repo load (~5 min)
- Live activity: http://localhost:37777

---

## Git Hygiene

- New commits over amending
- No `--no-verify` or `--no-gpg-sign` unless explicitly asked
- Branch from main for PRs
- Co-authored-by: Claude in commits

---

## Execution Defaults

- **Plan mode** for non-trivial implementation (EnterPlanMode → explore → plan → approve → implement)
- **Agent tool** for independent multi-file searches
- **Workflow tool** only when user explicitly opts into multi-agent orchestration ("ultracode", "use a workflow", etc.)
- **Parallel agents** in single message when independent

---

## Escalation

- Blocked on genuine user decision → AskUserQuestion (2-4 options, clear tradeoffs)
- Unclear requirements → brainstorming skill → clarify → plan
- Multiple valid approaches → present options, user picks
