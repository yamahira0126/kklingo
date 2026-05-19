// /api/me/route.js (修正版)
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Go APIサーバーのURLとAPIキーを環境変数から読み込む
const apiURL = process.env.GO_API_URL;
const API_KEY = process.env.GO_API_KEY;

// --- GET: 現在のユーザー情報取得 ---
export async function GET() {
    try {
        // ★ 修正点: await を追加
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: '未ログイン' }, { status: 401 });
        }

        const matched = token.match(/^login-token-(.+)$/);
        const id = matched?.[1];
        if (!id) {
            return NextResponse.json({ error: '無効なトークン' }, { status: 401 });
        }

        const apiRes = await fetch(`${apiURL}/users/${id}`, {
            headers: {
                'X-API-Key': API_KEY,
            },
        });

        if (!apiRes.ok) {
            const errorData = await apiRes.json();
            return NextResponse.json({ error: errorData.error || 'ユーザー取得失敗' }, { status: apiRes.status });
        }

        const user = await apiRes.json();
        return NextResponse.json({ user: user });

    } catch (error) {
        console.error('GET /api/me error:', error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}

// --- PATCH: 現在のユーザー情報編集 ---
export async function PATCH(req) {
    try {
        // ★ 修正点: await を追加
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: '未ログイン' }, { status: 401 });
        }
        
        const matched = token.match(/^login-token-(.+)$/);
        const id = matched?.[1];
        if (!id) {
            return NextResponse.json({ error: '無効なトークン' }, { status: 401 });
        }

        const body = await req.json();

        const apiRes = await fetch(`${apiURL}/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
            },
            body: JSON.stringify(body),
        });

        if (!apiRes.ok) {
            const errorData = await apiRes.json();
            return NextResponse.json({ error: errorData.error || '更新失敗' }, { status: apiRes.status });
        }
        
        const updatedUser = await apiRes.json();
        return NextResponse.json({ message: '更新完了', user: updatedUser });

    } catch (error) {
        console.error('PATCH /api/me error:', error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}