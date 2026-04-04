import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { NavBar } from "@/components/layout/NavBar";
import { cn } from "@/lib/utils";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const shell = (
    <div className="flex min-h-screen flex-col">
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
      <body className="min-h-full bg-slate-100 text-slate-950">
        {hasClerkKeys ? <ClerkProvider>{shell}</ClerkProvider> : shell}
      </body>
    </html>
  );
}
