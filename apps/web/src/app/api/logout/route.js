// ログアウト処理(仮)
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'ログアウトしました' });

  // クッキー削除
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0),
  });

  return response;
}

