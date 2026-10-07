import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
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
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            LP<span className="brand-slash">//</span>
            <span>
              LA PULGA<small>DECISION SIMULATOR</small>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/play">PLAY</Link>
            <Link href="/results">YOUR RESULTS</Link>
            <Link href="/methodology">THE METHOD</Link>
          </nav>
          <span className="edition">FOOTBALL, FRAME BY FRAME.</span>
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
