import { createClient, type Client } from "@libsql/client";

// Next.js 개발 모드는 파일을 고칠 때마다 모듈을 다시 로드하는데(hot reload),
// 그때마다 createClient()를 새로 부르면 커넥션이 계속 쌓인다.
// globalThis에 클라이언트를 캐싱해두고 재사용해서 이 문제를 막는다.
const globalForDb = globalThis as unknown as { dbClient?: Client };

export const db: Client =
  globalForDb.dbClient ??
  createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbClient = db;
}
