import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { db } from "../src/lib/db.ts";

// Node 24는 .ts 파일의 타입 표기를 그대로 벗겨내고 실행할 수 있어서
// (native type stripping), db.ts를 별도 빌드 없이 그대로 import해서
// 앱과 동일한 싱글턴 클라이언트를 재사용한다.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
const schema = readFileSync(schemaPath, "utf-8");

// executeMultiple은 세미콜론으로 구분된 여러 SQL문을 한 번에 실행해준다.
await db.executeMultiple(schema);

console.log(
  "마이그레이션 완료: users, user_preferences, priority_weights, job_postings, collection_runs 테이블 생성됨"
);
