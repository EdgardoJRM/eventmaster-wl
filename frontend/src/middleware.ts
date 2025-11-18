import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Permitir acceso a páginas públicas
  const publicPaths = ['/login', '/', '/[tenantSlug]/evento'];
  const isPublicPath = publicPaths.some((path) => {
    if (path.includes('[')) {
      // Dynamic route
      return request.nextUrl.pathname.startsWith('/') && 
             !request.nextUrl.pathname.startsWith('/dashboard') &&
             !request.nextUrl.pathname.startsWith('/events') &&
             !request.nextUrl.pathname.startsWith('/settings');
    }
    return request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path);
  });

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Para rutas protegidas, el cliente manejará la autenticación
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


