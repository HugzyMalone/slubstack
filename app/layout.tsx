import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Noto_Sans_SC } from "next/font/google";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { CloudSync } from "@/components/CloudSync";
import { TotalXpSync } from "@/components/TotalXpSync";
import { BootstrapSync } from "@/components/BootstrapSync";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "sonner";
import { GameStoreProvider, mandarinStore } from "@/lib/store";

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

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Slubstack — Learn languages",
  description:
    "Learn Mandarin and German with short, daily flashcard sessions.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Slubstack",
  },
  icons: {
    icon: "/slubstack-logo.png",
    apple: "/slubstack-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0e26" },
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
      className={`${geistSans.variable} ${notoSC.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <GameStoreProvider store={mandarinStore}>
          <AppSidebar />
          <div className="flex flex-1 flex-col lg:ml-60">
            <TopBar />
            <CloudSync />
            <TotalXpSync />
            <BootstrapSync />
            <main className="flex-1">{children}</main>
            <BottomNav />
          </div>
          <Toaster
            position="top-center"
            offset={72}
            theme="light"
            toastOptions={{
              style: {
                background: "var(--surface)",
                color: "var(--fg)",
                border: "1.5px solid var(--border)",
                fontWeight: 600,
              },
            }}
          />
        </GameStoreProvider>
      </body>
    </html>
  );
}
