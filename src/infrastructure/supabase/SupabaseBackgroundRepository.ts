import type { BackgroundRepository } from '@domain/ports';
import type { Background } from '@domain/entities';
import { supabase } from './client';

/**
 * Background images live in a `background/` folder inside the shared `media`
 * bucket, so a `projectorBackgroundId` is the object's full in-bucket path
 * (e.g. `background/uuid-name.jpg`) — that's what `getPublicUrl` expects and
 * what gets stored on the tournament row.
 */
const BUCKET = 'media';
const FOLDER = 'background';

/**
 * Resolves a `projectorBackgroundId` to a renderable URL for an object in
 * Supabase Storage. Used by the public, unauthenticated projector page —
 * `getPublicUrl` only builds a URL string client-side, so it needs no auth
 * check and is safe to call there.
 */
export function resolveBackgroundPath(id: string | undefined): string | undefined {
  if (!id) return undefined;

  return supabase.storage.from(BUCKET).getPublicUrl(id).data.publicUrl;
}

export class SupabaseBackgroundRepository implements BackgroundRepository {
  async list(): Promise<Background[]> {
    const { data, error } = await supabase.storage.from(BUCKET).list(FOLDER);
    if (error) throw error;

    return (data ?? [])
      .filter((file) => file.id !== null)
      .map((file) => {
        const path = `${FOLDER}/${file.name}`;
        return {
          id: path,
        label: file.name,
          path: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
        };
      });
  }

  async upload(file: File): Promise<Background> {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${FOLDER}/${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;

    return {
      id: path,
      label: file.name,
      path: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    };
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await supabase.storage.from(BUCKET).remove([id]);
    if (error) throw error;
    // Supabase Storage returns success with an empty `data` array when an RLS
    // policy silently blocks the delete — nothing is removed but no error is
    // raised. Treat "reported success, deleted nothing" as a real failure so
    // the UI doesn't drop an object that still exists in the bucket.
    if (!data || data.length === 0) {
      throw new Error(
        'Delete was blocked — the object still exists. Check the `media` bucket has a delete policy for the authenticated role (migration 0007).',
      );
    }
  }
}
