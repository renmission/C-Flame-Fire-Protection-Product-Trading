import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HeroSection } from "@/components/landing/hero-section";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return <HeroSection />;
}
