@AGENTS.md

## Project doc set

- `AGENTS.md` — canonical brief (imported above). The first thing to read every session.
- `DECISIONS.md` — Architecture Decision Records (ADRs). Why we chose what we chose.
- `STATUS.md` — current state. What's done, what's next, what's blocked. Rolling, replaced each session.
- `BUILD-LOG.md` — milestone narrative + agent-review highlights. Newest-first. The "what made the project richer that we want to remember" file.
- `MILESTONES.md` — milestone DoDs M0–M5 (extracted from `AGENTS.md` §13). Consult when starting a milestone or verifying acceptance criteria.
- `GLOSSARY.md` — glossary (`AGENTS.md` §17) and inspiration/reading list (`AGENTS.md` §16). Pure reference; consult on demand.
- `research/` — persistent capture of academic-agent research (Anthropologist, Historian, Geographer) and other long-form discovery that informs design. Verbatim reports under `research/<city>/<topic>/<agent>-<YYYY-MM-DD>.md`; per-topic synthesis in each topic's `README.md`. **Read `research/README.md` first.** Always read here before re-dispatching academics on a topic that already has a folder; always capture here when an academic agent finishes a discovery dispatch.
- `CREDITS.md` — authoritative credit ledger for external material (image references, fonts, scholarship, libraries). Add to it in the same commit that adds the asset.

When closing out a milestone or significant chunk: update `STATUS.md` and add an entry to `BUILD-LOG.md`. ADRs go in `DECISIONS.md` only when there's a real decision worth recording. Academic-agent discovery dispatches always land in `research/`.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
