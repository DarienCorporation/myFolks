"use client";

import { useState } from "react";

type NavItem = {
  label: string;
  id: string;
};

const navItems: NavItem[] = [
  { label: "Discover", id: "discover" },
  { label: "Friends", id: "friends" },
  { label: "Messages", id: "messages" },
  { label: "Create profile", id: "create-profile" },
  { label: "My profile", id: "profile" },
  { label: "Settings", id: "settings" },
];

type HeaderProps = {
  activePage?: string;
  onNavigate?: (page: string) => void;
};

export default function Header({
  activePage = "discover",
  onNavigate,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (page: string) => {
    setMenuOpen(false);
    onNavigate?.(page);
  };

  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-[76px] max-w-[1180px] items-center justify-between gap-6 px-5 sm:px-8">
        {/* Wordmark */}
        <button
          type="button"
          onClick={() => handleNavigate("discover")}
          className="group flex shrink-0 items-center gap-3 text-left"
          aria-label="Go to Discover"
        >
          <span className="text-[25px] font-extrabold tracking-[-0.055em] text-[var(--ink)] transition-opacity duration-300 group-hover:opacity-75">
            myFolks
          </span>

          <span className="hidden border-l border-[var(--line)] pl-3 text-sm font-medium text-[var(--muted)] sm:block">
            Find common ground.
          </span>
        </button>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={[
                  "rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-[var(--ink)] text-[var(--paper)] shadow-[0_4px_14px_rgba(37,33,31,0.12)]"
                    : "text-[var(--muted)] hover:-translate-y-0.5 hover:bg-[var(--mist)] hover:text-[var(--ink)]",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="group flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink)] transition-all duration-300 hover:bg-[var(--mist)] lg:hidden"
        >
          <span className="sr-only">
            {menuOpen ? "Close menu" : "Open menu"}
          </span>

          <span className="relative flex h-5 w-5 items-center justify-center">
            {/* Top line */}
            <span
              className={[
                "absolute h-[1.5px] w-[17px] rounded-full bg-current",
                "transition-all duration-500",
                "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
                menuOpen
                  ? "rotate-45"
                  : "-translate-y-[5px] group-hover:w-[19px]",
              ].join(" ")}
            />

            {/* Middle line */}
            <span
              className={[
                "absolute h-[1.5px] w-[17px] rounded-full bg-current",
                "transition-all duration-300",
                "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
                menuOpen
                  ? "scale-x-0 opacity-0"
                  : "scale-x-100 opacity-100 group-hover:w-[14px]",
              ].join(" ")}
            />

            {/* Bottom line */}
            <span
              className={[
                "absolute h-[1.5px] w-[17px] rounded-full bg-current",
                "transition-all duration-500",
                "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
                menuOpen
                  ? "-rotate-45"
                  : "translate-y-[5px] group-hover:w-[19px]",
              ].join(" ")}
            />
          </span>
        </button>
      </div>

      {/* Mobile navigation */}
      <div
        className={[
          "overflow-hidden border-t border-[var(--line)] transition-[max-height,opacity,transform] duration-500",
          "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
          menuOpen
            ? "max-h-[420px] translate-y-0 opacity-100"
            : "max-h-0 -translate-y-2 opacity-0",
        ].join(" ")}
      >
        <nav
          className="mx-auto flex max-w-[1180px] flex-col px-5 py-3 sm:px-8"
          aria-label="Mobile navigation"
        >
          {navItems.map((item, index) => {
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={[
                  "rounded-xl px-4 py-3 text-left text-sm font-semibold",
                  "transition-all duration-300",
                  "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
                  menuOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-3 opacity-0",
                  isActive
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "text-[var(--muted)] hover:translate-x-1 hover:bg-[var(--mist)] hover:text-[var(--ink)]",
                ].join(" ")}
                style={{
                  transitionDelay: menuOpen ? `${index * 35}ms` : "0ms",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}