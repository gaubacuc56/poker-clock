import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { findTournamentByJoinCode } from "@composition/container";

export default function ProjectorEntryPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized || checking) return;

    setChecking(true);
    setNotFound(false);
    try {
      const tournament = await findTournamentByJoinCode(normalized);
      if (tournament) {
        navigate(`/p/${normalized}`);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col items-center gap-6"
      >
        <h1 className="text-center text-3xl font-bold">Projector</h1>
        <p className="text-center text-slate-400">
          Enter the tournament code to open the projector.
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (notFound) setNotFound(false);
          }}
          placeholder="Enter code"
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-center text-2xl font-semibold uppercase tracking-[0.3em] tabular-nums outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={!code.trim() || checking}
          className="btn-primary w-full py-3 text-lg disabled:opacity-50"
        >
          {checking ? "Checking…" : "Open Projector"}
        </button>

        {notFound && (
          <p className="text-center text-red-400">
            No tournament found for this code.
          </p>
        )}
      </form>
    </div>
  );
}
