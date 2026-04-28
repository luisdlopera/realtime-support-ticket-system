import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas de autenticación
  const isAuthPage = pathname === "/login" || pathname.startsWith("/login/");

  // Rutas protegidas
  const isProtectedPage = pathname.startsWith("/dashboard");

  // Verificar si hay sesión activa mediante la cookie de sesión
  // Esta cookie es seteada por el backend al hacer login
  const hasSession = request.cookies.get("auth_session")?.value === "1";

  // Si intenta acceder a una ruta protegida sin sesión, redirigir a login
  if (isProtectedPage && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    // Guardar la URL original para redirigir después del login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si está autenticado e intenta acceder al login, redirigir al dashboard
  if (isAuthPage && hasSession) {
    const redirectUrl = request.nextUrl.searchParams.get("redirect") || "/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
