"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import type { NavGroup, NavItem } from "@/components/dashboard/dashboard-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { UserMenuUser } from "@/components/dashboard/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { DotsHorizontalIcon } from "@/components/dashboard/sidebar-icons";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const PanelLeftCloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="m16 15-3-3 3-3" />
  </svg>
);

const PanelLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="m13 9 3 3-3 3" />
  </svg>
);

function SidebarUserCard({
  user,
  collapsed,
}: {
  user: UserMenuUser;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const initials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (user.email?.slice(0, 2).toUpperCase() ?? "?");

  const avatarEl = user.image ? (
    <img
      src={user.image}
      alt=""
      className="h-8 w-8 shrink-0 rounded-full object-cover"
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
      {initials}
    </span>
  );

  return (
    <div ref={ref} className="relative shrink-0 border-t border-border">
      {collapsed ? (
        <Tooltip content={user.name || user.email || "User"} side="right">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-center py-3 hover:bg-accent/50 transition-colors"
            aria-label="User options"
          >
            {avatarEl}
          </button>
        </Tooltip>
      ) : (
        <div className="flex items-center gap-2.5 px-3 py-3">
          {avatarEl}
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-sm font-medium leading-none text-foreground">
              {user.name || "User"}
            </p>
            {user.email && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="User options"
          >
            <DotsHorizontalIcon />
          </button>
        </div>
      )}

      {open && (
        <div
          className={cn(
            "absolute z-50 rounded-lg border border-border bg-card py-1 shadow-lg",
            collapsed
              ? "bottom-0 left-full ml-2 w-52"
              : "bottom-full left-1 right-1 mb-1"
          )}
          role="menu"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name || user.email || "User"}
            </p>
            {user.email && user.name && (
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
          <div className="border-t border-border" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/dashboard/profile");
            }}
            className="flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-accent"
            role="menuitem"
          >
            Profile
          </button>
          <div className="px-3 py-1.5">
            <ThemeToggle className="w-full justify-start" />
          </div>
          <div className="border-t border-border" />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-accent"
            role="menuitem"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function DashboardShell({
  topNavItems = [],
  navGroups,
  user,
  children,
}: {
  topNavItems?: NavItem[];
  navGroups: NavGroup[];
  user: UserMenuUser;
  children: React.ReactNode;
}) {
  const { sidebarOpen, openSidebar, closeSidebar, toggleSidebar } = useUIStore();

  useEffect(() => {
    const isMobile = () =>
      typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (sidebarOpen && isMobile()) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleNavNavigate = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      closeSidebar();
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 md:hidden"
            onClick={openSidebar}
            aria-label="Open menu"
          >
            <MenuIcon />
          </Button>
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
            onClick={closeSidebar}
          >
            <Image
              src="/logo.png"
              alt="C'FLAME Fire Protection Product Trading"
              width={200}
              height={56}
              priority
              className="h-11 w-auto"
            />
            <span className="hidden font-semibold text-foreground md:inline-block">
              C&apos;Flame Fire Protection Product Trading
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle className="hidden md:inline-flex" />
          <NotificationBell />
          <div className="hidden md:block">
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        role="presentation"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeSidebar}
        aria-hidden
      />

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col border-r border-border bg-sidebar transition-[transform,width] duration-200 ease-out",
            "fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-72 max-w-[85vw] md:relative md:top-0 md:z-auto md:h-full md:min-h-[calc(100vh-3.5rem)] md:max-w-none md:shrink-0",
            sidebarOpen ? "translate-x-0 md:w-56" : "-translate-x-full md:translate-x-0 md:w-16"
          )}
        >
          {/* Sidebar header: toggle + mobile close */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:justify-end md:px-2">
            <Tooltip
              content={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              side="right"
              className="hidden md:inline-flex"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? <PanelLeftCloseIcon /> : <PanelLeftIcon />}
              </Button>
            </Tooltip>
            <span className="font-semibold text-foreground md:hidden">Menu</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 md:hidden"
              onClick={closeSidebar}
              aria-label="Close menu"
            >
              <CloseIcon />
            </Button>
          </div>

          {/* Nav */}
          <DashboardNav
            topItems={topNavItems}
            groups={navGroups}
            onNavigate={handleNavNavigate}
            collapsed={!sidebarOpen}
          />

          {/* User profile card */}
          <SidebarUserCard user={user} collapsed={!sidebarOpen} />
        </aside>

        {/* Main content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-auto">
          <div className="w-full px-4 py-4 sm:px-6 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
