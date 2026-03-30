import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { auth: session, nextUrl } = req;
  const isProtected =
    nextUrl.pathname.startsWith("/scan") ||
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/billing");

  if (isProtected && !session) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/scan",
    "/scan/(.*)",
    "/dashboard",
    "/dashboard/(.*)",
    "/billing",
    "/billing/(.*)",
  ],
};
