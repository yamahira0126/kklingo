// /pages/api/login.js など (BFFのエンドポイント)
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        // 1. ブラウザからユーザー名とパスワードを受け取る
        const { name, password } = await req.json();
        const apiURL = process.env.GO_API_URL;
        const apiKey = process.env.GO_API_KEY;

        // 2. GoのAPIサーバーにリクエストを送信
        const apiRes = await fetch(`${apiURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // ★要件定義書で定めたAPIキーをここで付与する
                'X-API-Key': apiKey,
            },
            body: JSON.stringify({
                user_name: name, // Go APIの仕様に合わせてキー名を変更
                password: password,
            }),
        });

        // 3. GoのAPIサーバーからの応答をチェック
        if (!apiRes.ok) {
            // ログイン失敗時 (401など)
            const errorData = await apiRes.json();
            return NextResponse.json(
                { error: errorData.error || '認証に失敗しました' },
                { status: apiRes.status }
            );
        }

        // 4. 認証成功後、Go APIから返されたユーザー情報を取得
        const authenticatedUser = await apiRes.json();

        // 5. ブラウザに対するレスポンスとクッキーを作成
        const token = `login-token-${authenticatedUser.id}`;

        const res = NextResponse.json({
            message: 'ログイン成功',
            user: authenticatedUser,
        });

        res.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 1, // 24時間
            path: '/',
        });

        return res;

    } catch (error) {
        console.error('Login API error:', error);
        return NextResponse.json(
            { error: 'サーバー内部でエラーが発生しました' },
            { status: 500 }
        );
    }
}