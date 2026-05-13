# ホテル在庫管理ツール

紙とスプレッドシートで行っているホテルの月次棚卸し業務をデジタル化し、転記ミスの削減と在庫状況の可視化を実現するモバイルファースト Web アプリです。

## 一発デプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNamiki-Personal-Orgnization%2F08_app-control&project-name=inventory-control&repository-name=08_app-control&env=SESSION_PASSWORD,STAFF_PASSWORD,ADMIN_PASSWORD,SUPABASE_STORAGE_BUCKET&envDescription=SESSION_PASSWORD%E3%81%AF32%E6%96%87%E5%AD%97%E4%BB%A5%E4%B8%8A%E3%81%AE%E3%83%A9%E3%83%B3%E3%83%80%E3%83%A0%E6%96%87%E5%AD%97%E5%88%97%E3%80%82STAFF%2FADMIN_PASSWORD%E3%81%AF%E5%85%B1%E6%9C%89%E3%83%91%E3%82%B9%E3%83%AF%E3%83%BC%E3%83%89%E3%80%82SUPABASE_STORAGE_BUCKET%E3%81%AF%E5%86%99%E7%9C%9F%E4%BF%9D%E5%AD%98%E5%85%88%E3%83%90%E3%82%B1%E3%83%83%E3%83%88%E5%90%8D%EF%BC%88inventory-photos%E6%8E%A8%E5%A5%A8%EF%BC%89&envLink=https%3A%2F%2Fgithub.com%2FNamiki-Personal-Orgnization%2F08_app-control%23%E5%BF%85%E8%A6%81%E3%81%AA%E7%92%B0%E5%A2%83%E5%A4%89%E6%95%B0)

### デプロイ手順（最短ルート）

#### 1. 上の「Deploy with Vercel」ボタンをクリック

- **Repository を clone**: 同意して進む（リポジトリが自分のアカウント配下に複製される）
- **環境変数**を入力:
  - `SESSION_PASSWORD`: 32文字以上のランダム文字列（`openssl rand -base64 32` で生成可）
  - `STAFF_PASSWORD`: 現場スタッフの共有パスワード
  - `ADMIN_PASSWORD`: 管理者用パスワード
  - `SUPABASE_STORAGE_BUCKET`: `inventory-photos`

「Deploy」を押す。**1回目は DB 未接続のままビルドが完走しデプロイ成功します**（DB スキーマ反映は再デプロイで実行）。

#### 2. Vercel から Supabase をワンクリック接続

Vercel プロジェクト画面 → **Storage** タブ → **Create Database** → **Supabase** を選択 → 「Continue」

- 既存 Supabase プロジェクトがあれば接続、なければ「Create new Supabase project」で新規作成
- リージョン: `Northeast Asia (Tokyo)` 推奨

接続が完了すると、以下の環境変数が**自動で**プロジェクトに注入されます:

- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- 他

#### 3. Supabase Storage Bucket を作成

Vercel Storage 画面の「Open in Supabase」をクリック → Supabase ダッシュボード → **Storage** → **New bucket**

- Name: `inventory-photos`
- **Public bucket: ON** に設定（写真表示のため）

#### 4. Vercel で再デプロイ

Vercel プロジェクト → **Deployments** タブ → 最新のデプロイの「⋯」→ **Redeploy**

ビルド時に `prisma db push` が走り、自動でテーブルが作成されます。

#### 5. アクセス

デプロイ完了 → 表示された URL にアクセス → `staff` または `admin` でログイン。

---

## 機能一覧

- 共有アカウントログイン（staff / admin） + 担当者名選択
- 保管場所マスタ（フロア・ルーム・写真）
- 商品マスタ（最小単位・換算比率・アラート閾値・写真）
- 入荷登録（StockLog ARRIVAL に記録、履歴表示）
- 棚卸し進捗チェックリスト（未入力 / 入力中 / 完了）
- 棚卸し入力（単位パッド・最小単位換算・localStorage 下書き）
- 月次確定処理（全入力バリデーション → InventorySnapshot 生成）
- ダッシュボード（消費数自動計算、アラート、6 ヶ月トレンドグラフ）
- PWA 対応（manifest + アイコン、スマホ「ホーム画面に追加」可能）

## 技術スタック

- **Framework**: Next.js 16 (App Router) + TypeScript + React 19
- **DB**: Supabase Postgres（Vercel Marketplace 経由で接続）
- **Storage**: Supabase Storage（商品/保管場所写真）
- **ORM**: Prisma（schema → `prisma db push` で自動同期）
- **認証**: 自前シンプル認証（iron-session、staff/admin の 2 ロール）
- **UI**: Tailwind CSS + shadcn/ui 互換コンポーネント
- **グラフ**: Recharts
- **デプロイ**: Vercel

## 必要な環境変数

### 手動で設定（Deploy Button 時に入力）

| 変数名 | 用途 | 例 |
|--------|------|-----|
| `SESSION_PASSWORD` | iron-session 暗号化キー（32文字以上） | `openssl rand -base64 32` で生成 |
| `STAFF_PASSWORD` | 現場スタッフ共有ログイン | 任意 |
| `ADMIN_PASSWORD` | 管理者ログイン | 任意 |
| `SUPABASE_STORAGE_BUCKET` | 写真保存先 Bucket 名 | `inventory-photos` |

### Vercel-Supabase 統合で自動セット

- `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING`（DB 接続）
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`（Storage）

## ローカル開発

```bash
npm install --legacy-peer-deps
cp .env.example .env
# .env を編集して Supabase 接続情報を入力
npx prisma db push   # スキーマを Supabase に反映
npm run db:seed      # 任意：サンプルデータ
npm run dev
```

http://localhost:3000 にアクセス → `staff` または `admin` でログイン。

## 主要ディレクトリ

```
src/
  app/
    (auth)/login          ログイン画面
    (auth)/select-operator 担当者名選択
    (app)/dashboard       ダッシュボード
    (app)/arrivals        入荷登録
    (app)/stocktake       棚卸し進捗 + 場所別入力
    (app)/admin/*         マスタ管理・履歴
    api/auth/*            ログイン/ログアウト/担当者名 API
  components/
    layout                ヘッダー・ナビ
    stocktake             単位入力パッド等
    ui                    shadcn/ui 互換コンポーネント
  lib/
    prisma.ts             Prisma クライアント
    supabase.ts           Storage クライアント
    session.ts            iron-session 設定
    unit.ts               単位換算ロジック
    consumption.ts        消費数計算
  proxy.ts                Next.js 16 ミドルウェア（旧 middleware.ts）
prisma/
  schema.prisma           DB スキーマ
  seed.ts                 サンプルデータ投入
```

## 運用上のポイント

- **月次フロー**: 月初に前月分の棚卸しを入力 → 全拠点で「完了」表示になったら管理者が「棚卸しを確定」。
- **消費数**: `前月確定値 + 当月入荷合計 - 当月確定値` で自動計算（ダッシュボード）。
- **アラート**: 商品マスタで閾値 ON にすると、最新棚卸し値が閾値を下回った時に赤バッジ表示。
- **オフライン下書き**: 棚卸し入力中の値は `localStorage` キー `stocktake:{年月}:{場所ID}` に自動保存。通信が切れても復帰時に復元可能。
- **確定済み月の修正**: `/admin/history` → 「確定を解除」してから再入力。
- **スキーマ変更**: `prisma/schema.prisma` を編集 → `npx prisma db push` または Vercel に push してビルドで自動反映。

## ライセンス

社内利用想定（非公開）。
