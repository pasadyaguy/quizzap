"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── API helpers ──────────────────────────────────────────────────────────────
async function sget(code: string) {
  const r = await fetch(`/api/game?code=${code}`);
  if (!r.ok) return null;
  return r.json();
}

async function sset(code: string, state: object) {
  await fetch("/api/game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state }),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genCode() { return Math.random().toString(36).slice(2, 7).toUpperCase(); }
const COLORS = ["#FF3CAC", "#36D1DC", "#F7971E", "#56CCF2", "#6FCF97", "#BB6BD9"];
const POLL_MS = 1500;
const PLAYER_ICONS = [
  "🐶","🐱","🦊","🐸","🐼","🦁",
  "🐯","🐨","🐙","🦋","🐳","🦄",
  "🧙","🥷","🦸","🧜","🤖","👾",
  "💀","🎃","🧑‍🚀","🧟",
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #08080f; color: #f0f0f0; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  :root { --neon: #00f5d4; --hot: #FF3CAC; --bg: #08080f; --card: #12121e; --border: #1e1e32; }
  h1,h2,h3,.arcade { font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; }

  .screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 28px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 2px; transition: all .15s; }
  .btn-neon { background: var(--neon); color: #08080f; }
  .btn-neon:hover { box-shadow: 0 0 20px var(--neon); transform: translateY(-1px); }
  .btn-hot { background: var(--hot); color: #fff; }
  .btn-hot:hover { box-shadow: 0 0 20px var(--hot); transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: #aaa; border: 1px solid #333; font-size: 1rem; }
  .btn-ghost:hover { border-color: var(--neon); color: var(--neon); }
  .btn:disabled { opacity: .4; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 32px; width: 100%; max-width: 560px; }
  .inp { background: #0d0d1a; border: 1px solid var(--border); border-radius: 8px; color: #f0f0f0; font-family: 'DM Sans', sans-serif; font-size: 1rem; padding: 12px 16px; width: 100%; transition: border-color .2s; }
  .inp:focus { outline: none; border-color: var(--neon); }
  .inp::placeholder { color: #444; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 100px; font-size: .75rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
  .badge-neon { background: rgba(0,245,212,.15); color: var(--neon); border: 1px solid rgba(0,245,212,.3); }
  .timer-wrap { position: relative; width: 80px; height: 80px; }
  .timer-wrap svg { transform: rotate(-90deg); }
  .timer-num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; color: var(--neon); }
  .option { display: flex; align-items: center; gap: 12px; background: #0d0d1a; border: 2px solid var(--border); border-radius: 10px; padding: 14px 18px; cursor: pointer; transition: all .15s; width: 100%; text-align: left; color: #f0f0f0; font-family: 'DM Sans', sans-serif; font-size: 1rem; }
  .option:hover:not(:disabled) { border-color: var(--neon); background: rgba(0,245,212,.05); }
  .option.selected { border-color: var(--neon); background: rgba(0,245,212,.1); }
  .option:disabled { cursor: not-allowed; }
  .opt-dot { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; }
  .result-bar-wrap { margin-bottom: 12px; }
  .result-bar-label { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: .9rem; }
  .result-bar-bg { background: #1a1a2e; border-radius: 100px; height: 20px; overflow: hidden; }
  .result-bar-fill { height: 100%; border-radius: 100px; transition: width 1s ease; }
  .lb-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #0d0d1a; border-radius: 8px; margin-bottom: 8px; }
  .lb-rank { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; width: 28px; color: #555; }
  .lb-rank.top { color: var(--neon); }
  .lb-name { flex: 1; font-weight: 600; }
  .lb-pts { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: var(--hot); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .pulse { animation: pulse 2s infinite; }
  @keyframes pop { 0%{transform:scale(.8);opacity:0} 100%{transform:scale(1);opacity:1} }
  .pop { animation: pop .3s ease forwards; }
  .room-code { font-family: 'Bebas Neue', sans-serif; font-size: 4rem; letter-spacing: 12px; color: var(--neon); text-shadow: 0 0 30px rgba(0,245,212,.5); }
  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .q-tag { font-family: 'Bebas Neue', sans-serif; font-size: .9rem; letter-spacing: 3px; color: #555; margin-bottom: 8px; }
  .scroll-list { max-height: 220px; overflow-y: auto; }
  .scroll-list::-webkit-scrollbar { width: 4px; }
  .scroll-list::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
  .logo { font-family: 'Bebas Neue', sans-serif; font-size: 3.5rem; letter-spacing: 6px; }
  .logo span { color: var(--neon); }
  .logo-sub { font-size: .85rem; letter-spacing: 4px; text-transform: uppercase; color: #555; margin-top: -6px; }
  @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--neon); margin: 0 3px; }
  .dot:nth-child(1){animation: bounce 1.2s infinite .0s}
  .dot:nth-child(2){animation: bounce 1.2s infinite .2s}
  .dot:nth-child(3){animation: bounce 1.2s infinite .4s}
  .icon-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:20px}
  .icon-btn{background:#0d0d1a;border:2px solid var(--border);border-radius:10px;cursor:pointer;font-size:1.5rem;line-height:1;padding:8px 4px;text-align:center;transition:border-color .15s,background .15s,transform .1s}
  .icon-btn:hover{border-color:var(--neon);background:rgba(0,245,212,.05)}
  .icon-btn.icon-sel{border-color:var(--neon);background:rgba(0,245,212,.15);box-shadow:0 0 8px rgba(0,245,212,.4);transform:scale(1.1)}
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question { text: string; options: string[]; timer: number; correctAnswer: number; }
interface Player { name: string; joinedAt: number; icon?: string; }
interface Response { optIdx: number; points: number; name: string; correct: boolean; }
interface GameState {
  phase: "lobby" | "question" | "results" | "finished";
  currentQ: number;
  questions: Question[];
  players: Record<string, Player>;
  scores: Record<string, number>;
  responses: Record<string, Response>;
  timeLeft: number;
  timerStarted?: number;
}

// ─── Timer Ring ───────────────────────────────────────────────────────────────
function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 34, circ = 2 * Math.PI * r;
  const pct = seconds / total;
  const color = seconds <= 5 ? "#FF3CAC" : seconds <= 10 ? "#F7971E" : "#00f5d4";
  return (
    <div className="timer-wrap">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1e1e32" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset .5s linear, stroke .3s" }} />
      </svg>
      <div className="timer-num" style={{ color }}>{seconds}</div>
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function Leaderboard({ scores, players, playerId }: { scores: Record<string, number>; players: Record<string, Player>; playerId: string }) {
  const sorted = Object.entries(scores)
    .map(([pid, pts]) => ({ pid, pts, name: players[pid]?.name || "?", icon: players[pid]?.icon }))
    .sort((a, b) => b.pts - a.pts);
  return (
    <div>
      {sorted.map((p, i) => (
        <div key={p.pid} className="lb-row">
          <div className={`lb-rank ${i < 3 ? "top" : ""}`}>{i + 1}</div>
          <div className="lb-name">{p.icon && <span style={{ marginRight: 6 }}>{p.icon}</span>}{p.name}{p.pid === playerId ? " (you)" : ""}</div>
          <div className="lb-pts">{p.pts} pts</div>
        </div>
      ))}
      {sorted.length === 0 && <div style={{ color: "#555", textAlign: "center" }}>No scores yet</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Game() {
  type View =
    | "home" | "host-setup" | "host-lobby" | "host-question" | "host-results" | "host-final"
    | "player-join" | "player-wait" | "player-question" | "player-answered" | "player-results" | "player-final";

  const [view, setView] = useState<View>("home");
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  // Unique ID for this player (used for tracking responses and scores)
  const [playerId, setPlayerId] = useState("");
useEffect(() => { setPlayerId(genCode() + genCode()); }, []);

  // Host state
  const [questions, setQuestions] = useState<Question[]>([{ text: "", options: ["", "", "", ""], timer: 20, correctAnswer: 0 }]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerTotal, setTimerTotal] = useState(20);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Player state
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [playerJoinCode, setPlayerJoinCode] = useState("");
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [playerIconInput, setPlayerIconInput] = useState<string>(PLAYER_ICONS[0]);
  const [lastRoundScores, setLastRoundScores] = useState<Record<string, Response>>({});
  const [liveQuestion, setLiveQuestion] = useState<Question | null>(null);
  const [liveTime, setLiveTime] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPolling = useCallback(() => { if (pollRef.current) clearInterval(pollRef.current); }, []);
  const startPolling = useCallback((fn: () => void, ms = POLL_MS) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fn, ms);
  }, []);
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Host: create game ────────────────────────────────────────────────────
  async function hostCreate() {
    const code = genCode();
    const validQs = questions.filter(q => q.text.trim() && q.options.filter(o => o.trim()).length >= 2);
    setRoomCode(code);
    setGameQuestions(validQs);
    const gs: GameState = { phase: "lobby", currentQ: 0, questions: validQs, players: {}, scores: {}, responses: {}, timeLeft: 0 };
    await sset(code, gs);
    setCurrentQ(0); setPlayers({}); setScores({});
    setView("host-lobby");
    startPolling(async () => {
      const g = await sget(code);
      if (g) setPlayers(g.players || {});
    });
  }

  // ── Host: start question ─────────────────────────────────────────────────
  async function hostStartQuestion(qIdx: number) {
    stopPolling();
    if (timerRef.current) clearInterval(timerRef.current);
    const gs: GameState = await sget(roomCode);
    const q = gs.questions[qIdx];
    const total = q.timer || 20;
    setTimerTotal(total); setTimeLeft(total); setResponses({});
    const updated: GameState = { ...gs, phase: "question", currentQ: qIdx, responses: {}, timeLeft: total, timerStarted: Date.now() };
    await sset(roomCode, updated);
    setView("host-question");

    let t = total;
    let ended = false;
    timerRef.current = setInterval(async () => {
      t--;
      setTimeLeft(t);
      const cur: GameState = await sget(roomCode);
      if (cur) setResponses(cur.responses || {});
      if (t <= 0 && !ended) {
        ended = true;
        clearInterval(timerRef.current!);
        const final: GameState = await sget(roomCode);
        const resp = final?.responses || {};
        const newScores = { ...(final?.scores || {}) };
        Object.entries(resp).forEach(([pid, ans]) => { newScores[pid] = (newScores[pid] || 0) + ans.points; });
        const endState: GameState = { ...final, phase: "results", scores: newScores };
        await sset(roomCode, endState);
        setScores(newScores); setPlayers(final?.players || {}); setResponses(resp);
        setView("host-results");
      }
    }, 1000);
  }

  // ── Host: next or finish ─────────────────────────────────────────────────
  async function hostNext() {
    const gs: GameState = await sget(roomCode);
    const nextIdx = currentQ + 1;
    if (nextIdx >= gs.questions.length) {
      await sset(roomCode, { ...gs, phase: "finished" });
      setView("host-final");
    } else {
      setCurrentQ(nextIdx);
      hostStartQuestion(nextIdx);
    }
  }

  // ── Player: join ─────────────────────────────────────────────────────────
  async function playerJoin() {
    const code = playerJoinCode.toUpperCase().trim();
    const gs: GameState = await sget(code);
    if (!gs) { alert("Room not found!"); return; }
    if (gs.phase === "finished") { alert("Game already ended!"); return; }
    const name = playerNameInput.trim() || "Player";
    setRoomCode(code); setPlayerName(name);
    await sset(code, { ...gs, players: { ...gs.players, [playerId]: { name, icon: playerIconInput, joinedAt: Date.now() } } });
    setView("player-wait");
    startPolling(async () => {
      const cur: GameState = await sget(code);
      if (!cur) return;
      if (cur.phase === "question") {
        setSelectedOpt(null); setCurrentQ(cur.currentQ);
        setTimerTotal(cur.questions[cur.currentQ]?.timer || 20);
        setLiveQuestion(cur.questions[cur.currentQ]);
        stopPolling(); setView("player-question");
      } else if (cur.phase === "finished") {
        setScores(cur.scores || {}); setPlayers(cur.players || {});
        stopPolling(); setView("player-final");
      }
    });
  }

  // ── Player: answer ───────────────────────────────────────────────────────
  async function playerAnswer(optIdx: number) {
    setSelectedOpt(optIdx);
    const gs: GameState = await sget(roomCode);
    if (!gs || gs.phase !== "question") return;
    const elapsed = (Date.now() - (gs.timerStarted || Date.now())) / 1000;
    const total = gs.questions[gs.currentQ]?.timer || 20;
    const isCorrect = optIdx === gs.questions[gs.currentQ]?.correctAnswer;
    const points = isCorrect ? Math.max(100, Math.round(1000 * (1 - elapsed / total))) : 0;
    await sset(roomCode, { ...gs, responses: { ...gs.responses, [playerId]: { optIdx, points, name: playerName, correct: isCorrect } } });
    setView("player-answered");
    let seenResults = false;
    startPolling(async () => {
      const cur: GameState = await sget(roomCode);
      if (!cur) return;
      if (cur.phase === "results") {
        seenResults = true;
        setScores(cur.scores || {}); setPlayers(cur.players || {}); setLastRoundScores(cur.responses || {});
        setView("player-results");
      } else if (seenResults && cur.phase === "question") {
        setSelectedOpt(null); setCurrentQ(cur.currentQ);
        setTimerTotal(cur.questions[cur.currentQ]?.timer || 20);
        setLiveQuestion(cur.questions[cur.currentQ]);
        stopPolling(); setView("player-question");
      } else if (cur.phase === "finished") {
        setScores(cur.scores || {}); setPlayers(cur.players || {}); stopPolling(); setView("player-final");
      }
    });
  }

  // ── Player: wait for next ────────────────────────────────────────────────
  function playerWaitForNext() {
    setView("player-wait");
    startPolling(async () => {
      const cur: GameState = await sget(roomCode);
      if (!cur) return;
      if (cur.phase === "question" && cur.currentQ !== currentQ) {
        setSelectedOpt(null); setCurrentQ(cur.currentQ);
        setTimerTotal(cur.questions[cur.currentQ]?.timer || 20);
        setLiveQuestion(cur.questions[cur.currentQ]);
        stopPolling(); setView("player-question");
      } else if (cur.phase === "finished") {
        setScores(cur.scores || {}); setPlayers(cur.players || {}); stopPolling(); setView("player-final");
      }
    });
  }

  // ── Player question timer ────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "player-question") return;
    let t = timerTotal;
    setLiveTime(t);
    const iv = setInterval(async () => {
      t--;
      setLiveTime(Math.max(0, t));
      const gs: GameState = await sget(roomCode);
      if (gs) setLiveQuestion(gs.questions[gs.currentQ]);
      if (gs?.phase === "results") {
        clearInterval(iv);
        setScores(gs.scores || {}); setPlayers(gs.players || {}); setLastRoundScores(gs.responses || {});
        stopPolling(); setView("player-results");
      }
      if (t <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [view]);

  // ──────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────────────────────────

  if (view === "home") return (
    <div className="screen">
      <style>{STYLE}</style>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div className="logo">QUIZ<span>ZAP</span></div>
        <div className="logo-sub">Live multiplayer trivia</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 320 }}>
        <button className="btn btn-neon" onClick={() => setView("host-setup")}>🎮 Host a Game</button>
        <button className="btn btn-ghost" onClick={() => setView("player-join")}>📱 Join a Game</button>
      </div>
    </div>
  );

  if (view === "host-setup") {
    const validQs = questions.filter(q => q.text.trim() && q.options.filter(o => o.trim()).length >= 2);
    return (
      <div className="screen" style={{ justifyContent: "flex-start", paddingTop: 32 }}>
        <style>{STYLE}</style>
        <div style={{ width: "100%", maxWidth: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <button className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: ".9rem" }} onClick={() => setView("home")}>← Back</button>
            <h2 style={{ fontSize: "1.8rem" }}>Build Your Quiz</h2>
          </div>
          {questions.map((q, qi) => (
            <div key={qi} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div className="q-tag">QUESTION {qi + 1}</div>
                {questions.length > 1 && (
                  <button className="btn btn-ghost" style={{ padding: "4px 12px", fontSize: ".85rem" }}
                    onClick={() => setQuestions(qs => qs.filter((_, i) => i !== qi))}>Remove</button>
                )}
              </div>
              <input className="inp" placeholder="Enter your question..." value={q.text}
                onChange={e => setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, text: e.target.value } : x))}
                style={{ marginBottom: 12 }} />
              <div style={{ marginBottom: 6, color: "#555", fontSize: ".78rem", letterSpacing: 1 }}>ANSWERS — click ✓ to mark the correct one</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button type="button" title="Mark as correct answer"
                      onClick={() => setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, correctAnswer: oi } : x))}
                      style={{ flexShrink: 0, width: 28, height: 38, borderRadius: 6, border: `2px solid ${q.correctAnswer === oi ? "var(--neon)" : "#1e1e32"}`, background: q.correctAnswer === oi ? "var(--neon)" : "#0d0d1a", color: q.correctAnswer === oi ? "#08080f" : "#444", cursor: "pointer", fontSize: "1rem", fontWeight: "bold" }}>
                      ✓
                    </button>
                    <input className="inp" placeholder={`Option ${oi + 1}`} value={opt}
                      onChange={e => setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, options: x.options.map((o, j) => j === oi ? e.target.value : o) } : x))}
                      style={{ borderLeft: `3px solid ${COLORS[oi]}`, flex: 1 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#555", fontSize: ".9rem" }}>Timer:</span>
                {[10, 20, 30, 45, 60].map(t => (
                  <button key={t} onClick={() => setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, timer: t } : x))}
                    className="btn" style={{ padding: "6px 14px", fontSize: ".9rem", background: q.timer === t ? "var(--neon)" : "#1a1a2e", color: q.timer === t ? "#08080f" : "#aaa", borderRadius: 6 }}>
                    {t}s
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button className="btn btn-ghost" style={{ width: "100%", marginBottom: 20 }}
            onClick={() => setQuestions(qs => [...qs, { text: "", options: ["", "", "", ""], timer: 20, correctAnswer: 0 }])}>
            + Add Question
          </button>
          <button className="btn btn-neon" style={{ width: "100%", fontSize: "1.4rem", padding: "18px" }}
            disabled={validQs.length === 0} onClick={() => { setQuestions(validQs); hostCreate(); }}>
            Launch Game →
          </button>
          {validQs.length === 0 && <div style={{ color: "#555", textAlign: "center", marginTop: 8, fontSize: ".85rem" }}>Add at least 1 question with 2+ options</div>}
        </div>
      </div>
    );
  }

  if (view === "host-lobby") {
    const playerList = Object.values(players);
    return (
      <div className="screen">
        <style>{STYLE}</style>
        <div className="card" style={{ textAlign: "center" }}>
          <div className="badge badge-neon" style={{ marginBottom: 16 }}>WAITING FOR PLAYERS</div>
          <div style={{ color: "#555", marginBottom: 8, fontSize: ".9rem", letterSpacing: 2 }}>ROOM CODE</div>
          <div className="room-code">{roomCode}</div>
          <div style={{ color: "#555", marginBottom: 24, fontSize: ".85rem" }}>Players enter this code to join</div>
          <hr className="divider" />
          <div style={{ marginBottom: 16, color: "#aaa", fontSize: ".9rem" }}>{playerList.length} player{playerList.length !== 1 ? "s" : ""} joined</div>
          <div className="scroll-list" style={{ marginBottom: 20 }}>
            {playerList.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#0d0d1a", borderRadius: 8, marginBottom: 6 }}>
                {p.icon
                  ? <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{p.icon}</span>
                  : <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length] }} />
                }
                <span>{p.name}</span>
              </div>
            ))}
            {playerList.length === 0 && <div className="pulse" style={{ color: "#333", textAlign: "center", padding: 20 }}>Waiting for players to join...</div>}
          </div>
          <button className="btn btn-hot" style={{ width: "100%" }} onClick={() => { setCurrentQ(0); hostStartQuestion(0); }}>
            Start Game ▶
          </button>
        </div>
      </div>
    );
  }

  if (view === "host-question") {
    const q = gameQuestions[currentQ];
    const validOpts = q?.options.filter(o => o.trim()) || [];
    const respCount = Object.keys(responses).length;
    const totalPlayers = Object.keys(players).length;
    return (
      <div className="screen" style={{ justifyContent: "flex-start", paddingTop: 40 }}>
        <style>{STYLE}</style>
        <div style={{ width: "100%", maxWidth: 600 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <div className="q-tag">QUESTION {currentQ + 1} OF {gameQuestions.length}</div>
              <h2 style={{ fontSize: "1.6rem", lineHeight: 1.2 }}>{q?.text}</h2>
            </div>
            <TimerRing seconds={timeLeft} total={timerTotal} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            {validOpts.map((opt, i) => (
              <div key={i} style={{ background: "#0d0d1a", border: `2px solid ${COLORS[i]}33`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS[i], flexShrink: 0 }} />
                <span>{opt}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", color: "#555", fontSize: "1rem" }}>
            <span style={{ color: "var(--neon)", fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem" }}>{respCount}</span> / {totalPlayers} answered
          </div>
        </div>
      </div>
    );
  }

  if (view === "host-results") {
    const q = gameQuestions[currentQ];
    const validOpts = q?.options.filter(o => o.trim()) || [];
    const tally = validOpts.map((_, i) => Object.values(responses).filter(r => r.optIdx === i).length);
    const total = Object.values(responses).length || 1;
    const isLast = currentQ >= gameQuestions.length - 1;
    return (
      <div className="screen" style={{ justifyContent: "flex-start", paddingTop: 40 }}>
        <style>{STYLE}</style>
        <div style={{ width: "100%", maxWidth: 600 }}>
          <div className="badge badge-neon" style={{ marginBottom: 12 }}>RESULTS</div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: 24, lineHeight: 1.2 }}>{q?.text}</h2>
          {validOpts.map((opt, i) => {
            const isCorrect = i === q?.correctAnswer;
            return (
              <div key={i} className="result-bar-wrap" style={isCorrect ? { border: "1px solid var(--neon)", borderRadius: 8, padding: "4px 8px", background: "rgba(0,245,212,.04)" } : {}}>
                <div className="result-bar-label">
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i], display: "inline-block" }} />
                    {opt}
                    {isCorrect && <span style={{ color: "var(--neon)", fontSize: ".8rem", fontWeight: 600 }}>✓ CORRECT</span>}
                  </span>
                  <span style={{ color: "#aaa" }}>{tally[i]} vote{tally[i] !== 1 ? "s" : ""}</span>
                </div>
                <div className="result-bar-bg">
                  <div className="result-bar-fill" style={{ width: `${(tally[i] / total) * 100}%`, background: isCorrect ? "var(--neon)" : COLORS[i] }} />
                </div>
              </div>
            );
          })}
          <hr className="divider" />
          <h3 style={{ marginBottom: 12, fontSize: "1.1rem", color: "#aaa" }}>Leaderboard</h3>
          <div className="scroll-list" style={{ marginBottom: 24 }}>
            <Leaderboard scores={scores} players={players} playerId={playerId} />
          </div>
          <button className="btn btn-neon" style={{ width: "100%" }} onClick={hostNext}>
            {isLast ? "🏆 End Game" : "Next Question →"}
          </button>
        </div>
      </div>
    );
  }

  if (view === "host-final") return (
    <div className="screen">
      <style>{STYLE}</style>
      <div className="card" style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: "3rem", marginBottom: 8 }}>🏆</div>
        <h1 style={{ fontSize: "2.5rem", marginBottom: 4 }}>GAME OVER</h1>
        <div style={{ color: "#555", marginBottom: 24 }}>Final Standings</div>
        <Leaderboard scores={scores} players={players} playerId={playerId} />
        <hr className="divider" />
        <button className="btn btn-neon" style={{ width: "100%" }} onClick={() => { stopPolling(); setView("home"); }}>Play Again</button>
      </div>
    </div>
  );

  if (view === "player-join") return (
    <div className="screen">
      <style>{STYLE}</style>
      <div className="card" style={{ maxWidth: 360 }}>
        <div className="logo" style={{ fontSize: "2rem", marginBottom: 4 }}>QUIZ<span>ZAP</span></div>
        <div style={{ color: "#555", fontSize: ".85rem", marginBottom: 24, letterSpacing: 2 }}>JOIN A GAME</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", color: "#777", fontSize: ".8rem", letterSpacing: 2, marginBottom: 6 }}>ROOM CODE</label>
          <input className="inp" placeholder="e.g. AB12C" value={playerJoinCode}
            onChange={e => setPlayerJoinCode(e.target.value.toUpperCase())}
            style={{ textAlign: "center", fontSize: "1.4rem", letterSpacing: 6, fontFamily: "'Bebas Neue',sans-serif" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: "#777", fontSize: ".8rem", letterSpacing: 2, marginBottom: 6 }}>YOUR NAME</label>
          <input className="inp" placeholder="Enter your name" value={playerNameInput} onChange={e => setPlayerNameInput(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: "#777", fontSize: ".8rem", letterSpacing: 2, marginBottom: 10 }}>YOUR ICON</label>
          <div className="icon-grid">
            {PLAYER_ICONS.map(icon => (
              <button key={icon} type="button"
                className={`icon-btn${playerIconInput === icon ? " icon-sel" : ""}`}
                onClick={() => setPlayerIconInput(icon)}>
                {icon}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-neon" style={{ width: "100%" }} disabled={!playerJoinCode.trim()} onClick={playerJoin}>Join →</button>
        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setView("home")}>← Back</button>
      </div>
    </div>
  );

  if (view === "player-wait") return (
    <div className="screen">
      <style>{STYLE}</style>
      <div style={{ textAlign: "center" }}>
        <div className="logo" style={{ fontSize: "2.5rem", marginBottom: 4 }}>QUIZ<span>ZAP</span></div>
        <div style={{ color: "#555", marginBottom: 8 }}>Room <span style={{ color: "var(--neon)" }}>{roomCode}</span></div>
        <div style={{ fontSize: "3rem", marginBottom: 8 }}>{playerIconInput}</div>
        <div style={{ color: "#aaa", marginBottom: 32 }}>Hey <strong>{playerName}</strong>! You&apos;re in 🎉</div>
        <div style={{ color: "#555", marginBottom: 16, fontSize: ".9rem" }}>Waiting for host to start</div>
        <div><span className="dot" /><span className="dot" /><span className="dot" /></div>
      </div>
    </div>
  );

  if (view === "player-question") {
    const validOpts = liveQuestion?.options?.filter(o => o.trim()) || [];
    return (
      <div className="screen" style={{ justifyContent: "flex-start", paddingTop: 40 }}>
        <style>{STYLE}</style>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div className="q-tag">QUESTION {currentQ + 1}</div>
            <TimerRing seconds={liveTime} total={timerTotal} />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: 24, lineHeight: 1.3 }}>{liveQuestion?.text || "Loading..."}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {validOpts.map((opt, i) => (
              <button key={i} className={`option ${selectedOpt === i ? "selected" : ""}`}
                disabled={selectedOpt !== null} onClick={() => playerAnswer(i)}>
                <div className="opt-dot" style={{ background: COLORS[i] }} />
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === "player-answered") return (
    <div className="screen">
      <style>{STYLE}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: "2rem", marginBottom: 8 }}>Answer Locked!</h2>
        <div style={{ color: "#555", marginBottom: 24 }}>Waiting for others...</div>
        <div><span className="dot" /><span className="dot" /><span className="dot" /></div>
      </div>
    </div>
  );

  if (view === "player-results") {
    const myResponse = lastRoundScores[playerId];
    const myPoints = myResponse?.points || 0;
    const isCorrect = myResponse?.correct ?? false;
    const answered = !!myResponse;
    const myRank = Object.values(scores).filter(s => s > (scores[playerId] || 0)).length + 1;
    return (
      <div className="screen">
        <style>{STYLE}</style>
        <div className="card pop" style={{ maxWidth: 400, textAlign: "center" }}>
          <div className="badge badge-neon" style={{ marginBottom: 16 }}>THIS ROUND</div>
          <div style={{ fontSize: "2.5rem", marginBottom: 4 }}>{!answered ? "⏱️" : isCorrect ? "✅" : "❌"}</div>
          <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8, color: !answered ? "#555" : isCorrect ? "var(--neon)" : "var(--hot)" }}>
            {!answered ? "No answer" : isCorrect ? "Correct!" : "Wrong!"}
          </div>
          <div style={{ fontSize: "3rem", fontFamily: "'Bebas Neue',sans-serif", color: "var(--hot)", marginBottom: 4 }}>+{myPoints}</div>
          <div style={{ color: "#555", marginBottom: 20 }}>points earned</div>
          <div style={{ background: "#0d0d1a", borderRadius: 10, padding: "12px", marginBottom: 20 }}>
            <div style={{ color: "#555", fontSize: ".8rem", letterSpacing: 2, marginBottom: 4 }}>TOTAL SCORE</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2rem", color: "var(--neon)" }}>{scores[playerId] || 0} pts</div>
            <div style={{ color: "#555", fontSize: ".85rem" }}>Rank #{myRank}</div>
          </div>
          <div style={{ marginBottom: 16, color: "#777", fontSize: ".9rem" }}>Leaderboard</div>
          <Leaderboard scores={scores} players={players} playerId={playerId} />
          <hr className="divider" />
          <button className="btn btn-neon" style={{ width: "100%" }} onClick={playerWaitForNext}>Next →</button>
        </div>
      </div>
    );
  }

  if (view === "player-final") {
    const myRank = Object.values(scores).filter(s => s > (scores[playerId] || 0)).length + 1;
    return (
      <div className="screen">
        <style>{STYLE}</style>
        <div className="card" style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 8 }}>🏆</div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: 4 }}>GAME OVER</h1>
          <div style={{ color: "#555", marginBottom: 8 }}>
            {playerIconInput && <span style={{ marginRight: 6 }}>{playerIconInput}</span>}
            {playerName}
          </div>
          <div style={{ color: "var(--hot)", fontFamily: "'Bebas Neue',sans-serif", fontSize: "2rem", marginBottom: 4 }}>{scores[playerId] || 0} pts</div>
          <div style={{ color: "#555", marginBottom: 24 }}>Final rank: #{myRank}</div>
          <Leaderboard scores={scores} players={players} playerId={playerId} />
          <hr className="divider" />
          <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => { stopPolling(); setView("home"); }}>Back to Home</button>
        </div>
      </div>
    );
  }

  return null;
}
