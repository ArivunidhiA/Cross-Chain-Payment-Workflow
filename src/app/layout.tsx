import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { Navigation } from "@/components/navigation";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Halliday — Workflow Orchestrator",
  description:
    "Cross-chain payment workflow orchestration with failure recovery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${dmSans.variable} antialiased`}>
        <main className="mx-auto min-h-screen max-w-6xl px-6 pb-28 pt-8">
          {children}
        </main>
        <Navigation />
      </body>
    </html>
  );
}
