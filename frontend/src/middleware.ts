import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Skip middleware for specific paths
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }
  
  // Public paths that don't require authentication
  const publicPaths = ['/', '/verify'];
  const isPublicPath = publicPaths.some(path => url.pathname === path || url.pathname.startsWith(path));
  
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // All other routes can be accessed (client-side will handle auth)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


