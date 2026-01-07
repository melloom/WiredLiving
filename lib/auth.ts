import { cookies } from 'next/headers';

export function isAuthenticated(): boolean {
  const session = cookies().get('admin_session');
  return !!session;
}

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/check`, {
      cache: 'no-store',
    });
    const data = await response.json();
    return data.authenticated || false;
  } catch {
    return false;
  }
}

