import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('fp_session')?.value;
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');

    if (!session && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session && isLoginPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (session) {
        try {
            const secretKey = process.env.JWT_SECRET || 'fieldpulse-super-secret-key-39281938';
            const key = new TextEncoder().encode(secretKey);
            await jwtVerify(session, key);
        } catch (err) {
            if (!isLoginPage) {
                // Force clear the invalid cookie by redirecting to login which will overwrite it eventually 
                // or we just redirect and let the user re-login
                const response = NextResponse.redirect(new URL('/login', request.url));
                response.cookies.delete('fp_session');
                return response;
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/time/:path*', '/mileage/:path*', '/fuel/:path*', '/notes/:path*', '/login', '/'],
};
