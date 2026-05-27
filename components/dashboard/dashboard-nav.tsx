"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { getNavIcon } from "@/components/dashboard/sidebar-icons";

export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };

export function DashboardNav({
  topItems = [],
  groups,
  onNavigate,
  collapsed = false,
}: {
  topItems?: NavItem[];
  groups: NavGroup[];
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  function renderNavLink(item: NavItem) {
    const isActive =
      pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    const Icon = getNavIcon(item.href);

    if (collapsed) {
      return (
        <Tooltip key={item.href} content={item.label} side="right">
          <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
          </Link>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors touch-manipulation",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <nav
      className={cn(
        "flex flex-1 flex-col overflow-y-auto",
        collapsed ? "items-center gap-1 px-2 py-3" : "gap-0.5 px-3 py-3"
      )}
      aria-label="Main"
    >
      {topItems.map((item) => renderNavLink(item))}

      {groups.map((group, i) => (
        <div
          key={group.label}
          className={cn(
            "flex flex-col",
            collapsed ? "gap-1 mt-3" : "gap-0.5 mt-5",
            i === 0 && topItems.length === 0 && "mt-0"
          )}
        >
          {!collapsed ? (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none">
              {group.label}
            </p>
          ) : (
            <div className="h-px w-6 self-center bg-border" />
          )}
          {group.items.map((item) => renderNavLink(item))}
        </div>
      ))}
    </nav>
  );
}
