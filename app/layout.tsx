import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { CloudSync } from "@/components/CloudSync";
import { TotalXpSync } from "@/components/TotalXpSync";
import { BootstrapSync } from "@/components/BootstrapSync";
import { AppSidebar } from "@/components/AppSidebar";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GameStoreProvider, mandarinStore } from "@/lib/store";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const SITE_TITLE = "Slubstack — Learn languages, play games, build streaks";
const SITE_DESCRIPTION =
  "Learn Mandarin, Spanish and German, sharpen your mind with brain training, and compete on daily challenges. Free to play.";

export const metadata: Metadata = {
  metadataBase: new URL("https://slubstack.com"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
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
  openGraph: {
    type: "website",
    siteName: "Slubstack",
    url: "https://slubstack.com",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Slubstack" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
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
      className={`${jakarta.variable} ${notoSC.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=window.matchMedia("(prefers-color-scheme: dark)");function a(){var t=localStorage.getItem("slubstack_theme");if(t!=="light"&&t!=="dark"){t=m.matches?"dark":"light";}document.documentElement.dataset.theme=t;}a();m.addEventListener("change",a);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <GameStoreProvider store={mandarinStore}>
          <AppSidebar />
          <div className="flex flex-1 flex-col lg:ml-60">
            <TopBar />
            <CloudSync />
            <TotalXpSync />
            <BootstrapSync />
            <main className="flex-1">{children}</main>
            <InstallPrompt />
            <BottomNav />
          </div>
          <PostHogProvider />
          <Analytics />
          <SpeedInsights />
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
