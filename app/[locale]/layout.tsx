import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Providers from "../providers";
import BackToTop from "@/components/ui/BackToTop";

import PwaRegister from "@/components/PwaRegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "LinkID",
  description: "Your professional identity, simplified.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LinkID",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const messages = await getMessages();
  // Basic RTL handling for arabic
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <PwaRegister />
          <Providers>{children}</Providers>
          <BackToTop />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
