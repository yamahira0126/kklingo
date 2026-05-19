// ユーザーネームの重複チェック(仮)

import { NextResponse } from 'next/server';

// ★仮のユーザーリスト（本来はDBから取得）
const USERS = [
  { user_name: 'TestUser' },
  { user_name: 'AdminUser' },
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  const exists = USERS.some(u => u.user_name === name);
  return NextResponse.json({ exists });
}