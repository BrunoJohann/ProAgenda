import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  const isRoot = pathname === '/';

  // Se está na raiz, redirecionar baseado na autenticação
  if (isRoot) {
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Se não está autenticado e não está na página de login, redirecionar
  if (!accessToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se está autenticado e está na página de login, redirecionar para dashboard
  if (accessToken && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

