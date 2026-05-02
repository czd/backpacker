import { getTranslations } from "next-intl/server";
import { BeginJourneyButton } from "./_components/begin-journey-button";

// Reference viewport per AGENTS.md §6.1 is 390x844 (iPhone 14 portrait).
// The 430px max-width container is the design contract for tablet/desktop;
// at phone widths it expands to fit. Visual styling (cozy theme, fonts,
// safe areas) is the UI Designer + Mobile App Builder's territory.

export default async function HomePage() {
  const t = await getTranslations("splash");

  return (
    // `min-h-svh` is the iOS Safari address-bar-aware unit. `pt-safe`
    // and `pb-safe` add the device safe-area insets on top of the
    // existing content padding so the splash never tucks under the
    // notch or home indicator. We deliberately omit side safe-area
    // padding — portrait phones don't have meaningful side insets.
    <main className="flex min-h-svh w-full flex-col items-center justify-center px-6 pt-safe pb-safe">
      <div className="flex w-full max-w-[430px] flex-col items-center gap-12 py-16 text-center">
        <h1 className="font-heading text-5xl font-medium tracking-tight">
          {t("title")}
        </h1>
        <BeginJourneyButton label={t("begin")} />
      </div>
    </main>
  );
}
