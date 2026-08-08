import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { findTournamentByJoinCode } from '@composition/container';
import Screen from '../../components/layout/Screen';
import Brand from '../../components/layout/Brand';

export default function ProjectorEntryPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
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
    <Screen>
      <div className="scroll grid place-items-center bg-base-deep p-8">
        <form onSubmit={handleSubmit} className="w-[min(420px,100%)]">
          <div className="mb-5 flex items-center gap-[11px]">
            <Brand className="size-11" />
            <span className="text-[14px] tracking-[.18em] uppercase text-accent">
              Poker Clock · Projector
            </span>
          </div>

          <h1 className="mb-1.5 text-[36px]">Open a projector</h1>
          <p className="mb-[26px] text-[20px] text-muted">
            Type the five-character join code shown on the organizer's dashboard.
          </p>

          <input
            type="text"
            className="input display h-[82px] border-hair-strong text-center text-[47px] tracking-[.34em] indent-[.34em] uppercase"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (notFound) setNotFound(false);
            }}
            placeholder="CODE"
            aria-label="Join code"
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />

          {notFound && (
            <p className="mt-3 text-[16px] text-coral">
              No tournament found for this code.
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary mt-[18px] h-12 w-full text-[18px]"
            disabled={!code.trim() || checking}
          >
            {checking ? 'Checking…' : 'Open Projector'}
          </button>

          <p className="mt-[18px] text-[18px] text-faint">
            Codes never contain 0, O, 1, I or L.
          </p>
        </form>
      </div>
    </Screen>
  );
}
