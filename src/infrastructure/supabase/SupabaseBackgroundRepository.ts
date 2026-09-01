import type { BackgroundRepository } from '@domain/ports';
import type { Background } from '@domain/entities';
import { supabase } from './client';

/**
 * Background images live in a `background/` folder inside the shared `media`
 * bucket, so a `projectorBackgroundId` is the object's full in-bucket path
 * (e.g. `background/uuid-name.jpg`) — that's what `getPublicUrl` expects and
 * what gets stored on the tournament row.
 *
 * Ownership is not in the path. It is `storage.objects.owner`, which storage
 * records on upload, and RLS (migration `0013`) is what makes `list()` return
 * only the caller's own images — the folder stays flat so objects uploaded
 * before ownership existed keep resolving at the paths tournaments already
 * reference.
 *
 * What the path does carry is the uploader's id as a filename prefix, so two
 * accounts uploading `felt.jpg` don't collide in a bucket they can no longer see
 * each other in.
 */
const BUCKET = 'media';
const FOLDER = 'background';

/** Separates the owner id from the file's own name — not `/`, which would make
 *  it a folder and break the single flat `list()`. */
const OWNER_PREFIX_SEPARATOR = '__';

const OWNER_PREFIXED = new RegExp(`^[0-9a-f-]{36}${OWNER_PREFIX_SEPARATOR}`, 'i');

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

/** The name to show: the file the account chose, without the id in front of it. */
function displayLabel(fileName: string): string {
  return fileName.replace(OWNER_PREFIXED, '');
}

function toBackground(fileName: string): Background {
  const path = `${FOLDER}/${fileName}`;
  return {
    id: path,
    label: displayLabel(fileName),
    path: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
  };
}

export class SupabaseBackgroundRepository implements BackgroundRepository {
  async list(): Promise<Background[]> {
    const { data, error } = await supabase.storage.from(BUCKET).list(FOLDER);
    if (error) throw error;

    return (data ?? []).filter((file) => file.id !== null).map((file) => toBackground(file.name));
  }

  async upload(file: File): Promise<Background> {
    const { data: auth } = await supabase.auth.getUser();
    const ownerId = auth.user?.id;
    if (!ownerId) throw new Error('Not signed in.');

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${ownerId}${OWNER_PREFIX_SEPARATOR}${safeName}`;

    // `upsert` so re-uploading a name the account already used replaces its own
    // image instead of failing — it can no longer be anybody else's file.
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${FOLDER}/${fileName}`, file, { upsert: true });
    if (error) throw error;

    return toBackground(fileName);
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
        'Delete was blocked — the object still exists. Backgrounds can only be deleted by the account that uploaded them (migration 0013).',
      );
    }
  }
}
