import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession, type IronSession } from "iron-session";

// 세션에 저장할 정보는 최소한으로 둔다 (userId만).
// 그 외 사용자 정보(이메일, 온보딩 여부 등)는 필요할 때 DB에서 조회한다.
export interface SessionData {
  userId?: string;
}

export const sessionOptions = {
  // iron-session은 이 password로 쿠키 내용을 암호화한다.
  // .env.local의 SESSION_SECRET을 사용 (커밋 금지, .env.example에는 키 이름만).
  password: process.env.SESSION_SECRET!,
  cookieName: "ai-hunter-session",
  cookieOptions: {
    // 로컬 개발(http)에서는 secure 쿠키가 저장되지 않으므로 production에서만 켠다.
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

// 로그인이 필요한 페이지 맨 위에서 호출.
// 세션에 userId가 없으면 로그인 페이지로 보내고, 있으면 userId를 반환한다.
export async function requireUser(): Promise<string> {
  const session = await getSession();

  if (!session.userId) {
    redirect("/login");
  }

  return session.userId;
}
