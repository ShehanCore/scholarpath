import { afterEach, describe, expect, it, vi } from "vitest";
import { adminConfigured, checkAdminLogin, createAdminSession, readAdminSession, safeAdminNext } from "./admin-auth";

describe("admin sign-in", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is closed when the login isn't configured", async () => {
    vi.stubEnv("ADMIN_USER", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(adminConfigured()).toBe(false);
    expect(checkAdminLogin("", "")).toBeNull();
    expect(await createAdminSession()).toBeNull();
  });

  it("accepts only the configured user and password, ignoring surrounding spaces", () => {
    vi.stubEnv("ADMIN_USER", " editor\n");
    vi.stubEnv("ADMIN_PASSWORD", "pa:ss wörd ");
    expect(checkAdminLogin("editor", "pa:ss wörd")).toBe("editor");
    expect(checkAdminLogin(" editor ", " pa:ss wörd")).toBe("editor");
    expect(checkAdminLogin("editor", "pa:ss word")).toBeNull();
    expect(checkAdminLogin("editors", "pa:ss wörd")).toBeNull();
    // The same letter typed as one character or as letter + accent.
    expect(checkAdminLogin("editor", "pa:ss wörd")).toBe("editor");
  });

  it("issues a session that expires after 12 hours and ends when the password changes", async () => {
    vi.stubEnv("ADMIN_USER", "editor");
    vi.stubEnv("ADMIN_PASSWORD", "first");
    const now = Date.parse("2026-11-20T10:00:00Z");
    const token = await createAdminSession(now);
    expect(await readAdminSession(token, now + 60_000)).toBe("editor");
    expect(await readAdminSession(token, now + 13 * 3_600_000)).toBeNull();
    expect(await readAdminSession(`${now + 99_999_999}.${token!.split(".")[1]}`, now)).toBeNull();
    expect(await readAdminSession("garbage", now)).toBeNull();
    vi.stubEnv("ADMIN_PASSWORD", "second");
    expect(await readAdminSession(token, now + 60_000)).toBeNull();
  });

  it("only returns to pages inside the admin after signing in", () => {
    expect(safeAdminNext("/admin/scholarships/chevening")).toBe("/admin/scholarships/chevening");
    expect(safeAdminNext("https://evil.example")).toBe("/admin");
    expect(safeAdminNext("//evil.example")).toBe("/admin");
    expect(safeAdminNext("/admin/login")).toBe("/admin");
    expect(safeAdminNext(null)).toBe("/admin");
  });
});
