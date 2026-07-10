import type { Background } from '../entities';

export interface BackgroundRepository {
  list(): Promise<Background[]>;
  upload(file: File): Promise<Background>;
  remove(id: string): Promise<void>;
}
