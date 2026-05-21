import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Greenfields - Predictive Maintenance",
  description: "Greenfields is a predictive maintenance web application that helps you monitor and maintain your equipment efficiently. With real-time data analysis and intelligent insights, Greenfields enables you to predict potential failures and optimize maintenance schedules, reducing downtime and improving overall operational efficiency.",
};

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", figtree.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
