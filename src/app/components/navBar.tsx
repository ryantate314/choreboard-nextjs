"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const navLinks = [
  { href: "/chores", label: "Chores" },
  { href: "/inventory", label: "Inventory" },
];

export default function NavBar({ children }: { children?: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center bg-primary-500 mb-4 *:transition-colors">
      <Link href="/" className="block px-4 py-2 font-bold">
        TaterBase
      </Link>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`block px-4 py-2 hover:bg-primary-600 ${
            pathname.startsWith(link.href) ? "bg-primary-600" : ""
          }`}
        >
          {link.label}
        </Link>
      ))}
      <div className="ml-auto flex items-center">
        {children}
      </div>
    </div>
  );
}
