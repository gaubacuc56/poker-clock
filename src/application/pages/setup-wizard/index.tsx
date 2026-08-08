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
import { formatAmount, formatNumber } from '@domain/rules/format';
import { fromCents, toCents } from '@domain/rules/money';
import { getEntryPriceLines } from '@domain/rules/entryPricing';
import { validateRebuyAddOnPrices } from '@domain/rules/tournamentValidation';
import { DEFAULT_ENTRANT_COUNT } from '@domain/rules/tournamentLifecycle';
import BlindLevelsTable from '../../components/setup/BlindLevelsTable';
import BlindStructureImport from '../../components/setup/BlindStructureImport';
import PayoutStructureEditor from '../../components/payouts/PayoutStructureEditor';
import Screen from '../../components/layout/Screen';
import TopBar, { BackLink } from '../../components/layout/TopBar';
import Spinner from '../../components/Spinner';
import { WarningIcon } from '../../components/icons';
import {
  DEFAULT_SOUND_SETTINGS,
  type BlindLevel,
  type CurrencyUnit,
  type PayoutTier,
  type PayoutUnit,
  type ProjectorLayout,
  type SoundId,
  type SoundSettings,
  type TournamentConfig,
} from '@domain/entities';
import ProjectorLayoutPicker from './sections/ProjectorLayoutPicker';
import Field from './sections/Field';
import Switch from './sections/Switch';
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
  projectorLayout: ProjectorLayout;
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

const STEPS = ['Basics', 'Blinds', 'Payouts', 'Projector', 'Sounds', 'Review'];

export default function SetupWizardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useTournamentStore((state) => (id ? state.getById(id) : undefined));
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
    projectorLayout: 'classic',
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
      projectorLayout: existing.projectorLayout ?? 'classic',
    });
    setPayoutUnit(existing.payoutUnit ?? 'percentage');
  }, [existing]);

  // Once the DB-driven currency list loads, snap a new tournament's default onto a real code.
  useEffect(() => {
    if (existing || currencies.length === 0) return;
    setDraft((d) =>
      currencies.some((c) => c.code === d.currency) ? d : { ...d, currency: currencies[0].code },
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

  function update<K extends keyof DraftTournament>(key: K, value: DraftTournament[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function updateSound(key: keyof SoundSettings, value: SoundId) {
    setDraft((d) => ({ ...d, sounds: { ...d.sounds, [key]: value } }));
  }

  const guaranteedPrizePoolCents = draft.guaranteedPrizePool
    ? toCents(Number(draft.guaranteedPrizePool))
    : 0;
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
      setStep(0);
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
      projectorLayout: draft.projectorLayout,
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

  // A payout total that doesn't match the guarantee is surfaced as a warning in
  // the editor, not a block — some tournaments intentionally pay out something
  // other than the advertised guarantee.
  const canAdvance = step !== 0 || !rebuyAddOnPriceError;
  const canSave = !rebuyAddOnPriceError;

  const selectedBackground = backgroundOptions.find(
    (background) => background.id === draft.projectorBackgroundId,
  );
  const priceLine = getEntryPriceLines({
    buyIn: toCents(Number(draft.buyIn)),
    allowRebuy: draft.allowRebuy,
    rebuyPrice: toCents(Number(draft.rebuyPrice)),
    allowAddOn: draft.allowAddOn,
    addOnPrice: toCents(Number(draft.addOnPrice)),
  })
    .map((line) => `${line.label} ${formatAmount(line.amountCents)}`)
    .join(' · ');
  const breakCount = customLevels.filter((level) => level.isBreak).length;

  const review: { k: string; v: string }[] = [
    { k: 'Name', v: draft.name || 'Untitled Tournament' },
    {
      k: 'Buy-in + fee',
      v: `${formatNumber(Number(draft.buyIn))} + ${formatNumber(Number(draft.fee))} ${draft.currency}`,
    },
    { k: 'Entrants', v: formatNumber(Number(draft.entrantCount)) },
    {
      k: 'Rebuys',
      v: draft.allowRebuy ? `${formatNumber(Number(draft.rebuyPrice))} ${draft.currency}` : 'None',
    },
    {
      k: 'Add-ons',
      v: draft.allowAddOn ? `${formatNumber(Number(draft.addOnPrice))} ${draft.currency}` : 'None',
    },
    {
      k: 'Blind levels',
      v: `${customLevels.length - breakCount} levels · ${breakCount} breaks`,
    },
    { k: 'Payout places', v: String(customTiers.length) },
    {
      k: 'Sounds',
      v: `${Object.values(draft.sounds).filter((s) => s !== 'none').length} of ${
        SOUND_TRIGGERS.length
      } sounds configured`,
    },
  ];

  return (
    <Screen>
      <TopBar>
        {existing && id ? (
          <BackLink to={`/tournament/${id}/control`} label="Back to timer" />
        ) : (
          <BackLink to="/" label="Back to dashboard" glyph="home" />
        )}
        <h1 className="text-[22px]">{existing ? 'Edit tournament' : 'New tournament'}</h1>
      </TopBar>

      <nav
        className="scroll rail flex-none overflow-x-auto overflow-y-hidden px-3.5 pt-3 pb-2.5"
        aria-label="Setup steps"
      >
        {/* Sized to its steps rather than `content`'s full width, so a narrow
            phone still overflows the nav and scrolls sideways as before. */}
        <div className="mx-auto flex w-max max-w-3xl gap-0.5">
          {STEPS.map((label, index) => {
            const isActive = index === step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                aria-current={isActive ? 'step' : undefined}
                className="flex w-18 flex-none cursor-pointer flex-col items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] text-inherit"
              >
                <span
                  className={`chip size-8 text-[16px] ${isActive ? 'chip-gold' : 'chip-slate'}`}
                >
                  {index + 1}
                </span>
                <span
                  className={`text-[13px] tracking-[.08em] ${
                    isActive ? 'text-accent-lift' : 'text-faint'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="scroll felt px-4 pt-4 pb-6">
        <div className="content">
          {step === 0 && (
            <>
              {/* One field per row at every width — the basics step reads
                  top-to-bottom rather than wrapping into uneven columns. */}
              <div className="grid grid-cols-1 gap-3">
                <Field label="Tournament name">
                  <input
                    className="input h-[42px] text-[22px] text-fg-strong"
                    value={draft.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Friday Night Poker"
                  />
                </Field>
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
                <Field label="Buy-in">
                  <input
                    type="number"
                    className="input tabular-nums"
                    value={draft.buyIn}
                    onChange={(e) => update('buyIn', e.target.value)}
                  />
                </Field>
                <Field label="Fee / rake">
                  <input
                    type="number"
                    className="input tabular-nums"
                    value={draft.fee}
                    onChange={(e) => update('fee', e.target.value)}
                  />
                </Field>
                <Field label="Starting stack">
                  <input
                    type="number"
                    className="input tabular-nums"
                    value={draft.startingStack}
                    onChange={(e) => update('startingStack', e.target.value)}
                  />
                </Field>
                <Field label="Max players per table">
                  <input
                    type="number"
                    className="input tabular-nums"
                    value={draft.maxPlayersPerTable}
                    onChange={(e) => update('maxPlayersPerTable', e.target.value)}
                  />
                </Field>
                <Field label="Late reg closes after level">
                  <input
                    type="number"
                    className="input tabular-nums"
                    value={draft.lateRegLevel}
                    onChange={(e) => update('lateRegLevel', e.target.value)}
                  />
                </Field>
                <Field label={`Guaranteed prize pool (${draft.currency}, optional)`}>
                  <input
                    type="number"
                    className="input tabular-nums"
                    placeholder="—"
                    value={draft.guaranteedPrizePool}
                    onChange={(e) => update('guaranteedPrizePool', e.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="card gap-2.5">
                  <Switch
                    label="Allow rebuys"
                    checked={draft.allowRebuy}
                    onChange={(checked) => update('allowRebuy', checked)}
                  />
                  {draft.allowRebuy && (
                    <Field label="Rebuy price">
                      <input
                        type="number"
                        className={`input tabular-nums ${rebuyPriceValid ? '' : 'input-bad'}`}
                        value={draft.rebuyPrice}
                        onChange={(e) => update('rebuyPrice', e.target.value)}
                      />
                    </Field>
                  )}
                  {!rebuyPriceValid && (
                    <p className="flex gap-1.5 text-[18px] text-coral">
                      <WarningIcon className="size-[15px] shrink-0" />
                      Rebuy price must be greater than 0.
                    </p>
                  )}
                </div>

                <div className="card gap-2.5">
                  <Switch
                    label="Allow add-ons"
                    checked={draft.allowAddOn}
                    onChange={(checked) => update('allowAddOn', checked)}
                  />
                  {draft.allowAddOn && (
                    <Field label="Add-on price">
                      <input
                        type="number"
                        className={`input tabular-nums ${addOnPriceValid ? '' : 'input-bad'}`}
                        value={draft.addOnPrice}
                        onChange={(e) => update('addOnPrice', e.target.value)}
                      />
                    </Field>
                  )}
                  {!addOnPriceValid && (
                    <p className="flex gap-1.5 text-[18px] text-coral">
                      <WarningIcon className="size-[15px] shrink-0" />
                      Add-on price must be greater than 0.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3.5">
              <BlindStructureImport
                levels={customLevels}
                onImport={setCustomLevels}
                tournamentName={draft.name}
              />
              <BlindLevelsTable levels={customLevels} editable onChange={setCustomLevels} />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[16px] text-muted">
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

          {step === 3 && (
            <div className="flex flex-col gap-3.5">
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
              </Field>

              <div>
                <span className="field-label">Layout</span>
                <ProjectorLayoutPicker
                  value={draft.projectorLayout}
                  onChange={(layout) => update('projectorLayout', layout)}
                  tournamentName={draft.name}
                  currency={draft.currency}
                  buyIn={draft.buyIn}
                  startingStack={draft.startingStack}
                  entrantCount={draft.entrantCount}
                  levels={customLevels}
                  tiers={customTiers}
                  payoutUnit={payoutUnit}
                  backgroundPath={selectedBackground?.path}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-2">
              <p className="mb-1 text-[16px] text-muted">
                Pick a sound for each event — defaults to none.
              </p>
              {SOUND_TRIGGERS.map(({ key, label }) => (
                <SoundField
                  key={key}
                  label={label}
                  value={draft.sounds[key]}
                  onChange={(value) => updateSound(key, value)}
                />
              ))}
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="slab mb-[18px] flex flex-col rounded-[18px]">
                <div className="flex items-center gap-3.5 px-4 pt-4 pb-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] tracking-[.18em] uppercase text-accent">
                      Your tournament
                    </div>
                    <div className="engrave display mt-1 truncate text-[24px]">
                      {draft.name || 'Untitled Tournament'}
                    </div>
                    <div className="mt-0.5 text-[18px] text-faint">{priceLine}</div>
                  </div>
                  <div className="flex-none text-center">
                    <div className="kicker mb-1 text-[12px]">Join code</div>
                    <span className="plate text-[22px] text-accent-lift">
                      {existing?.joinCode ?? '—'}
                    </span>
                  </div>
                </div>
                <div className="mx-3 border-t border-dashed border-hair-strong" />
                <div className="flex h-[45px] items-center px-4 text-[14px] text-muted">
                  {existing?.joinCode
                    ? 'Players type this code on the TV to open the projector.'
                    : 'A join code is assigned as soon as the tournament is created.'}
                </div>
              </div>

              {review.map((row) => (
                <div
                  key={row.k}
                  className="flex justify-between gap-4 border-b border-hair px-0.5 py-[11px]"
                >
                  <span className="text-[16px] text-muted">{row.k}</span>
                  <span className="text-right text-[20px]">{row.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bar bar-bottom px-4 py-[11px]">
        <div className="content flex items-center gap-2.5">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          {existing ? (
            <button
              type="button"
              className="btn btn-primary ml-auto min-w-33"
              disabled={!canSave || isSaving}
              onClick={handleFinish}
            >
              {isSaving && <Spinner />}
              Save Changes
            </button>
          ) : step < STEPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary ml-auto min-w-33"
              disabled={!canAdvance}
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary ml-auto min-w-33"
              disabled={isSaving}
              onClick={handleFinish}
            >
              {isSaving && <Spinner />}
              Create Tournament
            </button>
          )}
        </div>
      </div>
    </Screen>
  );
}
