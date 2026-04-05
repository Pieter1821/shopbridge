import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";

import { CartStockSyncBridge } from "@/components/cart/CartStockSyncBridge";
import { Footer } from "@/components/layout/Footer";
import { NavBar } from "@/components/layout/NavBar";
import { cn } from "@/lib/utils";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ShopBridge",
    template: "%s | ShopBridge",
  },
  description: "Modern South African online shopping for fashion, accessories, and everyday essentials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `(() => { try { const storageKey = "shopbridge-theme"; const savedTheme = localStorage.getItem(storageKey); const shouldUseDark = savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; document.documentElement.classList.toggle("dark", shouldUseDark); } catch (error) {} })();`;

  const shell = (
    <div className="flex min-h-screen flex-col">
      <CartStockSyncBridge />
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", poppins.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          id="theme-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="min-h-full bg-slate-100 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-50">
        <ClerkProvider>{shell}</ClerkProvider>
      </body>
    </html>
  );
}
