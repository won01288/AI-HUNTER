import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db.ts";
import { collectWorknetJobs } from "../src/lib/collectors/worknet.ts";

// migrate.mjs와 같은 방식(Node 24 native type stripping)으로 .ts를 그대로 실행한다.
// Render Cron Job은 이 스크립트를 커맨드로 등록해서 하루 1회 실행한다
// (등록은 Render 대시보드에서 수동으로 해야 함 — 배포 설정이라 코드로는 못 함).

const startedAt = new Date().toISOString();
const runId = randomUUID();

let result;
try {
  result = await collectWorknetJobs();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await db.execute({
    sql: `INSERT INTO collection_runs (id, started_at, finished_at, fetched_count, inserted_count, failed_count, error_message)
          VALUES (?, ?, datetime('now'), 0, 0, 0, ?)`,
    args: [runId, startedAt, message],
  });
  console.error("워크넷 수집 배치 실패:", error);
  process.exit(1);
}

await db.execute({
  sql: `INSERT INTO collection_runs (id, started_at, finished_at, fetched_count, inserted_count, failed_count, error_message)
        VALUES (?, ?, datetime('now'), ?, ?, ?, ?)`,
  args: [runId, startedAt, result.fetchedCount, result.insertedCount, result.failedCount, result.errorMessage],
});

console.log(
  `워크넷 수집 완료: 조회 ${result.fetchedCount}건, 저장 ${result.insertedCount}건, 실패 ${result.failedCount}건`
);
