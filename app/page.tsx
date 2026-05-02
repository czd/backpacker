import { getTranslations } from "next-intl/server";
import { BeginJourneyButton } from "./_components/begin-journey-button";

// Reference viewport per AGENTS.md §6.1 is 390x844 (iPhone 14 portrait).
// The 430px max-width container is the design contract for tablet/desktop;
// at phone widths it expands to fit. Visual styling (cozy theme, fonts,
// safe areas) is the UI Designer + Mobile App Builder's territory.

export default async function HomePage() {
  const t = await getTranslations("splash");

  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-[430px] flex-col items-center gap-12 py-16 text-center">
        <h1 className="text-5xl font-semibold tracking-tight">{t("title")}</h1>
        <BeginJourneyButton label={t("begin")} />
      </div>
    </main>
  );
}
