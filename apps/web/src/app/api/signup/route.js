// /api/register/route.js など
import { NextResponse } from 'next/server';

// Go APIサーバーのURLとAPIキーを環境変数から読み込む
const GO_API_URL = process.env.GO_API_URL;
const API_KEY = process.env.GO_API_KEY;


export async function POST(req) {
    try {
        // 1. ブラウザから登録情報を受け取る
        const { name, password, icon } = await req.json();

        // 2. GoのAPIサーバーにユーザー作成リクエストを送信
        const apiRes = await fetch(`${GO_API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // ★ BFFが安全にAPIキーを付与する
                'X-API-Key': API_KEY,
            },
            body: JSON.stringify({
                user_name: name,
                password: password,
                role: 'user', // roleはここで固定
                icon: icon,
            }),
        });

        // 3. Go APIからの応答をチェック (ユーザー名重複エラーなど)
        if (!apiRes.ok) {
            const errorData = await apiRes.json();
            return NextResponse.json(
                { error: errorData.error || 'ユーザー登録に失敗しました' },
                { status: apiRes.status }
            );
        }

        // 4. 登録成功後、Go APIから返された新しいユーザー情報を取得
        const createdUser = await apiRes.json();

        // 5. 登録後そのままログインさせるため、クッキーを設定
        const token = `login-token-${createdUser.id}`;

        const res = NextResponse.json({
            message: '登録・ログイン成功',
            user: createdUser,
        });

        res.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 3, // 3日間
            path: '/',
        });

        return res;

    } catch (error) {
        console.error('Register API error:', error);
        return NextResponse.json(
            { error: 'サーバー内部でエラーが発生しました' },
            { status: 500 }
        );
    }
}