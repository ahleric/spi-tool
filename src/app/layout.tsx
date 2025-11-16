import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n-server";
import { LocaleSwitcher } from "@/components/locale-switcher";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

export const metadata: Metadata = {
  title: "SPI Tool",
  description: "Spotify Popularity Intelligence for artists, tracks, and events.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale === "zh" ? "zh-CN" : "en"}
      suppressHydrationWarning
    >
      <body className={`${inter.variable} ${grotesk.variable} bg-neutral-950 text-white antialiased`}>
        <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-950">
          <LocaleSwitcher />
          {children}
        </div>
      </body>
    </html>
  );
}
