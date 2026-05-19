// app/api/questions/[id]/route.js (修正版)

import { NextResponse } from 'next/server';

const DB_API_URL = process.env.GO_API_URL || 'http://localhost:8080';
const API_KEY = process.env.GO_API_KEY || 'local-dev-api-key';

// GET /api/questions/{id} のハンドラ
export async function GET(req, { params }) {
    const { id } = params; // URLパスから問題IDを取得
    try {
        const apiRes = await fetch(`${DB_API_URL}/questions/${id}`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY, // サーバーサイドでAPIキーを付与
            },
        });

        if (!apiRes.ok) {
            // Go APIが404 Not Foundなどを返す場合を考慮
            const errorData = await apiRes.json();
            return NextResponse.json({ error: errorData.error || '問題の取得に失敗しました' }, { status: apiRes.status });
        }

        const data = await apiRes.json();
        return NextResponse.json(data, { status: apiRes.status });

    } catch (error) {
        console.error(`Error fetching question ${id} via BFF:`, error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}

// PATCH /api/questions/{id} のハンドラ (既存のものをそのまま)
export async function PATCH(req, { params }) {
    const { id } = params; // URLパスからIDを取得
    try {
        const requestBody = await req.json();

        const apiRes = await fetch(`${DB_API_URL}/questions/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY, // サーバーサイドでAPIキーを付与
            },
            body: JSON.stringify(requestBody),
        });

        const data = await apiRes.json();
        return NextResponse.json(data, { status: apiRes.status });

    } catch (error) {
        console.error(`Error updating question ${id} via BFF:`, error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}

// DELETE /api/questions/{id} のハンドラ (既存のものをそのまま)
export async function DELETE(req, { params }) {
    const { id } = params; // URLパスからIDを取得
    try {
        const apiRes = await fetch(`${DB_API_URL}/questions/${id}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': API_KEY, // サーバーサイドでAPIキーを付与
            },
        });

        if (apiRes.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await apiRes.json();
        return NextResponse.json(data, { status: apiRes.status });

    } catch (error) {
        console.error(`Error deleting question ${id} via BFF:`, error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}

// OPTIONS メソッドのハンドラ (CORS プリフライトリクエスト対応)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204, // 204 No Content を返すのが一般的
        headers: {
            'Access-Control-Allow-Origin': '*', // フロントエンドのオリジンに合わせて調整
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        },
    });
}
