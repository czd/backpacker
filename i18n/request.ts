import { getRequestConfig } from "next-intl/server";

// Single-locale (English) for M0. Add more locales in a later milestone.
const DEFAULT_LOCALE = "en";

export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
