// app/api/users/[id]/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // isAdminRequest で使用
// API_KEY の名前が GO_API_KEY であることを確認
const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080';
const API_KEY = process.env.GO_API_KEY || 'local-dev-api-key'; // 環境変数名をGO_API_KEYに統一

// 権限チェック用のヘルパー関数 (isAdminRequest はこのファイル内で定義されるべき)
async function isAdminRequest() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
        return false;
    }

    const matched = token.match(/^login-token-(.+)$/);
    const userId = matched?.[1];

    if (!userId) {
        return false;
    }

    try {
        const userRes = await fetch(`${GO_API_URL}/users/${userId}`, {
            headers: {
                'X-API-Key': API_KEY,
            },
        });

        if (!userRes.ok) {
            console.error(`isAdminCheck: Failed to fetch user ${userId} from Go API. Status: ${userRes.status}`);
            return false;
        }

        const user = await userRes.json();
        return user.role === 'admin';

    } catch (error) {
        console.error(`isAdminCheck: Error fetching user role for ID ${userId}:`, error);
        return false;
    }
}


// --- GET: 特定のユーザー情報取得 ---
export async function GET(req, { params }) {
    const { id } = params; // URLパスからユーザーIDを取得
    try {
        const apiRes = await fetch(`${GO_API_URL}/users/${id}`, {
            method: 'GET', // GET メソッド
            headers: {
                'X-API-Key': API_KEY, // サーバーサイドでAPIキーを付与
            },
        });

        if (!apiRes.ok) {
            const errorData = await apiRes.json();
            return NextResponse.json({ error: errorData.error || 'ユーザー情報の取得に失敗しました' }, { status: apiRes.status });
        }

        const data = await apiRes.json();
        return NextResponse.json(data, { status: apiRes.status });

    } catch (error) {
        console.error(`Error fetching user ${id} via BFF:`, error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}


// --- PATCH: ユーザー情報更新 ---
export async function PATCH(req, { params }) {
    if (!await isAdminRequest()) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    try {
        const apiRes = await fetch(`${GO_API_URL}/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
            },
            body: JSON.stringify(body),
        });

        if (!apiRes.ok) {
            const errorData = await apiRes.json();
            return NextResponse.json({ error: errorData.error || 'ユーザーの更新に失敗しました' }, { status: apiRes.status });
        }

        const data = await apiRes.json();
        return NextResponse.json(data, { status: apiRes.status });

    } catch (error) {
        console.error('PATCH /api/users/[id] error:', error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}


// --- DELETE: ユーザー削除 ---
export async function DELETE(req, { params }) {
    if (!await isAdminRequest()) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const { id } = params;

    try {
        const apiRes = await fetch(`${GO_API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': API_KEY,
            },
        });

        if (apiRes.status === 204) {
             return new NextResponse(null, { status: 204 });
        }
        
        if (!apiRes.ok) {
            const errorData = await apiRes.json();
            return NextResponse.json({ error: errorData.error || 'ユーザーの削除に失敗しました' }, { status: apiRes.status });
        }

    } catch (error) {
        console.error('DELETE /api/users/[id] error:', error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}


// --- OPTIONS: CORS プリフライトリクエスト対応 ---
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        },
    });
}
