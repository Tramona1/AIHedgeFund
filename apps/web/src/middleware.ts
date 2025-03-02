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
    // Handle routing based on authentication
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/login', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
    
    // Create a new response object to ensure headers are handled properly
    const response = NextResponse.next();
    
    // If you need to set headers, do it like this
    // response.headers.set('x-custom-header', 'value');
    
    return response;
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