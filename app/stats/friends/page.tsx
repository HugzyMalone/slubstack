"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, UserPlus, Check, X, Search, Trophy, Flame } from "lucide-react";
import { toast } from "sonner";

type Friend = { id: string; username: string; avatar: string | null; xp: number; streak: number };
type Request = { id: string; username: string; avatar: string | null };
type SearchResult = { id: string; username: string; avatar: string | null };

function isUrl(v: string | null): v is string {
  return !!v && (v.startsWith("http") || v.startsWith("/") || v.startsWith("data:"));
}

function Avatar({ avatar, username, size = 40 }: { avatar: string | null; username: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full overflow-hidden font-display font-extrabold text-fg/70"
      style={{
        width: size,
        height: size,
        background: isUrl(avatar) ? undefined : "color-mix(in srgb, var(--accent) 14%, var(--surface))",
        border: "1.5px solid color-mix(in srgb, var(--fg) 10%, transparent)",
      }}
    >
      {isUrl(avatar) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        avatar ?? username.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const refresh = useCallback(async () => {
    const [f, r] = await Promise.all([
      fetch("/api/friends").then((res) => res.json()).catch(() => ({ friends: [] })),
      fetch("/api/friends/requests").then((res) => res.json()).catch(() => ({ requests: [] })),
    ]);
    setFriends(f.friends ?? []);
    setRequests(r.requests ?? []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(query.trim())}`).then((r) => r.json()).catch(() => ({ results: [] }));
      setResults(res.results ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function add(username: string) {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Couldn't send request");
      return;
    }
    toast.success(json.accepted ? "Friend added" : "Request sent");
    setQuery("");
    setResults([]);
    refresh();
  }

  async function accept(senderId: string) {
    const res = await fetch("/api/friends/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId }),
    });
    if (!res.ok) { toast.error("Couldn't accept"); return; }
    toast.success("Friend added");
    refresh();
  }

  async function decline(senderId: string) {
    await fetch(`/api/friends/requests?senderId=${senderId}`, { method: "DELETE" });
    refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/friends?id=${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/stats"
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-bold text-fg/70 hover:text-fg transition-colors"
          style={{
            background: "color-mix(in srgb, var(--fg) 4%, transparent)",
            border: "1.5px solid var(--border)",
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          Back
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Friends</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3"
          style={{
            background: "var(--surface)",
            border: "2px solid var(--border)",
            boxShadow: "var(--shadow-bouncy)",
          }}
        >
          <Search size={18} strokeWidth={2.5} className="text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Add by username"
            className="flex-1 bg-transparent text-[15px] font-semibold outline-none placeholder:text-muted/70"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="text-muted hover:text-fg">
              <X size={16} />
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div
            className="absolute inset-x-0 top-full z-10 mt-2 rounded-2xl overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "2px solid var(--border)",
              boxShadow: "var(--shadow-panel-hi)",
            }}
          >
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => add(r.username)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--accent-soft)]"
              >
                <Avatar avatar={r.avatar} username={r.username} size={36} />
                <span className="flex-1 font-semibold">{r.username}</span>
                <UserPlus size={16} strokeWidth={2.5} className="text-[var(--accent)]" />
              </button>
            ))}
          </div>
        )}
        {searching && query.trim().length >= 2 && results.length === 0 && (
          <p className="mt-2 text-[13px] text-muted">Searching…</p>
        )}
      </div>

      {/* Pending requests */}
      {requests.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display mb-2 text-[12px] font-extrabold uppercase tracking-wide text-muted">
            Requests · {requests.length}
          </h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{
                  background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--game-soft) 100%)",
                  border: "2px solid color-mix(in srgb, var(--accent) 22%, transparent)",
                }}
              >
                <Avatar avatar={r.avatar} username={r.username} />
                <span className="flex-1 font-bold">{r.username}</span>
                <button
                  onClick={() => accept(r.id)}
                  aria-label="Accept"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform active:translate-y-[2px]"
                  style={{
                    background: "var(--success)",
                    boxShadow: "0 3px 0 color-mix(in srgb, var(--success) 70%, black)",
                  }}
                >
                  <Check size={16} strokeWidth={3} />
                </button>
                <button
                  onClick={() => decline(r.id)}
                  aria-label="Decline"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-fg/60 transition-colors hover:bg-white/40 hover:text-fg"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section>
        <h2 className="font-display mb-2 text-[12px] font-extrabold uppercase tracking-wide text-muted">
          Friends · {friends.length}
        </h2>
        {friends.length === 0 ? (
          <div
            className="rounded-[var(--radius-chunk)] p-6 text-center"
            style={{
              background: "var(--surface)",
              border: "2px dashed var(--border-hi)",
            }}
          >
            <p className="text-[14px] font-semibold text-muted">
              No friends yet. Search a username above to send a request.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <Link
                key={f.id}
                href={`/stats/user/${f.id}`}
                className="flex items-center gap-3 rounded-2xl p-3 transition-transform active:translate-y-[2px]"
                style={{
                  background: "var(--surface)",
                  border: "2px solid var(--border)",
                  boxShadow: "0 3px 0 color-mix(in srgb, var(--fg) 8%, transparent)",
                }}
              >
                <Avatar avatar={f.avatar} username={f.username} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{f.username}</div>
                  <div className="flex items-center gap-3 text-[12px] text-muted">
                    <span className="flex items-center gap-1">
                      <Trophy size={12} strokeWidth={2.5} className="text-[var(--accent)]" />
                      <span className="font-display font-extrabold tabular-nums">{f.xp}</span> XP
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame size={12} strokeWidth={2.5} className="text-[#ff6a1c]" />
                      <span className="font-display font-extrabold tabular-nums">{f.streak}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); remove(f.id); }}
                  aria-label="Remove friend"
                  className="text-muted hover:text-fg transition-colors p-1"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
