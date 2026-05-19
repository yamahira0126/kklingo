import { NextResponse } from 'next/server';

const DB_API_URL = process.env.GO_API_URL;
const API_KEY = process.env.GO_API_KEY;

export async function POST(req) {
    try {
        const questionData = await req.json();
        const tags = Array.isArray(questionData.tags)
            ? questionData.tags.join(',')
            : questionData.tags || '';

        // GeminiからのレスポンスをDB APIの形式に変換
        const payload = {
            author_id: questionData.author_id,
            question: questionData.question,
            hint: questionData.hint,
            answer: questionData.answer,
            explanation: questionData.explanation || questionData.description,
            tags,
            is_visible: true,
            author_note: questionData.author_note || "",
        };

        const apiRes = await fetch(`${DB_API_URL}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
            },
            body: JSON.stringify(payload),
        });

        const data = await apiRes.json();
        // Go APIからのステータスコードをそのまま返す
        return NextResponse.json(data, { status: apiRes.status });

    } catch (error) {
        console.error("Save question BFF error:", error);
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}
