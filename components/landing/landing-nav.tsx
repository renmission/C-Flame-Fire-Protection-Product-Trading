"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, ChevronDown, Menu, X } from "lucide-react";

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] relative z-30"
    >
      <div className="px-8 md:px-14 lg:px-20 py-3 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="C'FLAME Fire Protection"
            width={300}
            height={86}
            priority
            className="h-24 w-auto"
          />
          <div className="hidden lg:flex flex-col leading-tight">
            <span
              className="text-3xl font-bold uppercase tracking-wide text-primary"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              C&apos;FLAME
            </span>
            <span className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Fire Protection Product Trading
            </span>
          </div>
        </Link>

        {/* Right – desktop */}
        <div className="hidden md:flex items-center gap-5">
          <a
            href="tel:+639123654789"
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground/75 hover:text-primary transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-primary" />
            (+63) 0912 365 4789
          </a>
          <Button
            asChild
            size="sm"
            className="rounded-none px-5 py-2 h-9 font-semibold tracking-wide text-xs uppercase"
          >
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-1.5 rounded text-foreground/70 hover:text-primary"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white px-6 py-4 space-y-3">
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="tel:+639123654789"
              className="flex items-center gap-2 text-sm font-medium text-foreground/70"
            >
              <Phone className="h-4 w-4 text-primary" />
              (800) 450-2885
            </a>
            <Button
              asChild
              className="w-full rounded-none uppercase tracking-wide text-xs font-semibold"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
