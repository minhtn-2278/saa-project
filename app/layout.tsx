import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "700"],
  display: "swap",
});

const digitalNumbers = localFont({
  src: "../public/fonts/DigitalNumbers-Regular.woff",
  variable: "--font-digital-numbers",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "SAA 2025 - Sun Annual Awards",
  description:
    "Sun Annual Awards 2025 - Root Further. Celebrate excellence at Sun*.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${montserrat.variable} ${digitalNumbers.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-montserrat)]">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
