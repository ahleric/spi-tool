// Server-side internationalization utilities
import { cookies, headers } from "next/headers";
import { defaultLocale, type Locale, LOCALE_STORAGE_KEY } from "./i18n";

// Detect locale from headers (server-side only)
export async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const stored = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
    if (stored === "zh" || stored === "en") {
      return stored;
    }

    const headersList = await headers();
    const acceptLanguage = headersList.get("accept-language") || "";

    // Check browser language - prioritize Chinese
    if (acceptLanguage.includes("zh")) {
      return "zh";
    }

    // Default to English
    return defaultLocale;
  } catch {
    // Fallback if headers() fails
    return defaultLocale;
  }
}
