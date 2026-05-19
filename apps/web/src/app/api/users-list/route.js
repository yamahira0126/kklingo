// app/api/users-list/route.js

import { NextResponse } from 'next/server';

const DB_API_URL = process.env.GO_API_URL || 'http://localhost:8080';
const API_KEY = process.env.GO_API_KEY || 'local-dev-api-key';

export async function GET() {
    try {
        const apiRes = await fetch(`${DB_API_URL}/users`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY,
            },
        });

        const data = await apiRes.json();
        return NextResponse.json(data, { status: apiRes.status });

    } catch (error) {
        console.error("Error fetching users via BFF:", error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}

// OPTIONS メソッドのハンドラ (CORS プリフライトリクエスト対応)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        },
    });
}
