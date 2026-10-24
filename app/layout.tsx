import type { Metadata } from "next";
import { inter } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vervue-ai.example.com"),
  title: {
    default: "Vervue AI — Better interviews. Clearer insights.",
    template: "%s · Vervue AI",
  },
  description:
    "Vervue AI helps recruiting teams conduct structured video interviews, organize candidate responses, and review AI-assisted insights in one clear workspace.",
  applicationName: "Vervue AI",
  openGraph: {
    type: "website",
    siteName: "Vervue AI",
    locale: "en_US",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
