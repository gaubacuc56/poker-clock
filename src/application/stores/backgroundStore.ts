import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { BackgroundRepository } from '@domain/ports';
import type { Background } from '@domain/entities';
import { loadOnce, type LoadOptions } from './loadOnce';

interface BackgroundStoreState {
  backgrounds: Background[];
  isLoaded: boolean;
  isUploading: boolean;
  load: (options?: LoadOptions) => Promise<void>;
  reset: () => void;
  upload: (file: File) => Promise<string | null>;
  remove: (id: string) => Promise<string | null>;
}

export function createBackgroundStore(
  repo: BackgroundRepository,
): UseBoundStore<StoreApi<BackgroundStoreState>> {
  return create<BackgroundStoreState>((set, get) => ({
    backgrounds: [],
    isLoaded: false,
    isUploading: false,
    load: loadOnce(
      () => get().isLoaded,
      async () => {
        const backgrounds = await repo.list();
        set({ backgrounds, isLoaded: true });
      },
    ),
    reset: () => set({ backgrounds: [], isLoaded: false }),
    upload: async (file) => {
      set({ isUploading: true });
      try {
        await repo.upload(file);
        const backgrounds = await repo.list();
        set({ backgrounds, isUploading: false });
        return null;
      } catch (err) {
        set({ isUploading: false });
        return err instanceof Error ? err.message : 'Upload failed.';
      }
    },
    remove: async (id) => {
      try {
        await repo.remove(id);
        set((state) => ({
          backgrounds: state.backgrounds.filter((background) => background.id !== id),
        }));
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : 'Delete failed.';
      }
    },
  }));
}
