// app/api/my-questions/route.js

import { NextResponse } from 'next/server'; // Next.js の API レスポンスを扱うためにインポート

// 環境変数からGo APIのURLとAPIキーを読み込む
// .env.local ファイルで設定しておく必要があります
// 例:
// GO_API_URL=http://localhost:8080
// GO_API_KEY=local-dev-api-key
const DB_API_URL = process.env.GO_API_URL || 'http://localhost:8080';
const API_KEY = process.env.GO_API_KEY || 'local-dev-api-key';

/**
 * GET /api/my-questions のハンドラ関数
 * クエリパラメータとして author_id を受け取り、
 * その author_id に紐づく問題をGo APIから取得して返します。
 *
 * @param {Request} req - Next.js の Request オブジェクト
 * @returns {Response} - Next.js の Response オブジェクト
 */
export async function GET(req) {
    // リクエストURLからクエリパラメータを抽出
    // App Router では req.url から URL オブジェクトを構築して searchParams にアクセスします
    const { searchParams } = new URL(req.url);

    // 'author_id' クエリパラメータの値を取得
    const authorId = searchParams.get('author_id');

    // author_id が提供されていない場合、400 Bad Request エラーを返す
    if (!authorId) {
        console.error("GET /api/my-questions: 'author_id' query parameter is missing.");
        return NextResponse.json({ error: 'author_id is required' }, { status: 400 });
    }

    try {
        // Go APIの GET /questions エンドポイントを呼び出す
        // author_id をクエリパラメータとしてGo APIに渡し、
        // show_hidden=true も同時に渡すことで、自分の問題はis_visibleに関わらず全て取得する
        const apiRes = await fetch(`${DB_API_URL}/questions?author_id=${encodeURIComponent(authorId)}&show_hidden=true`, {
            method: 'GET', // HTTPメソッドはGET
            headers: {
                // Go APIの認証に必要なAPIキーをHTTPヘッダーに含める
                // このAPIキーはサーバーサイド（Next.js API Routes）でのみ使用され、クライアントサイドには露出しない
                'X-API-Key': API_KEY,
            },
            // GETリクエストなのでbodyは不要
        });

        // Go APIからのレスポンスボディをJSONとしてパース
        const data = await apiRes.json();

        // Go APIからのステータスコードをそのままクライアントに返す
        // 例えば、Go APIが404を返せば、クライアントにも404が返る
        return NextResponse.json(data, { status: apiRes.status });

    } catch (error) {
        // API呼び出し中にエラーが発生した場合のハンドリング
        console.error(`Error fetching questions for author_id ${authorId} via BFF:`, error);
        // サーバー内部エラーとして500ステータスコードを返す
        return NextResponse.json({ error: 'サーバー内部エラー' }, { status: 500 });
    }
}

/**
 * OPTIONS /api/my-questions のハンドラ関数 (CORS プリフライトリクエスト対応)
 * クライアントサイドからの複雑なHTTPリクエスト (POST, PATCH, DELETEなど) の前に、
 * ブラウザが自動的に送信するOPTIONSリクエストに応答するために必要です。
 *
 * @returns {Response} - Next.js の Response オブジェクト
 */
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204, // 204 No Content を返すのが一般的
        headers: {
            'Access-Control-Allow-Origin': '*', // 全てのオリジンからのアクセスを許可 (本番環境では特定のオリジンに制限すべき)
            'Access-Control-Allow-Methods': 'GET, OPTIONS', // 許可するHTTPメソッド
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key', // 許可するHTTPヘッダー (X-API-Keyはここで明示する必要があることが多い)
        },
    });
}
