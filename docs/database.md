# データベース設計メモ

DB APIはPostgreSQLを前提にしています。現在の実装では、主に `users` と `questions` の2テーブルを想定しています。

## users

| カラム | 用途 |
| --- | --- |
| `id` | ユーザーID |
| `user_name` | ログイン名・表示名 |
| `password` | bcryptでハッシュ化したパスワード |
| `role` | `user` / `admin` などのロール |
| `icon` | 選択したユーザーアイコン |

## questions

| カラム | 用途 |
| --- | --- |
| `id` | 問題ID |
| `created_at` | 作成日時 |
| `author_id` | 作成者ユーザーID |
| `question` | 問題文 |
| `hint` | 任意のヒント |
| `answer` | 答え |
| `explanation` | 解説 |
| `tags` | カンマ区切りのタグ |
| `author_note` | 作成者用メモ |
| `rating` | 平均評価 |
| `rated_count` | 評価数 |
| `is_visible` | 検索結果などに公開するかどうか |

## 現状と改善余地

- `is_visible` により、生成した問題を非公開にできます。
- 検索は現在、複数のテキストカラムに対する `LIKE` 検索です。
- タグはシンプルに文字列で保持しています。
- 今後はDBマイグレーション、インデックス、タグ正規化、初期データ投入を整備する予定です。
