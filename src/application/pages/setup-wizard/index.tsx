import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useTournamentStore,
  useCurrencyStore,
  useBackgroundStore,
} from '@composition/container';
import { createDefaultBlindLevels } from '@domain/rules/presets/blindStructures';
import { normalizeBlindLevels, renumberLevels } from '@domain/rules/blindStructureEditor';
import { createDefaultPayoutTiers } from '@domain/rules/presets/payoutStructures';
import { formatNumber } from '@domain/rules/format';
import { fromCents, toCents } from '@domain/rules/money';
import { getPayoutTotals } from '@domain/rules/payouts';
import { validateRebuyAddOnPrices } from '@domain/rules/tournamentValidation';
import { DEFAULT_ENTRANT_COUNT } from '@domain/rules/tournamentLifecycle';
import BlindLevelsTable from '../../components/setup/BlindLevelsTable';
import PayoutStructureEditor from '../../components/payouts/PayoutStructureEditor';
import TournamentSidebar from '../../components/layout/TournamentSidebar';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/Spinner';
import {
  DEFAULT_SOUND_SETTINGS,
  type BlindLevel,
  type CurrencyUnit,
  type PayoutTier,
  type PayoutUnit,
  type SoundId,
  type SoundSettings,
  type TournamentConfig,
} from '@domain/entities';
import Field from './sections/Field';
import Checkbox from './sections/Checkbox';
import SoundField from './sections/SoundField';

interface DraftTournament {
  name: string;
  buyIn: string;
  fee: string;
  currency: CurrencyUnit;
  allowRebuy: boolean;
  allowAddOn: boolean;
  rebuyPrice: string;
  addOnPrice: string;
  startingStack: string;
  maxPlayersPerTable: string;
  entrantCount: string;
  lateRegLevel: string;
  guaranteedPrizePool: string;
  sounds: SoundSettings;
  projectorBackgroundId: string;
}

const SOUND_TRIGGERS: { key: keyof SoundSettings; label: string }[] = [
  { key: 'nextLevel', label: 'Next level' },
  { key: 'breakStart', label: 'Break start' },
  { key: 'breakEnd', label: 'Break end' },
  { key: 'warning5s', label: 'Next level in 5s' },
  { key: 'warning10s', label: 'Next level in 10s' },
  { key: 'warning30s', label: 'Next level in 30s' },
  { key: 'warning60s', label: 'Next level in 60s' },
];

const STEPS = ['Basics', 'Stack', 'Blinds', 'Payouts', 'Sounds', 'Review'];

export default function SetupWizardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useTournamentStore((state) =>
    id ? state.getById(id) : undefined,
  );
  const saveTournament = useTournamentStore((state) => state.save);
  const currencies = useCurrencyStore((state) => state.currencies);
  const backgroundOptions = useBackgroundStore((state) => state.backgrounds);

  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<DraftTournament>({
    name: '',
    buyIn: '20',
    fee: '0',
    currency: 'USD',
    allowRebuy: false,
    allowAddOn: false,
    rebuyPrice: '20',
    addOnPrice: '20',
    startingStack: '10000',
    maxPlayersPerTable: '9',
    entrantCount: String(DEFAULT_ENTRANT_COUNT),
    lateRegLevel: '4',
    guaranteedPrizePool: '',
    sounds: { ...DEFAULT_SOUND_SETTINGS },
    projectorBackgroundId: 'default',
  });
  const [customLevels, setCustomLevels] = useState<BlindLevel[]>([]);
  const [customTiers, setCustomTiers] = useState<PayoutTier[]>([]);
  const [payoutUnit, setPayoutUnit] = useState<PayoutUnit>('percentage');

  useEffect(() => {
    if (!existing) return;
    setDraft({
      name: existing.name,
      buyIn: String(fromCents(existing.buyIn)),
      fee: String(fromCents(existing.fee)),
      currency: existing.currency ?? 'USD',
      allowRebuy: existing.allowRebuy,
      allowAddOn: existing.allowAddOn,
      rebuyPrice: String(fromCents(existing.rebuyPrice ?? existing.buyIn)),
      addOnPrice: String(fromCents(existing.addOnPrice ?? existing.buyIn)),
      startingStack: String(existing.startingStack),
      maxPlayersPerTable: String(existing.maxPlayersPerTable),
      entrantCount: String(existing.entrantCount),
      lateRegLevel: String(existing.lateRegLevel),
      guaranteedPrizePool: existing.guaranteedPrizePool
        ? String(fromCents(existing.guaranteedPrizePool))
        : '',
      sounds: { ...DEFAULT_SOUND_SETTINGS, ...existing.sounds },
      projectorBackgroundId: existing.projectorBackgroundId || 'default',
    });
    setPayoutUnit(existing.payoutUnit ?? 'percentage');
  }, [existing]);

  // Once the DB-driven currency list loads, snap a new tournament's default onto a real code.
  useEffect(() => {
    if (existing || currencies.length === 0) return;
    setDraft((d) =>
      currencies.some((c) => c.code === d.currency)
        ? d
        : { ...d, currency: currencies[0].code },
    );
  }, [existing, currencies]);

  // Same for backgrounds: the initial 'default' placeholder isn't a real id, so
  // snap a new tournament onto the first available background — that way it's
  // actually previewed and saved, not left unselected.
  useEffect(() => {
    if (existing || backgroundOptions.length === 0) return;
    setDraft((d) =>
      backgroundOptions.some((b) => b.id === d.projectorBackgroundId)
        ? d
        : { ...d, projectorBackgroundId: backgroundOptions[0].id },
    );
  }, [existing, backgroundOptions]);

  // Seed the editable blind levels once: from the tournament's existing structure, or a default template.
  useEffect(() => {
    if (customLevels.length > 0) return;
    if (existing) {
      // Renumber on load so structures saved before breaks stopped counting as
      // levels get corrected numbering as soon as they're opened.
      setCustomLevels(renumberLevels(existing.blindLevels.map((level) => ({ ...level }))));
    } else {
      setCustomLevels(createDefaultBlindLevels());
    }
  }, [existing, customLevels.length]);

  // Seed the editable payout tiers once: from the tournament's existing structure, or a default split.
  useEffect(() => {
    if (customTiers.length > 0) return;
    if (existing) {
      setCustomTiers(existing.payoutTiers.map((tier) => ({ ...tier })));
    } else {
      setCustomTiers(createDefaultPayoutTiers());
    }
  }, [existing, customTiers.length]);

  function update<K extends keyof DraftTournament>(
    key: K,
    value: DraftTournament[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function updateSound(key: keyof SoundSettings, value: SoundId) {
    setDraft((d) => ({ ...d, sounds: { ...d.sounds, [key]: value } }));
  }

  const guaranteedPrizePoolCents = draft.guaranteedPrizePool
    ? toCents(Number(draft.guaranteedPrizePool))
    : 0;
  const { isValid: payoutValid } = getPayoutTotals(customTiers, payoutUnit, guaranteedPrizePoolCents);
  const rebuyAddOnPriceError = validateRebuyAddOnPrices({
    allowRebuy: draft.allowRebuy,
    rebuyPrice: Number(draft.rebuyPrice),
    allowAddOn: draft.allowAddOn,
    addOnPrice: Number(draft.addOnPrice),
  });
  const rebuyPriceValid = !draft.allowRebuy || Number(draft.rebuyPrice) > 0;
  const addOnPriceValid = !draft.allowAddOn || Number(draft.addOnPrice) > 0;

  async function handleFinish() {
    if (rebuyAddOnPriceError) {
      setStep(1);
      return;
    }
    if (!payoutValid) {
      setStep(3);
      return;
    }
    const tournament: TournamentConfig = {
      id: existing?.id ?? crypto.randomUUID(),
      joinCode: existing?.joinCode,
      name: draft.name || 'Untitled Tournament',
      buyIn: toCents(Number(draft.buyIn)),
      fee: toCents(Number(draft.fee)),
      currency: draft.currency,
      startingStack: Number(draft.startingStack),
      maxPlayersPerTable: Number(draft.maxPlayersPerTable),
      entrantCount: Number(draft.entrantCount),
      eliminatedCount: existing?.eliminatedCount ?? 0,
      rebuyCount: existing?.rebuyCount ?? 0,
      addOnCount: existing?.addOnCount ?? 0,
      lateRegLevel: Number(draft.lateRegLevel),
      allowRebuy: draft.allowRebuy,
      allowAddOn: draft.allowAddOn,
      rebuyPrice: draft.allowRebuy ? toCents(Number(draft.rebuyPrice)) : undefined,
      addOnPrice: draft.allowAddOn ? toCents(Number(draft.addOnPrice)) : undefined,
      guaranteedPrizePool: draft.guaranteedPrizePool
        ? toCents(Number(draft.guaranteedPrizePool))
        : undefined,
      blindLevels: normalizeBlindLevels(customLevels),
      payoutTiers: customTiers,
      payoutUnit,
      sounds: draft.sounds,
      projectorBackgroundId: draft.projectorBackgroundId || undefined,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      status: existing?.status ?? 'setup',
    };
    setIsSaving(true);
    try {
      await saveTournament(tournament);
      navigate(`/tournament/${tournament.id}/control`);
    } finally {
      setIsSaving(false);
    }
  }

  const canAdvance = (step !== 1 || !rebuyAddOnPriceError) && (step !== 3 || payoutValid);
  const canSave = !rebuyAddOnPriceError && payoutValid;

  return (
    <div className="flex h-screen overflow-hidden bg-themed-primary text-themed-primary">
      {id && <TournamentSidebar tournamentId={id} />}

      <div className={`flex flex-1 flex-col ${id ? 'pb-16 md:pb-0' : ''}`}>
        <PageHeader />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold">
          {existing ? 'Edit Tournament' : 'New Tournament'}
        </h1>

        <ol className="mb-8 flex gap-2 overflow-x-auto text-sm text-themed-muted">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={`flex-none whitespace-nowrap border-b-2 px-1 pb-2 sm:flex-1 sm:text-center ${
                index === step
                  ? 'border-accent text-accent'
                  : 'border-themed'
              }`}
            >
              <button
                type="button"
                className="w-full cursor-pointer bg-transparent text-inherit"
                onClick={() => setStep(index)}
              >
                {label}
              </button>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <Field label="Tournament name">
              <input
                className="input"
                value={draft.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Friday Night Poker"
              />
            </Field>
            <Field label="Projector background">
              <select
                className="input"
                value={draft.projectorBackgroundId}
                onChange={(e) => update('projectorBackgroundId', e.target.value)}
              >
                {backgroundOptions.map((background) => (
                  <option key={background.id} value={background.id}>
                    {background.label}
                  </option>
                ))}
              </select>
              {backgroundOptions.find((background) => background.id === draft.projectorBackgroundId) && (
                <img
                  src={
                    backgroundOptions.find(
                      (background) => background.id === draft.projectorBackgroundId,
                    )?.path
                  }
                  alt="Projector background preview"
                  className="mt-2 h-32 w-full rounded-lg border border-slate-700 object-cover"
                />
              )}
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field label="Currency / unit">
              <select
                className="input"
                value={draft.currency}
                onChange={(e) => update('currency', e.target.value as CurrencyUnit)}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Buy-in">
                <input
                  type="number"
                  className="input"
                  value={draft.buyIn}
                  onChange={(e) => update('buyIn', e.target.value)}
                />
              </Field>
              <Field label="Fee / rake">
                <input
                  type="number"
                  className="input"
                  value={draft.fee}
                  onChange={(e) => update('fee', e.target.value)}
                />
              </Field>
              <Field label="Starting stack">
                <input
                  type="number"
                  className="input"
                  value={draft.startingStack}
                  onChange={(e) => update('startingStack', e.target.value)}
                />
              </Field>
              <Field label="Max players / table">
                <input
                  type="number"
                  className="input"
                  value={draft.maxPlayersPerTable}
                  onChange={(e) => update('maxPlayersPerTable', e.target.value)}
                />
              </Field>
              <Field label="Late reg closes after level">
                <input
                  type="number"
                  className="input"
                  value={draft.lateRegLevel}
                  onChange={(e) => update('lateRegLevel', e.target.value)}
                />
              </Field>
              <Field label={`Guaranteed prize pool (${draft.currency}, optional)`}>
                <input
                  type="number"
                  className="input"
                  value={draft.guaranteedPrizePool}
                  onChange={(e) => update('guaranteedPrizePool', e.target.value)}
                />
              </Field>
            </div>

            <div className="space-y-3 pt-2">
              <Checkbox
                label="Allow rebuys"
                checked={draft.allowRebuy}
                onChange={(checked) => update('allowRebuy', checked)}
              />
              {draft.allowRebuy && (
                <Field label="Rebuy price">
                  <input
                    type="number"
                    className="input"
                    value={draft.rebuyPrice}
                    onChange={(e) => update('rebuyPrice', e.target.value)}
                  />
                  {!rebuyPriceValid && (
                    <p className="mt-1 text-sm text-red-400">
                      Rebuy price is required and must be greater than 0.
                    </p>
                  )}
                </Field>
              )}
              <Checkbox
                label="Allow add-ons"
                checked={draft.allowAddOn}
                onChange={(checked) => update('allowAddOn', checked)}
              />
              {draft.allowAddOn && (
                <Field label="Add-on price">
                  <input
                    type="number"
                    className="input"
                    value={draft.addOnPrice}
                    onChange={(e) => update('addOnPrice', e.target.value)}
                  />
                  {!addOnPriceValid && (
                    <p className="mt-1 text-sm text-red-400">
                      Add-on price is required and must be greater than 0.
                    </p>
                  )}
                </Field>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <BlindLevelsTable levels={customLevels} editable onChange={setCustomLevels} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-themed-muted">
              Customize the payout split — as a percentage of the pool, or as fixed{' '}
              {draft.currency} amounts that add up to the guaranteed prize pool.
            </p>
            <PayoutStructureEditor
              tiers={customTiers}
              unit={payoutUnit}
              onUnitChange={setPayoutUnit}
              onChange={setCustomTiers}
              currency={draft.currency}
              guaranteedPrizePoolCents={guaranteedPrizePoolCents}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-themed-muted">
              Pick a sound for each event — defaults to none.
            </p>
            <div className="space-y-3">
              {SOUND_TRIGGERS.map(({ key, label }) => (
                <SoundField
                  key={key}
                  label={label}
                  value={draft.sounds[key]}
                  onChange={(value) => updateSound(key, value)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-themed-muted">Name:</span> {draft.name}
            </p>
            <p>
              <span className="text-themed-muted">Buy-in:</span>{' '}
              {formatNumber(Number(draft.buyIn))} + {formatNumber(Number(draft.fee))} fee
            </p>
            <p>
              <span className="text-themed-muted">Entrants:</span>{' '}
              {formatNumber(Number(draft.entrantCount))}
            </p>
            <p>
              <span className="text-themed-muted">Rebuys / Add-ons:</span>{' '}
              {draft.allowRebuy ? `Rebuys (${formatNumber(Number(draft.rebuyPrice))})` : null}
              {draft.allowRebuy && draft.allowAddOn ? ', ' : null}
              {draft.allowAddOn ? `Add-ons (${formatNumber(Number(draft.addOnPrice))})` : null}
              {!draft.allowRebuy && !draft.allowAddOn ? 'None' : null}
            </p>
            <p>
              <span className="text-themed-muted">Blind levels:</span>{' '}
              {customLevels.length}
            </p>
            <p>
              <span className="text-themed-muted">Payout places:</span>{' '}
              {customTiers.length}
            </p>
            <p>
              <span className="text-themed-muted">Sounds configured:</span>{' '}
              {Object.values(draft.sounds).filter((s) => s !== 'none').length} of{' '}
              {SOUND_TRIGGERS.length}
            </p>
          </div>
        )}

        </div>
        </main>

        <div className="shrink-0 border-t border-themed bg-themed-secondary/80 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex max-w-2xl justify-between gap-3">
            <button
              type="button"
              className="btn-secondary"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </button>
            {existing ? (
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2"
                disabled={!canSave || isSaving}
                onClick={handleFinish}
              >
                {isSaving && <Spinner />}
                Save Changes
              </button>
            ) : step < STEPS.length - 1 ? (
              <button
                type="button"
                className="btn-primary"
                disabled={!canAdvance}
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2"
                disabled={isSaving}
                onClick={handleFinish}
              >
                {isSaving && <Spinner />}
                Create Tournament
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
