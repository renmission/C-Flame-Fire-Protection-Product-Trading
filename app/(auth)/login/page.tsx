"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered") === "1";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl">Welcome back!</CardTitle>
        <CardDescription className="text-sm">
          {callbackUrl === "/products"
            ? "Sign in to place your product order"
            : "Sign in to the internal management platform"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {registered && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-900 p-3 text-sm text-green-700 dark:text-green-400">
            Account created successfully! Please sign in.
          </div>
        )}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="min-h-11 touch-manipulation sm:min-h-0"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="min-h-11 touch-manipulation sm:min-h-0"
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/15 border border-destructive/50 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full min-h-11 touch-manipulation sm:min-h-0"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
          {callbackUrl === "/products" && (
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                Register
              </Link>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/20 p-4 sm:p-6">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="C'FLAME Fire Protection Product Trading Logo"
            width={250}
            height={60}
            priority
            className="h-auto w-auto max-w-full"
          />
        </Link>
        <Suspense fallback={<div className="w-full shadow-lg rounded-lg bg-card p-6 animate-pulse h-64" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
