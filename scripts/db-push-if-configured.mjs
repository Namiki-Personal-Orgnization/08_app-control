// Vercel ビルド時に Prisma スキーマを Supabase に自動反映するヘルパー。
// POSTGRES_PRISMA_URL が未設定（= 初回デプロイで Supabase 未接続）の場合はスキップして
// ビルドを継続させる。Supabase 接続後の再デプロイで自動的に db push が実行される。

import { spawnSync } from "node:child_process";

const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.log(
    "[build] POSTGRES_PRISMA_URL が未設定のため prisma db push をスキップします。\n" +
      "[build] Supabase を Vercel Storage タブから接続後、再デプロイしてください。",
  );
  process.exit(0);
}

console.log("[build] prisma db push を実行中...");
const result = spawnSync(
  "npx",
  ["prisma", "db", "push", "--skip-generate"],
  { stdio: "inherit", env: process.env },
);

if (result.status !== 0) {
  console.error("[build] prisma db push に失敗しました。");
  process.exit(result.status ?? 1);
}
