import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
};

/**
 * Splash entry point — navigates to /lisbon (the M1 city).
 *
 * Uses Base UI's `render` prop (the equivalent of shadcn/Radix's `asChild`)
 * to make the rendered element a Next.js Link, so we get a real anchor
 * with the Button's styling instead of a `<button>` nested in an `<a>`
 * (which is invalid HTML). `nativeButton={false}` tells Base UI not to
 * apply <button>-specific behaviors to the rendered <a>.
 *
 * No `"use client"` needed: Link + Button are both server-friendly.
 */
export function BeginJourneyButton({ label }: Props) {
  return (
    <Button
      size="lg"
      className="w-full"
      nativeButton={false}
      // `prefetch={false}`: keep the MapLibre + Convex chunks out of
      // the splash's First Load JS. The user pays the map cost when
      // they navigate to /lisbon, not on splash mount. AGENTS.md §6.7
      // ceiling is 200KB gz; /lisbon already runs over (flagged in
      // STATUS) and there is no point making the splash pay too.
      render={<Link href="/lisbon" prefetch={false} />}
    >
      {label}
    </Button>
  );
}
