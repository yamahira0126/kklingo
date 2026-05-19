import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080';
const API_KEY = process.env.GO_API_KEY || 'local-dev-api-key';
// ★ Next.jsサーバー自身のURL
const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';


export async function GET() {
    try {
        const cookieStore = await cookies();
        const authTokenCookie = cookieStore.get('auth-token');

        // ★ 1. まずは自分自身の /api/me を呼び出してユーザー情報を取得
        const meResponse = await fetch(`${NEXT_PUBLIC_URL}/api/me`, {
            headers: {
                // ブラウザから受け取ったクッキーをそのまま転送
                Cookie: authTokenCookie ? `${authTokenCookie.name}=${authTokenCookie.value}` : '',
            },
        });

        if (!meResponse.ok) {
            return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
        }
        
        const { user } = await meResponse.json();

        // ★ 2. 取得したユーザーのロールを判定
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
        }

        // ★ 3. 管理者であれば、Go APIに全ユーザー一覧をリクエスト
        const apiRes = await fetch(`${GO_API_URL}/users`, {
            headers: {
                'X-API-Key': API_KEY,
            },
        });

        if (!apiRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch users from Go API' }, { status: apiRes.status });
        }

        const users = await apiRes.json();
        return NextResponse.json({ users: users });

    } catch (error) {
        console.error('Error in GET /api/users:', error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}
