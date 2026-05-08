# Research

Persistent capture of academic-agent research and other long-form discovery work that informs design decisions. Future agents and future-you read from here when picking up cross-milestone work; agents writing here when they finish a discovery dispatch.

## Why this exists

The brief's pillar #6 ("Real over rendered") and §9.3 (cultural authenticity guard) both depend on real-world knowledge surfaced by the academic agents (Anthropologist, Historian, Geographer) and from external sources. That knowledge is expensive to produce and easy to lose: agent-dispatch results sit in conversation history that gets compressed; commit messages are summaries; STATUS.md rolls forward each session. **Research captured here doesn't roll over — it accretes.**

When M4 needs to design the Tokyo POI set, the Anthropologist's M1 Lisbon framework should be a reference, not a redo. When the Narrative Designer polishes M3 dialogue, the Historian's M2 PR7 azulejo backstory framework is the substrate. When a new agent joins a future conversation, this directory is what they catch up from.

## Structure

```
research/
  README.md                   ← this file (the pattern)
  <city>/                     ← city-scoped research (lisbon, tokyo, marrakech)
    <topic>/                  ← per topic / per PR
      README.md               ← synthesis + decisions surfaced for owner
      <agent>-<YYYY-MM-DD>.md ← full agent report verbatim
      bibliography.md         ← Portuguese-language scholarship + reference URLs
      ...
  <cross-cutting-topic>/      ← project-wide (e.g., colonial-legacy/, gentrification/)
    README.md
    ...
```

City-scoped is the default. Cross-cutting topics (e.g., the colonial-legacy ADR that AGENTS.md §15 says "needs an explicit policy before any Belém POI is written") get their own top-level folder when the topic spans cities.

## When to write here

**Always**, when an academic agent (Anthropologist, Historian, Geographer) completes a discovery dispatch. The orchestrator captures the full report verbatim in `<agent>-<YYYY-MM-DD>.md` and writes a synthesis in the topic's `README.md`. Don't summarize away detail; future readers prefer the long-form.

**Optionally**, when other agents (Game Designer, UI Designer, etc.) produce substantive design discovery — brainstorming output, milestone reviews with cross-cutting findings, etc. The topic folder's README.md indexes whatever's there.

**When in doubt, capture.** Research is cheap to write and expensive to recreate. The compounding cost is hours; the storage cost is bytes.

## When to read here

- At the start of any session that touches a city, a milestone, or a cross-cutting concern that has an existing research folder.
- Before dispatching an academic agent on a topic where prior agents have done work — pass the path in the prompt so the new agent doesn't re-derive what's already known.
- During PR review, when a code change touches culturally-substantive content (per §9.3 — descriptions, dialogue, place names, mini-game flavor).

## Conventions

- **Verbatim agent reports.** Capture the full output as the agent wrote it. The synthesis README distills decisions; the verbatim file preserves the reasoning chain.
- **Date-stamp filenames.** `<agent>-<YYYY-MM-DD>.md`. If the same agent produces multiple reports on the same topic, suffix with a discriminator (`anthropologist-2026-05-03-panels.md` vs `anthropologist-2026-05-03-busking.md`).
- **YAML frontmatter** at the top of each report file with: `agent`, `date`, `topic`, `milestone`, `dispatched-by` (optional), `related-adrs` (optional). Helps future tooling find files by metadata.
- **Bibliography per topic.** When agents cite scholarship, collect citations into `bibliography.md` rather than scattering them across reports. Cross-references between topics that share sources are valuable.
- **Image references go to `docs/images/<topic>/`** with a local `sources.md`; the project's authoritative credit ledger is `CREDITS.md` at repo root.
- **Don't edit agent reports after capture.** If a finding is superseded by a later report, write the correction in the topic README's synthesis. The historical record stays intact.

## Cross-references

- `CREDITS.md` (repo root) — authoritative credit ledger for any external reference material the project uses.
- `DECISIONS.md` — ADRs that lock decisions emerging from research.
- `BUILD-LOG.md` — the project narrative that often summarizes research highlights.
- `STATUS.md` — current-state pointer to active research dispatches.
