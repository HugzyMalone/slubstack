import { describe, it, expect, vi, afterEach } from "vitest";
import { pushLeagueXp } from "@/lib/leagues";

vi.mock("@/lib/supabase/browser", () => ({
  hasActiveSession: vi.fn(() => Promise.resolve(true)),
}));

import { hasActiveSession } from "@/lib/supabase/browser";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pushLeagueXp", () => {
  it("does not call fetch for zero or negative amounts", () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("fetch", fetchMock);
    pushLeagueXp(0);
    pushLeagueXp(-5);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("POSTs the amount to /api/leagues/xp with keepalive once a session is confirmed", async () => {
    vi.mocked(hasActiveSession).mockResolvedValue(true);
    const fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("fetch", fetchMock);
    pushLeagueXp(25);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/leagues/xp");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body as string)).toEqual({ amount: 25 });
    vi.unstubAllGlobals();
  });

  it("skips the POST for guests with no session", async () => {
    vi.mocked(hasActiveSession).mockResolvedValue(false);
    const fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("fetch", fetchMock);
    pushLeagueXp(25);
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
