import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { CloudSync } from "@/components/CloudSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Slubstack — Mandarin flashcards",
  description:
    "Learn beginner Mandarin with short, daily flashcard sessions. Authentic, native-sounding phrasing — not textbook stiffness.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Slubstack",
  },
  icons: {
    icon: "/3dpanda.png",
    apple: "/3dpanda.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${notoSC.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <TopBar />
        <CloudSync />
        <main className="flex-1">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
