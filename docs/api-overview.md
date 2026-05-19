# API概要

このドキュメントでは、内部サービスとして用意しているGo APIと、WebアプリのBFFルートをまとめます。ブラウザからはGo APIを直接呼ばず、Next.js API Routesを経由します。

## DB API

ローカル開発時のBase URL: `http://localhost:8080`

`/auth/login` と `OPTIONS` 以外のエンドポイントでは `X-API-Key` が必要です。

| Method | Path | 説明 |
| --- | --- | --- |
| POST | `/auth/login` | ユーザーログイン |
| GET | `/users` | ユーザー一覧取得 |
| POST | `/users` | ユーザー作成 |
| GET | `/users/{id}` | ユーザー詳細取得 |
| PATCH | `/users/{id}` | ユーザー更新 |
| DELETE | `/users/{id}` | ユーザー削除 |
| GET | `/questions` | 問題一覧・検索 |
| POST | `/questions` | 問題作成 |
| GET | `/questions/{id}` | 問題詳細取得 |
| PATCH | `/questions/{id}` | 問題更新 |
| DELETE | `/questions/{id}` | 問題削除 |

### 問題検索のクエリ

| Query | 説明 |
| --- | --- |
| `keyword` | 問題文、答え、ヒント、解説、タグ、作成者メモを検索 |
| `tag` | タグ文字列で絞り込み |
| `author_id` | 作成者で絞り込み |
| `show_hidden` | `true` の場合は非公開問題も含める |

### 問題作成リクエスト例

```json
{
  "author_id": 1,
  "question": "HTTPメソッドのGETとPOSTの違いを説明してください。",
  "hint": "取得と作成・送信の用途に注目します。",
  "answer": "GETは主にリソース取得、POSTは主にデータ送信や作成に使われます。",
  "explanation": "GETはURLにクエリを含めることが多く、POSTはリクエストボディにデータを含めます。",
  "tags": "大学,情報,記述問題,基礎",
  "author_note": "",
  "is_visible": true
}
```

## LLM API

ローカル開発時のBase URL: `http://localhost:8001`

すべての通常リクエストで `X-API-Key` が必要です。

| Method | Path | 説明 |
| --- | --- | --- |
| POST | `/generate/questions` | PDFから復習問題を生成 |

### リクエスト例

```json
{
  "pdf_base64": "JVBERi0x..."
}
```

### レスポンス例

```json
{
  "question": "問題文",
  "hint": "ヒント",
  "answer": "答え",
  "description": "解説",
  "tags": ["大学", "情報", "記述問題", "基礎"]
}
```

## Web BFF Routes

Next.jsアプリはAPI RoutesをBFFとして使います。

| Route | 役割 |
| --- | --- |
| `/api/generate-question` | LLM APIを呼び出して問題を生成する |
| `/api/save-question` | 生成結果をDB API向けに変換して保存する |
| `/api/search-questions` | DB APIの問題検索を中継する |
| `/api/questions/[id]` | 問題の取得・更新・削除を中継する |
| `/api/login` | DB APIのログインを呼び出し、Cookieを設定する |
| `/api/me` | Cookieから現在のユーザーを判定する |
