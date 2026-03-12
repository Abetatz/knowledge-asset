# Railway へのデプロイメント

## 前提条件

- GitHub アカウント
- Railway アカウント（GitHub で連携済み）
- GitHub Personal Access Token

## デプロイメント手順

### 1. GitHub リポジトリの作成

```bash
# GitHub CLI を使用してリポジトリを作成
gh repo create knowledge-asset --public --source=. --remote=origin --push

# または、GitHub Web UI から手動で作成
# https://github.com/new
```

### 2. GitHub にコードをプッシュ

```bash
git init
git add .
git commit -m "Initial commit: Knowledge Asset Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/knowledge-asset.git
git push -u origin main
```

### 3. Railway プロジェクトの作成

1. [Railway Dashboard](https://railway.app/dashboard) にアクセス
2. 「New Project」をクリック
3. 「Deploy from GitHub repo」を選択
4. `knowledge-asset` リポジトリを選択
5. デプロイを開始

### 4. 環境変数の設定

Railway ダッシュボードで以下の環境変数を設定：

```
NODE_ENV=production
DATABASE_URL=postgresql://... (Railway が自動生成)
JWT_SECRET=your-production-secret-key
VITE_API_URL=https://your-railway-app.up.railway.app

# Google Drive API (オプション)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=https://your-railway-app.up.railway.app/api/google/callback
```

### 5. PostgreSQL データベースの追加

1. Railway ダッシュボードで「New」をクリック
2. 「Database」を選択
3. 「PostgreSQL」を選択
4. 新しいプロジェクトに追加

### 6. デプロイの確認

```bash
# Railway CLI でログを確認
railway logs

# または、Railway ダッシュボードでログを確認
```

## 自動デプロイメント

GitHub にプッシュすると、自動的に Railway にデプロイされます。

```bash
# 変更をコミットしてプッシュ
git add .
git commit -m "Update feature"
git push origin main

# Railway が自動的にビルドしてデプロイ
```

## トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルドをテスト
pnpm run build

# エラーメッセージを確認
railway logs
```

### データベース接続エラー

```bash
# DATABASE_URL が正しく設定されているか確認
railway env

# PostgreSQL が起動しているか確認
railway logs -s postgres
```

### フロントエンドが読み込まれない

```bash
# VITE_API_URL が正しく設定されているか確認
# ブラウザの開発者ツールでネットワークエラーを確認
```

## 本番環境でのベストプラクティス

1. **環境変数の管理**
   - 本番環境では強力なシークレットキーを使用
   - 機密情報は環境変数で管理

2. **ログの監視**
   - Railway ダッシュボードでログを定期的に確認
   - エラーが発生した場合は即座に対応

3. **バックアップ**
   - PostgreSQL のバックアップを定期的に実施
   - Google Drive へのバックアップを有効化

4. **セキュリティ**
   - HTTPS を使用（Railway が自動的に設定）
   - JWT シークレットを定期的に更新
   - 定期的なセキュリティアップデート

## ドメイン設定

カスタムドメインを使用する場合：

1. Railway ダッシュボードで「Settings」をクリック
2. 「Custom Domain」を選択
3. ドメイン名を入力
4. DNS 設定を完了

## 監視とメンテナンス

- Railway ダッシュボードで CPU、メモリ使用率を監視
- ログを定期的に確認
- 定期的なバックアップを実施
- セキュリティアップデートを適用

## サポート

- [Railway ドキュメント](https://docs.railway.app/)
- [Railway サポート](https://railway.app/support)
