# インフラ構成メモ

現時点ではインフラ構成は実装していません。このディレクトリでは、現在のmonorepo構成を将来どのように配置できるかをメモとして残しています。

## 将来の配置案

- Web: Vercel、AWS Amplify、またはS3 + CloudFront
- DB API: AWS App Runner、ECS Fargate、またはLambda container image
- LLM API: AWS App Runner、ECS Fargate
- Database: Amazon RDS for PostgreSQL
- Secrets: AWS Secrets Manager または SSM Parameter Store
- Logs: CloudWatch Logs
- CI/CD: GitHub Actions

## デプロイ境界

現在の構成は、各サービスを独立して配置しやすい形にしています。

- `apps/web` はユーザー向けフロントエンドとして配置する。
- `services/db-api` はPostgreSQLに近い場所へ配置する。
- `services/llm-api` は問題生成の負荷に応じて別途スケールできるようにする。

本番運用に進める場合は、ネットワーク、IAM、シークレット管理、DBマイグレーション、ログ監視を追加します。
