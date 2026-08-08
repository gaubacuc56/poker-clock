import { useEffect, useRef, useState } from 'react';
import { useBackgroundStore } from '@composition/container';
import type { Background } from '@domain/entities';
import Screen from '../../components/layout/Screen';
import TopBar, { BackLink } from '../../components/layout/TopBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import Spinner from '../../components/Spinner';
import { TrashIcon, UploadIcon } from '../../components/icons';

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
    <Screen>
      <TopBar>
        <BackLink to="/settings" label="Back to settings" />
        <h1 className="text-[22px]">Projector backgrounds</h1>
        <button
          type="button"
          className="btn btn-primary ml-auto"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Spinner /> : <UploadIcon className="size-[17px]" />}
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>
      </TopBar>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="scroll felt px-4 py-3.5">
        <div className="content">
          {error && <p className="mb-3 text-[18px] text-coral">{error}</p>}

          {isLoaded && backgrounds.length === 0 ? (
            <p className="px-2 py-10 text-center text-[16px] text-faint">
              No backgrounds yet. Upload one to get started.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-2.5">
              {backgrounds.map((background) => (
                <div
                  key={background.id}
                  className="relative overflow-hidden rounded-2xl bg-surface-2 shadow-lift-sm"
                >
                  <img
                    src={background.path}
                    alt={background.label}
                    className="aspect-[16/10] w-full object-cover opacity-85"
                  />
                  <div className="truncate px-2.5 py-[7px] text-[14px] text-muted">
                    {background.label}
                  </div>
                  <button
                    type="button"
                    className="btn btn-icon absolute top-1.5 right-1.5 size-[30px] bg-base-deep/80 text-coral"
                    title={`Delete ${background.label}`}
                    aria-label={`Delete ${background.label}`}
                    onClick={() => setPendingDelete(background)}
                  >
                    <TrashIcon className="size-[15px]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete background?"
        message={`Tournaments still using “${pendingDelete?.label ?? ''}” fall back to a plain background.`}
        isBusy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}
