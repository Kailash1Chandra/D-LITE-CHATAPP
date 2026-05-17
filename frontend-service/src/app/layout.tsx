import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/shared/components/Toast";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

const inter = localFont({
  src: "../../public/fonts/inter-variable.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "D-Lite — Modern Messaging",
    template: "%s | D-Lite",
  },
  description: "A premium real-time messaging platform with AI-powered features, voice/video calls, and seamless group collaboration.",
  keywords: ["messaging", "real-time", "chat", "ai assistant", "video calls", "team collaboration"],
  authors: [{ name: "D-Lite Team" }],
  creator: "D-Lite Platform",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dlite.chat",
    title: "D-Lite — Modern Messaging",
    description: "A premium real-time messaging platform with AI-powered features, voice/video calls, and seamless group collaboration.",
    siteName: "D-Lite",
  },
  twitter: {
    card: "summary_large_image",
    title: "D-Lite — Modern Messaging",
    description: "A premium real-time messaging platform with AI-powered features, voice/video calls, and seamless group collaboration.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('dlite-theme') || 'light';
              document.documentElement.setAttribute('data-theme', t);
            } catch(e) {
              document.documentElement.setAttribute('data-theme', 'light');
            }
          })();
        `}} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
