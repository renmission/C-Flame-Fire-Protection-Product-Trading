import { auth } from "@/lib/auth";
import { ROLES } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/permissions";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRoles = (req.auth?.user as SessionUser)?.roles ?? [];
  const isCustomer = userRoles.includes(ROLES.CUSTOMER);

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isDashboard = pathname.startsWith("/dashboard");
  const isProducts = pathname.startsWith("/products");

  if (isApiAuth) return;

  if (isAuthRoute && isLoggedIn) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    if (isCustomer) {
      const target = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/products";
      return Response.redirect(new URL(target, req.url));
    }
    const target = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
    return Response.redirect(new URL(target, req.url));
  }

  if (isDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }

  if (isDashboard && isLoggedIn && isCustomer) {
    return Response.redirect(new URL("/products", req.url));
  }

  if (isProducts && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", "/products");
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
