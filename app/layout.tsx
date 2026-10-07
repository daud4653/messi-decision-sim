import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { Navigation } from "@/components/Navigation";
import "./globals.css";
const display = localFont({
  src: "../public/fonts/Anton-Regular.ttf",
  variable: "--font-display",
  display: "swap",
});
const body = localFont({
  src: [
    { path: "../public/fonts/BarlowCondensed-Regular.ttf", weight: "400" },
    { path: "../public/fonts/BarlowCondensed-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-body",
  display: "swap",
});
export const metadata: Metadata = {
  title: "LA PULGA // Decision Simulator",
  description:
    "Step into Messi’s boots. Make your decision, then reveal the recorded action.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            LP<span className="brand-slash">//</span>
            <span>
              LA PULGA<small>DECISION SIMULATOR</small>
            </span>
          </Link>
          <Navigation />
          <span className="edition">
            A STUDY IN
            <br />
            FOOTBALL INSTINCT.
          </span>
        </header>
        {children}
        <footer>
          <span>LA PULGA // AN EXPERIMENT IN FOOTBALL INSTINCT</span>
          <Link href="/methodology">DATA, NOT MIND READING.</Link>
        </footer>
      </body>
    </html>
  );
}
