import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "True Trader — Interactive Communication Dashboard",
  description:
    "True Trader live video & audio calling, screen sharing, group chat, and host announcement broadcasts — your professional trading community hub.",
  icons: {
    icon: "/images/truetrader-logo.png",
    apple: "/images/truetrader-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080b14] text-slate-100 antialiased selection:bg-[#d4af37] selection:text-[#0b0e1a]">
        {children}
      </body>
    </html>
  );
}
