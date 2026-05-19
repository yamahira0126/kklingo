// app/api/search-questions/route.js

import { NextResponse } from 'next/server';

const DB_API_URL = process.env.GO_API_URL;
const API_KEY = process.env.GO_API_KEY;

export async function GET(req) {
    const { searchParams } = new URL(req.url); // Next.js 13+ App Routerでのクエリパラメータ取得
    const keyword = searchParams.get('keyword');
    const tag = searchParams.get('tag');
    const showHidden = searchParams.get('show_hidden'); // 'true' or 'false'

    let queryUrl = `${DB_API_URL}/questions?`;
    const params = [];

    if (keyword) {
        params.push(`keyword=${encodeURIComponent(keyword)}`);
    }
    if (tag) {
        params.push(`tag=${encodeURIComponent(tag)}`);
    }
    if (showHidden) {
        params.push(`show_hidden=${encodeURIComponent(showHidden)}`);
    }

    queryUrl += params.join('&');
    console.log("Fetching questions from Go API:", queryUrl);

    try {
        const apiRes = await fetch(queryUrl, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY,
            },
        });

        const data = await apiRes.json();
        return NextResponse.json(data, { status: apiRes.status });

    } catch (error) {
        console.error("Error searching questions via BFF:", error);
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