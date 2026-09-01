import { useEffect, useState } from "react";
import { useCurrencyStore, useToast } from "@composition/container";
import type { Currency } from "@domain/entities";
import {
  normalizeUnitCode,
  sortUnits,
  UNIT_CODE_MAX_LENGTH,
  validateUnitCode,
} from "@domain/rules/currencyUnit";
import Screen from "@application/components/template/Screen";
import TopBar from "@application/components/template/TopBar";
import BackLink from "@application/components/template/TopBar/sections/BackLink";
import ConfirmDialog from "@application/components/ui/ConfirmDialog";
import Spinner from "@application/components/ui/Spinner";
import Toast from "@application/components/ui/Toast";
import {
  PlusIcon,
  TrashIcon,
  WarningIcon,
} from "@application/components/ui/icons";

/**
 * The units a tournament can be priced in.
 *
 * Two groups, and the difference between them is the whole screen: VND and USD
 * are standard and every account has them, and anything below that line the
 * account made for itself and can remove. A club that plays for chips, tickets
 * or house keys writes that down here rather than asking for a code change.
 */
export default function UnitsPage() {
  const currencies = useCurrencyStore((state) => state.currencies);
  const loadCurrencies = useCurrencyStore((state) => state.load);
  const isSaving = useCurrencyStore((state) => state.isSaving);
  const createUnit = useCurrencyStore((state) => state.create);
  const removeUnit = useCurrencyStore((state) => state.remove);
  const { toastMessage, showToast } = useToast();

  useEffect(() => {
    void loadCurrencies();
  }, [loadCurrencies]);

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Currency | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sorted = sortUnits(currencies);
  const standard = sorted.filter((currency) => !currency.ownerId);
  const custom = sorted.filter((currency) => currency.ownerId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const message = validateUnitCode(name, currencies);
    setError(message);
    if (message) return;

    // The repository normalizes again before the insert — this copy is only so
    // the toast says the same word the list is about to show.
    const unitCode = normalizeUnitCode(name);
    const failure = await createUnit(name);
    if (failure) {
      setError(failure);
      return;
    }
    setName("");
    showToast(`Added ${unitCode}.`);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    const failure = await removeUnit(pendingDelete.id);
    setIsDeleting(false);
    showToast(failure ?? `Removed ${pendingDelete.code}.`);
    setPendingDelete(null);
  }

  return (
    <Screen>
      <TopBar>
        <BackLink to="/settings" label="Back to settings" />
        <h1 className="text-[22px]">Units</h1>
      </TopBar>

      <div className="scroll felt px-4 py-3.5">
        <div className="content flex flex-col gap-3">
          <div className="card gap-2">
            <span className="kicker">Default units</span>
            {standard.map((currency) => (
              <div
                key={currency.id}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="engrave display text-[20px]">
                  {currency.code}
                </span>
              </div>
            ))}
          </div>

          <div className="card gap-2.5">
            <span className="kicker">Your units</span>
            {custom.length === 0 ? (
              <p className="text-[16px] text-faint italic">Empty </p>
            ) : (
              custom.map((currency) => (
                <div
                  key={currency.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="engrave display block text-[20px]">
                      {currency.code}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-icon btn-danger-quiet size-[34px]"
                    title={`Remove ${currency.code}`}
                    aria-label={`Remove ${currency.code}`}
                    onClick={() => setPendingDelete(currency)}
                  >
                    <TrashIcon className="size-[15px]" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="card gap-2.5">
            <span className="kicker">Add a unit</span>
            <label className="block min-w-0">
              <span className="field-label">Name</span>
              <input
                className="input uppercase"
                value={name}
                maxLength={UNIT_CODE_MAX_LENGTH}
                placeholder="CHIPS"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
              />
            </label>

            {error && (
              <p className="flex items-center gap-1.5 text-[18px] text-coral">
                <WarningIcon className="size-[15px] shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary h-10 self-start"
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? <Spinner /> : <PlusIcon className="size-[17px]" />}
              Add unit
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove unit?"
        message={`Tournaments already priced in ${pendingDelete?.code ?? ""} keep showing it, but you won't be able to pick it again.`}
        confirmLabel="Remove"
        isBusy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <Toast message={toastMessage} />
    </Screen>
  );
}
