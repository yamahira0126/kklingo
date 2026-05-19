# LLM API

PDFから復習問題を生成するGo APIです。base64化されたPDFを受け取り、Gemini APIに送信して、問題・ヒント・答え・解説・タグをJSONで返します。

## 役割

- Web BFFからPDFデータを受け取る。
- Gemini APIに問題生成を依頼する。
- Geminiの応答をアプリで扱いやすいJSONに整える。
- LLMに関する処理をDB APIから分離する。

LLM APIはPostgreSQLに接続しません。生成した問題の保存はDB APIが担当します。

## 環境変数

```env
PORT=8001
GO_API_KEY=local-dev-api-key
GEMINI_API_KEY=replace-with-your-gemini-api-key
```

`local-dev-api-key` は開発用サンプルです。`GEMINI_API_KEY` には実際のキーを `.env` で設定してください。

## 起動方法

```bash
cp .env.example .env
go run .
```

デフォルトでは `http://localhost:8001` で起動します。

## 主なエンドポイント

| Method | Path | 説明 |
| --- | --- | --- |
| POST | `/generate/questions` | PDFから復習問題を生成 |

リクエスト例:

```json
{
  "pdf_base64": "JVBERi0x..."
}
```

レスポンス例:

```json
{
  "question": "問題文",
  "hint": "ヒント",
  "answer": "答え",
  "description": "解説",
  "tags": ["大学", "情報", "記述問題", "基礎"]
}
```

通常リクエストでは `X-API-Key` が必要です。
