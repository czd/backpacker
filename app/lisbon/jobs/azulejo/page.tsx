import { AzulejoWrapper } from "./azulejo-wrapper";

/**
 * /lisbon/jobs/azulejo — the M2 PR7 azulejo restorer's-apprentice
 * mini-game.
 *
 * Server Component shell. The actual mini-game mounts in the client
 * wrapper via dynamic import (see `azulejo-wrapper.tsx` for the
 * rationale: keeps the heavy Framer Motion + Vaul + SVG chunk off
 * the world-layer's critical path; the mini-game route owns its own
 * byte budget per `.size-limit.cjs`'s `/lisbon/jobs/*` ceiling).
 */
export default function AzulejoPage() {
  return <AzulejoWrapper />;
}
