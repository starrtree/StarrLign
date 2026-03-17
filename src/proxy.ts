import { NextRequest, NextResponse } from 'next/server';

function unauthorizedResponse() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="StarrLign"',
    },
  });
}

function decodeBasicAuthHeader(value) {
  const encoded = value.split(' ')[1];
  if (!encoded) {
    return null;
  }

  try {
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const username = process.env.APP_BASIC_AUTH_USERNAME;
  const password = process.env.APP_BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return NextResponse.next();
  }

  const authorization = request.headers.get('authorization');
  if (!authorization || !authorization.startsWith('Basic ')) {
    return unauthorizedResponse();
  }

  const credentials = decodeBasicAuthHeader(authorization);
  if (!credentials) {
    return unauthorizedResponse();
  }

  if (credentials.username !== username || credentials.password !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

