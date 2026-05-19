# セキュリティメモ

このリポジトリでは、公開時に秘密情報を含めないことを前提にしています。`.env.example` にはサンプル値のみを置き、実際のAPIキーや接続先は `.env` / `.env.local` で管理します。

## 環境変数

| 変数 | 用途 |
| --- | --- |
| `GO_API_URL` | DB APIのURL |
| `GEMINI_API_URL` | LLM APIのURL |
| `GO_API_KEY` | BFFからGo APIへ送る内部APIキー |
| `GEMINI_API_KEY` | Gemini APIのキー |
| `DATABASE_URL` | PostgreSQL接続文字列 |

`local-dev-api-key` は開発用のサンプル値です。公開環境では推測されにくい値に変更し、Secret Managerやホスティング環境のSecret機能で管理します。

## 秘密情報の扱い

- `.env` と `.env.local` はGitにコミットしない。
- READMEやdocsには実際のAPIキー、固定IP、DBパスワードを書かない。
- `.env.example` にはサンプル値だけを書く。
- CIでは本物のSecretを使わず、ビルドに必要なダミー値のみを使う。

## 現在の制約

- Go APIのCORSは開発しやすさを優先して広めに許可しています。
- Web側のCookieは簡易的なセッション表現です。
- APIキー認証はサービス間の簡易認証として使っています。
- DBマイグレーションと権限設計はまだ最小構成です。

## 改善方針

- CORSの許可オリジンを環境変数で制御する。
- Cookieに署名付きセッション、またはJWT検証を導入する。
- APIキーをSecret Managerで管理し、定期的にローテーションする。
- CIに依存関係スキャンとシークレットスキャンを追加する。
- DBユーザーの権限を最小化し、本番用と開発用を分ける。
