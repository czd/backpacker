@AGENTS.md

## Project doc set

- `AGENTS.md` — canonical brief (imported above). The first thing to read every session.
- `DECISIONS.md` — Architecture Decision Records (ADRs). Why we chose what we chose.
- `STATUS.md` — current state. What's done, what's next, what's blocked. Rolling, replaced each session.
- `BUILD-LOG.md` — milestone narrative + agent-review highlights. Newest-first. The "what made the project richer that we want to remember" file.

When closing out a milestone or significant chunk: update `STATUS.md` and add an entry to `BUILD-LOG.md`. ADRs go in `DECISIONS.md` only when there's a real decision worth recording.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
