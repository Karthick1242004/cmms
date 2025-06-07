import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple pass-through middleware that doesn't interfere with auth
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Only match API routes and page routes, not static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - static files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
} 