# 判断資産（ナレッジ）管理システム - 開発ガイド

## セットアップ手順

### 1. 環境変数の設定

`.env` ファイルを作成し、以下の内容を設定してください：

```bash
# Backend configuration
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/knowledge_asset
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend configuration
VITE_API_URL=http://localhost:5000

# Google Drive API (オプション)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:5000/api/google/callback
```

### 2. PostgreSQL のセットアップ

Docker Compose を使用してローカル PostgreSQL をセットアップ：

```bash
docker-compose up -d
```

### 3. 依存関係のインストール

```bash
pnpm install
```

### 4. 開発サーバーの起動

ターミナルを 2 つ開いて、以下のコマンドを実行：

**ターミナル 1 - フロントエンド開発サーバー:**
```bash
pnpm run dev
```

**ターミナル 2 - バックエンド開発サーバー:**
```bash
# TypeScript コンパイル（ウォッチモード）
npx tsc --watch

# 別のターミナルでバックエンドを実行
node dist/server/index.js
```

または、Node.js で直接実行：

```bash
npx tsx server/index.ts
```

### 5. アプリケーションへのアクセス

- **フロントエンド**: http://localhost:3000
- **バックエンド API**: http://localhost:5000

## API エンドポイント

### 認証

- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン

### エントリ管理

- `GET /api/entries` - すべてのエントリを取得
- `POST /api/entries` - 新しいエントリを作成
- `PUT /api/entries/:id` - エントリを更新
- `DELETE /api/entries/:id` - エントリを削除

### タグ管理

- `GET /api/tags` - すべてのタグを取得

### Google Drive

- `GET /api/google-drive/auth-url` - 認証 URL を取得
- `POST /api/google-drive/callback` - 認証コールバック
- `GET /api/google-drive/status` - 接続状態を確認
- `POST /api/google-drive/backup` - バックアップを実行
- `GET /api/google-drive/export-csv` - CSV をエクスポート

## テスト

### 基本的なテスト手順

1. **ユーザー登録とログイン**
   - ブラウザで http://localhost:3000 にアクセス
   - 「アカウント作成」をクリック
   - メールアドレスとパスワードを入力して登録

2. **エントリの作成**
   - ダッシュボードから「新規記録」をクリック
   - 必須項目を入力して保存

3. **Google Drive 連携**
   - ダッシュボードで「Google Drive に接続」をクリック
   - Google アカウントで認証
   - バックアップボタンをクリック

## ビルド

本番用ビルド：

```bash
pnpm run build
```

ビルド結果は `dist/` ディレクトリに出力されます。

## デプロイ

Railway へのデプロイについては、`DEPLOYMENT.md` を参照してください。

## トラブルシューティング

### PostgreSQL に接続できない

```bash
# PostgreSQL が起動しているか確認
docker-compose ps

# ログを確認
docker-compose logs postgres
```

### ポートが既に使用されている

```bash
# ポート 5432 を使用しているプロセスを確認
lsof -i :5432

# ポート 3000 を使用しているプロセスを確認
lsof -i :3000

# ポート 5000 を使用しているプロセスを確認
lsof -i :5000
```

### TypeScript エラー

```bash
# キャッシュをクリア
rm -rf dist/
rm -rf node_modules/.vite

# 再度ビルド
pnpm run build
```

## 開発のコツ

- ホットリロード機能を活用して、ファイル保存時に自動的に変更が反映されます
- ブラウザの開発者ツール（F12）でネットワークタブを確認して API 呼び出しをデバッグ
- `console.log` でデバッグ情報を出力
- バックエンドのログを確認して API エラーをトラッキング

## リソース

- [Express.js ドキュメント](https://expressjs.com/)
- [PostgreSQL ドキュメント](https://www.postgresql.org/docs/)
- [React ドキュメント](https://react.dev/)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/)
