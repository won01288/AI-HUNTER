import bcrypt from "bcryptjs";

// bcrypt salt round 수. 높을수록 안전하지만 느려진다.
// 10~12가 일반적인 권장값이라 중간값인 10을 사용.
const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
