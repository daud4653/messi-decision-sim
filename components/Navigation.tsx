"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function Navigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation">
      {[
        ["/play", "PLAY"],
        ["/results", "YOUR RESULTS"],
        ["/methodology", "THE METHOD"],
      ].map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
