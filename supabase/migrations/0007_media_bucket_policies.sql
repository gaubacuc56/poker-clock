-- poker-clock: allow signed-in users to list, upload & delete projector backgrounds.
--
-- The `media` bucket is Public, which only makes individual objects
-- downloadable by URL. Listing, uploading and deleting still go through RLS
-- on storage.objects, so without these policies the Settings → Backgrounds
-- screen's `list()` call returns an empty array (even though the images
-- exist) and uploads/deletes fail.
--
-- Run this in the Supabase SQL Editor (Storage policies live on the
-- storage.objects table, which the dashboard's Storage → Policies UI
-- edits under the hood — this does the same thing).

drop policy if exists "authenticated can list media backgrounds" on storage.objects;
drop policy if exists "authenticated can upload media backgrounds" on storage.objects;
drop policy if exists "authenticated can delete media backgrounds" on storage.objects;

create policy "authenticated can list media backgrounds"
on storage.objects for select
to authenticated
using (bucket_id = 'media');

create policy "authenticated can upload media backgrounds"
on storage.objects for insert
to authenticated
with check (bucket_id = 'media');

create policy "authenticated can delete media backgrounds"
on storage.objects for delete
to authenticated
using (bucket_id = 'media');
