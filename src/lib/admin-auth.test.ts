import { afterEach, describe, expect, it, vi } from "vitest";
import { adminConfigured, checkAdminAuth } from "./admin-auth";

const basic = (u: string, p: string) => "Basic " + btoa(`${u}:${p}`);

describe("checkAdminAuth", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("is closed when credentials aren't configured", () => {
    vi.stubEnv("ADMIN_USER", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(adminConfigured()).toBe(false);
    expect(checkAdminAuth(basic("", ""))).toBeNull();
  });
  it("accepts only the configured user and password", () => {
    vi.stubEnv("ADMIN_USER", "editor");
    vi.stubEnv("ADMIN_PASSWORD", "pa:ss word");
    expect(checkAdminAuth(basic("editor", "pa:ss word"))).toBe("editor");
    expect(checkAdminAuth(basic("editor", "pa:ss wore"))).toBeNull();
    expect(checkAdminAuth(basic("editors", "pa:ss word"))).toBeNull();
    expect(checkAdminAuth("Bearer x")).toBeNull();
    expect(checkAdminAuth("Basic !!!")).toBeNull();
    expect(checkAdminAuth(null)).toBeNull();
  });
});
