"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingNav } from "./landing-nav";

/* ─── Animation variants ─────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13 } },
};

/* ─── SVG illustrations ──────────────────────────────────────── */
function SmokeAlarmSVG() {
  return (
    <svg viewBox="0 0 90 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <ellipse cx="45" cy="12" rx="45" ry="12" fill="#f1f5f9" />
      <ellipse cx="45" cy="12" rx="42" ry="10" stroke="#cbd5e1" strokeWidth="1" fill="none" />
      {[25, 35, 45, 55, 65].map((x) => (
        <line key={x} x1={x} y1="7" x2={x} y2="17" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      ))}
      <circle cx="45" cy="12" r="5" fill="#ef233c" />
      <circle cx="45" cy="12" r="2.5" fill="#d90429" />
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export function HeroSection() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f6f8" }}>
      <LandingNav />

      <main className="flex-1 flex flex-col md:flex-row">
        {/* ── Left: Text content ── */}
        <motion.div
          className="flex flex-col justify-center px-8 md:px-14 lg:px-20 py-16 md:py-0 w-full md:w-[46%] relative z-10"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Safety First badge */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
            <span className="h-2 w-2 rounded-full bg-primary block" />
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
              Safety First
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold text-foreground leading-[1.05] mb-6 uppercase tracking-wide"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            Fire Equipment
            <br />
            &amp; Services
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-sm md:text-base text-muted-foreground max-w-sm leading-relaxed mb-10"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            We provide fire safety services &amp; equipment for homes and businesses across the region.
          </motion.p>

          {/* CTA row */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-none px-8 font-semibold uppercase tracking-wide text-sm"
            >
              <Link href="/products">Order Now</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-none px-8 font-semibold uppercase tracking-wide text-sm border-foreground/25 hover:border-primary hover:text-primary"
            >
              <Link href="/products">View Products</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* ── Right: Equipment illustration ── */}
        <div className="w-full md:w-[54%] relative flex items-center justify-center min-h-[380px] md:min-h-0 overflow-hidden">
          {/* Background blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.05] blur-3xl" />
            <div className="absolute bottom-0 right-10 w-[400px] h-[400px] rounded-full bg-primary/[0.07] blur-3xl" />
          </div>

          {/* EXIT sign + Fire extinguisher */}
          <div className="relative z-10 flex items-end gap-6 translate-x-[4%]">
            {/* EXIT sign */}
            <motion.div
              initial={{ opacity: 0, x: -24, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.7 }}
              style={{
                width: "clamp(100px, 12vw, 170px)",
                transform: "rotate(-8deg)",
                flexShrink: 0,
                marginBottom: "clamp(60px, 8vw, 110px)",
              }}
            >
              <Image
                src="/images/green-exit.png"
                alt="Exit Sign"
                width={440}
                height={180}
                className="w-full h-auto drop-shadow-md"
              />
            </motion.div>

            {/* Fire extinguisher */}
            <motion.div
              initial={{ opacity: 0, scale: 0.82, rotate: 25 }}
              animate={{ opacity: 1, scale: 1, rotate: 14 }}
              transition={{ duration: 0.9, ease: [0.34, 1.18, 0.64, 1], delay: 0.25 }}
              className="drop-shadow-2xl"
              style={{
                width: "clamp(260px, 32vw, 480px)",
                transformOrigin: "center 80%",
              }}
            >
              <Image
                src="/images/fire-extinguisher.png"
                alt="Fire Extinguisher"
                width={720}
                height={1080}
                priority
                className="w-full h-auto object-contain"
              />
            </motion.div>
          </div>

          {/* Smoke alarm accent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "backOut", delay: 1.0 }}
            className="absolute z-20"
            style={{
              width: "clamp(56px, 6vw, 90px)",
              top: "22%",
              right: "8%",
              transform: "rotate(5deg)",
            }}
          >
            <SmokeAlarmSVG />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
