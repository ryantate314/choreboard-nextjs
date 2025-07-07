"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { addDays } from "../dateUtils";

export default function MenuBar({ sprintStart }: { sprintStart: Date }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setShowMenu(false);
    }
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showMenu]);

  return <div className="flex bg-primary-500 mb-2 *:transition-colors relative *:py-2">
    <Link href="/" className="block px-4 py-2 font-bold">ChoreBoard</Link>
    <div>{ sprintStart.toLocaleDateString() } - { addDays(sprintStart, 6).toLocaleDateString() }</div>
    <button
      className="ml-auto bg-primary-500 text-on-surface px-4 py-2 rounded hover:bg-primary-600 transition-colors"
      onClick={() => setShowMenu(true)}
      type="button"
    >&#8942;</button>
    { showMenu && (
      <div
        ref={menuRef}
        className="absolute right-0 top-full mt-2 bg-surface-800 border rounded shadow-lg z-50 min-w-[150px] p-2"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex items-center">
          <Link href={{
              pathname: '/',
              query: { weekStart: addDays(sprintStart, -7).toLocaleDateString() }
            }}
            className="block w-full text-left px-2 py-1 hover:bg-surface-700 rounded"
            onClick={() => setShowMenu(false)}
          >&lsaquo;</Link>
          { sprintStart.toLocaleDateString() }
          <Link href={{
              pathname: '/',
              query: { weekStart: addDays(sprintStart, 7).toLocaleDateString() }
            }}
            className="block w-full text-left px-2 py-1 hover:bg-surface-700 rounded"
            onClick={() => setShowMenu(false)}
          >&rsaquo;</Link>
        </div>
      </div>
    )}
  </div>;
}