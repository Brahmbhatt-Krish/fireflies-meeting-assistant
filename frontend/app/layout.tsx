import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { ToastProvider } from "@/components/ui/ToastContext";
import { ThemeProvider } from "@/components/ui/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fireflies.ai Clone — Meeting Assistant",
  description: "Meeting notes, transcripts, and AI-generated summaries platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex bg-slate-50 dark:bg-[#0f0f1a] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            <div className="flex h-screen w-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto min-h-0 bg-slate-50 dark:bg-[#0f0f1a]">
                  {children}
                </main>
              </div>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
