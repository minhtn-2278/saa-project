import type { NextRequest } from "next/server";
import { getLaunchConfig } from "@/lib/validations/launch-config";
import {
  PRELAUNCH_BYPASS_COOKIE,
  PRELAUNCH_BYPASS_HEADER,
  PRELAUNCH_COUNTDOWN_ROUTE,
} from "./constants";

export type GateDecision =
  | { type: "pass" }
  | { type: "rewrite" }
  | { type: "apiBlock"; retryAfterSeconds: number };

const recentLogByIp = new Map<string, number>();
const LOG_INTERVAL_MS = 5 * 60 * 1000;

const PASS: GateDecision = { type: "pass" };
const REWRITE: GateDecision = { type: "rewrite" };

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let diff = 1;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return diff === 0;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function hasValidBypassHeader(request: NextRequest): boolean {
  const headerValue = request.headers.get(PRELAUNCH_BYPASS_HEADER);
  const expected = process.env.PRELAUNCH_BYPASS_TOKEN;
  if (!headerValue || !expected) return false;
  return safeCompare(headerValue, expected);
}

function hasBypassCookie(request: NextRequest): boolean {
  return request.cookies.get(PRELAUNCH_BYPASS_COOKIE)?.value === "1";
}

export function secondsUntilLaunch(launchDate: Date, now: Date = new Date()): number {
  const diff = launchDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

function maybeLogGateHit(pathname: string, remainingSeconds: number, ip: string): void {
  const now = Date.now();
  const last = recentLogByIp.get(ip) ?? 0;
  if (now - last < LOG_INTERVAL_MS) return;
  recentLogByIp.set(ip, now);
  // TODO(logger): migrate to project structured logger once chosen.
  console.info(
    JSON.stringify({
      event: "prelaunch.gate.active",
      path: pathname,
      remainingSeconds,
    })
  );
}

export function evaluatePrelaunchGate(request: NextRequest): GateDecision {
  const config = getLaunchConfig();
  if (!config) return PASS;

  const now = new Date();
  if (now >= config.launchDate) return PASS;

  if (hasValidBypassHeader(request) || hasBypassCookie(request)) return PASS;

  const { pathname } = request.nextUrl;
  if (pathname === PRELAUNCH_COUNTDOWN_ROUTE) return PASS;

  const remainingSeconds = secondsUntilLaunch(config.launchDate, now);

  if (pathname.startsWith("/api/")) {
    return { type: "apiBlock", retryAfterSeconds: remainingSeconds };
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  maybeLogGateHit(pathname, remainingSeconds, ip);

  return REWRITE;
}
