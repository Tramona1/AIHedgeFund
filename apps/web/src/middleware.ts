import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  publicRoutes: [
    "/", 
    "/login", 
    "/signup", 
    "/about",
    "/api/economic-reports/recent",
    "/api/interviews/recent",
    "/api/users/:userId/preferences",
    // Allow all static assets
    "/_next/static/(.*)",
    "/favicon.ico",
    "/images/(.*)",
  ],
  async afterAuth(auth, req, evt) {
    // Get the pathname of the request
    const path = req.nextUrl.pathname;
    
    // If the user is logged in and trying to access the home page, 
    // redirect them to the dashboard
    if (auth.userId && path === "/") {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    // If the user is logged in and trying to access login or signup pages,
    // redirect them to the dashboard
    if (auth.userId && (path === "/login" || path === "/signup")) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    // If the user is not logged in and trying to access a protected route,
    // redirect them to the login page
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/login', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
    
    // For all other cases, proceed normally
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip all static files except JS/CSS chunks and API routes
    '/((?!_next/image|_next/static|_vercel|favicon.ico).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 