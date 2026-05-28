import type { Metadata } from "next";
import Script from "next/script";
import { Oswald, DM_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["400", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "C'Flame Fire Protection Product Trading",
  description: "C'FLAME Fire Protection Product Trading is a leading supplier of high-quality fire protection products, offering a wide range of solutions to meet the needs of our customers. We are committed to providing exceptional service and support to ensure the safety and satisfaction of our clients.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased ${oswald.variable} ${dmSans.variable}`}
        suppressHydrationWarning
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var dark=t==='dark';document.documentElement.classList.toggle('dark',dark);})();`,
          }}
        />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
