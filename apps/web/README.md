# Web App

KK Lingo のNext.jsアプリです。ユーザー画面と、Go APIへの中継を担当するBFFを持っています。

## 役割

- PDFアップロードと問題生成フロー
- ログイン、サインアップ、マイページ、検索、解答、編集、管理画面
- DB API / LLM APIへのサーバーサイド中継
- ブラウザに内部APIキーを露出しないためのBFF

## アーキテクチャ上の位置づけ

ブラウザはこのNext.jsアプリの `/api/*` を呼び出します。Next.js API Routesはサーバー側で `X-API-Key` を付与し、以下のGoサービスへリクエストを転送します。

- `services/db-api`: ユーザー、ログイン、問題、検索、公開/非公開管理
- `services/llm-api`: PDFからの問題生成

## 環境変数

```env
GO_API_URL=http://localhost:8080
GEMINI_API_URL=http://localhost:8001
GO_API_KEY=local-dev-api-key
NEXT_PUBLIC_URL=http://localhost:3000
```

`local-dev-api-key` は開発用サンプルです。公開環境では必ず別の値に変更してください。

## 起動方法

```bash
npm install
npm run dev
```

`http://localhost:3000` で起動します。

## コマンド

```bash
npm run dev
npm run build
```

## メモ

一部に開発用のサンプルデータモジュールが残っています。アプリの基本方針としては、Go製DB APIをデータの正とし、Next.js API RoutesはBFFとして扱います。
