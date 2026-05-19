# DB API

ユーザー、ログイン、問題保存、検索、公開/非公開管理を担当するGo APIです。PostgreSQLへのアクセスはこのサービスに閉じ込めます。

## 役割

- `/auth/login` によるログイン
- `/users` と `/users/{id}` によるユーザー管理
- `/questions` と `/questions/{id}` による問題管理
- キーワード、タグ、作成者、公開状態による問題検索
- WebアプリからDBを直接触らせないためのAPI境界

DB APIはGeminiやプロンプト設計を知りません。生成された問題を保存・取得することに集中します。

## 環境変数

```env
PORT=8080
GO_API_KEY=local-dev-api-key
DATABASE_URL=host=localhost port=5432 dbname=kklingo sslmode=disable
```

`local-dev-api-key` と `DATABASE_URL` は開発用サンプルです。公開環境では接続ユーザー、パスワード、ホスト名を環境に合わせて設定してください。

## 起動方法

```bash
cp .env.example .env
go run .
```

デフォルトでは `http://localhost:8080` で起動します。

## 主なエンドポイント

| Method | Path | 説明 |
| --- | --- | --- |
| POST | `/auth/login` | ログイン |
| GET | `/users` | ユーザー一覧 |
| POST | `/users` | ユーザー作成 |
| GET | `/users/{id}` | ユーザー詳細 |
| PATCH | `/users/{id}` | ユーザー更新 |
| DELETE | `/users/{id}` | ユーザー削除 |
| GET | `/questions` | 問題一覧・検索 |
| POST | `/questions` | 問題作成 |
| GET | `/questions/{id}` | 問題詳細 |
| PATCH | `/questions/{id}` | 問題更新 |
| DELETE | `/questions/{id}` | 問題削除 |

`/auth/login` と `OPTIONS` 以外は `X-API-Key` が必要です。
