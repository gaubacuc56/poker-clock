import type { TournamentConfig } from '../entities';

export interface TournamentRepository {
  list(): Promise<TournamentConfig[]>;
  save(tournament: TournamentConfig): Promise<TournamentConfig>;
  remove(id: string): Promise<void>;
  /** Public lookup by short join code — no ownership check, used by the unauthenticated projector view. */
  findByJoinCode(code: string): Promise<TournamentConfig | null>;
}
