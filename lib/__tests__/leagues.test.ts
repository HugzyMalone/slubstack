import { describe, it, expect, vi, afterEach } from "vitest";
import { pushLeagueXp } from "@/lib/leagues";

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

  it("POSTs the amount to /api/leagues/xp with keepalive for a positive amount", () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("fetch", fetchMock);
    pushLeagueXp(25);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/leagues/xp");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body as string)).toEqual({ amount: 25 });
    vi.unstubAllGlobals();
  });
});
