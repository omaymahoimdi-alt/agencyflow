import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgencyFlow",
  description: "Plateforme de gestion d'agence web.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} min-h-screen bg-slate-50 text-slate-950 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

