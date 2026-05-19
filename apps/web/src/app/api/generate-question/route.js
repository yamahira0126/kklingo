import { NextResponse } from 'next/server';

const GEMINI_API_URL = process.env.GEMINI_API_URL;
const API_KEY = process.env.GO_API_KEY;

export async function POST(req) {
    try {
        const body = await req.json();

        const apiRes = await fetch(`${GEMINI_API_URL}/generate/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
            },
            body: JSON.stringify(body),
        });

        const data = await apiRes.json();
        return NextResponse.json(data, { status: apiRes.status });

    } catch (error) {
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}