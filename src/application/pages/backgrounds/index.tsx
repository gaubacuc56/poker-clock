import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBackgroundStore } from '@composition/container';
import type { Background } from '@domain/entities';
import PageHeader from '../../components/layout/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import Spinner from '../../components/Spinner';
import { ChevronLeftIcon, TrashIcon, UploadIcon } from '../../components/icons';

export default function BackgroundsPage() {
  const backgrounds = useBackgroundStore((state) => state.backgrounds);
  const isLoaded = useBackgroundStore((state) => state.isLoaded);
  const isUploading = useBackgroundStore((state) => state.isUploading);
  const upload = useBackgroundStore((state) => state.upload);
  const remove = useBackgroundStore((state) => state.remove);
  const load = useBackgroundStore((state) => state.load);

  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Background | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    const message = await upload(file);
    if (message) setError(message);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setError(null);
    const message = await remove(pendingDelete.id);
    setIsDeleting(false);
    if (message) setError(message);
    setPendingDelete(null);
  }

  return (
    <div className="min-h-screen bg-themed-primary text-themed-primary">
      <PageHeader />

      <div className="mx-auto max-w-3xl px-4 py-6 pb-20 sm:px-6 sm:py-10">
        <Link
          to="/settings"
          className="btn-ghost mb-4 inline-flex items-center gap-1.5 px-0 text-sm"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Settings
        </Link>

        <h1 className="mb-4 text-2xl font-semibold">Projector backgrounds</h1>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="btn-primary mb-6 inline-flex items-center gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Spinner /> : <UploadIcon className="h-4 w-4" />}
          Upload
        </button>
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {isLoaded && backgrounds.length === 0 ? (
          <p className="text-sm text-themed-muted">No backgrounds yet. Upload one to get started.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {backgrounds.map((background) => (
              <div
                key={background.id}
                className="group relative overflow-hidden rounded-lg border border-themed"
              >
                <img
                  src={background.path}
                  alt={background.label}
                  className="h-20 w-full object-cover"
                />
                <p className="truncate px-2 py-1 text-xs text-themed-muted">{background.label}</p>
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1.5 text-white transition-colors hover:bg-red-600"
                  title={`Delete ${background.label}`}
                  aria-label={`Delete ${background.label}`}
                  onClick={() => setPendingDelete(background)}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete background?"
        message={`"${pendingDelete?.label ?? ''}" will be permanently removed. Any tournament still using it will fall back to a plain background.`}
        isBusy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
