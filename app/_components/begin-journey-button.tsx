"use client";

import { Button } from "@/components/ui/button";

type Props = {
  label: string;
};

/**
 * No-op begin-journey button.
 *
 * M0 deliberately does nothing on press — it is a placeholder until
 * the M1 work introduces the first city and map. The click handler
 * exists only so we can prove the button is interactive end-to-end.
 */
export function BeginJourneyButton({ label }: Props) {
  return (
    <Button
      size="lg"
      className="w-full"
      onClick={() => {
        // eslint-disable-next-line no-console
        console.log("begin");
      }}
    >
      {label}
    </Button>
  );
}
