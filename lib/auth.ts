import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
const COOKIE_NAME = "project_vault_session";
const TOKEN_VALUE = "project-vault-authenticated";
function signature() { return createHmac("sha256", process.env.APP_PASSWORD || "321").update(TOKEN_VALUE).digest("hex"); }
export function createSessionToken() { return signature(); }
export function isValidSession(token?: string) { if (!token) return false; const a=Buffer.from(signature()), b=Buffer.from(token); return a.length===b.length && timingSafeEqual(a,b); }
export async function hasSession() { const store=await cookies(); return isValidSession(store.get(COOKIE_NAME)?.value); }
export { COOKIE_NAME };