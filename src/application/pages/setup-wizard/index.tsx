import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useTournamentStore,
  useCurrencyStore,
  useBackgroundStore,
  usePlanStore,
  useToast,
} from '@composition/container';
import { createDefaultBlindLevels } from '@domain/rules/presets/blindStructures';
import { renumberLevels } from '@domain/rules/blindStructureEditor';
import { createDefaultPayoutTiers } from '@domain/rules/presets/payoutStructures';
import { getEntryPriceLines } from '@domain/rules/entryPricing';
import { toCents } from '@domain/rules/money';
import { validateRebuyAddOnPrices } from '@domain/rules/tournamentValidation';
import { scheduleLocalToIso, validateSchedule } from '@domain/rules/tournamentSchedule';
import { hasTournamentStarted } from '@domain/rules/tournamentLifecycle';
import {
  createEmptyDraft,
  draftFromTournament,
  draftGuaranteeCents,
  draftToTournament,
  type TournamentDraft,
} from '@domain/rules/tournamentDraft';
import { planLimitMessage } from '@domain/rules/planLimits';
import type { BlindLevel, PayoutTier, PayoutUnit, SoundId, SoundSettings } from '@domain/entities';
import BlindLevelsTable from '@application/components/shared/BlindLevelsTable';
import BlindStructureImport from '@application/components/shared/BlindStructureImport';
import PayoutStructureEditor from '@application/components/shared/PayoutStructureEditor';
import Screen from '@application/components/template/Screen';
import TopBar from '@application/components/template/TopBar';
import BackLink from '@application/components/template/TopBar/sections/BackLink';
import { LAST_STEP, STEP_INDEX } from './constants';
import StepRail from './sections/StepRail';
import BasicsStep from './sections/BasicsStep';
import ProjectorStep from './sections/ProjectorStep';
import SoundsStep from './sections/SoundsStep';
import ReviewStep from './sections/ReviewStep';
import WizardFooter from './sections/WizardFooter';
import Toast from '@application/components/ui/Toast';

export default function SetupWizardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useTournamentStore((state) => (id ? state.getById(id) : undefined));
  const saveTournament = useTournamentStore((state) => state.save);
  const currencies = useCurrencyStore((state) => state.currencies);
  const backgroundOptions = useBackgroundStore((state) => state.backgrounds);
  const tournaments = useTournamentStore((state) => state.tournaments);
  const plan = usePlanStore((state) => state.plan);
  const loadTournaments = useTournamentStore((state) => state.load);
  const loadCurrencies = useCurrencyStore((state) => state.load);
  const loadBackgrounds = useBackgroundStore((state) => state.load);
  const loadPlan = usePlanStore((state) => state.load);
  const { toastMessage, showToast } = useToast();

  // The wizard is the one screen that genuinely needs all four: the tournament
  // being edited, the unit picker, the background picker, and the allowance that
  // decides whether a new tournament may be saved at all.
  useEffect(() => {
    void loadTournaments();
    void loadCurrencies();
    void loadBackgrounds();
    void loadPlan();
  }, [loadTournaments, loadCurrencies, loadBackgrounds, loadPlan]);

  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<TournamentDraft>(createEmptyDraft);
  const [customLevels, setCustomLevels] = useState<BlindLevel[]>([]);
  const [customTiers, setCustomTiers] = useState<PayoutTier[]>([]);
  const [payoutUnit, setPayoutUnit] = useState<PayoutUnit>('percentage');

  useEffect(() => {
    if (!existing) return;
    setDraft(draftFromTournament(existing));
    setPayoutUnit(existing.payoutUnit ?? 'percentage');
  }, [existing]);

  // Once the DB-driven currency list loads, snap the draft onto a real code.
  //
  // This runs for a saved tournament too, not just a new one. A `<select>` whose
  // value matches none of its options displays the first one instead, so a
  // tournament priced in a unit that has since been retired showed the Basics
  // step one unit while every other step — the payouts editor's amount toggle,
  // the review lines — printed the retired code the draft still held. The picker
  // is the tournament's unit, so the draft is made to agree with it.
  useEffect(() => {
    if (currencies.length === 0) return;
    setDraft((d) =>
      currencies.some((c) => c.code === d.currency) ? d : { ...d, currency: currencies[0].code },
    );
    // `existing` is a dependency because loading a tournament rewrites the whole
    // draft: without it, a snap that happened before the row arrived would be
    // undone by the reload and never run again.
  }, [currencies, existing]);

  // Same for backgrounds: the initial placeholder isn't a real id, so snap a new
  // tournament onto the first available background — that way it's actually
  // previewed and saved, not left unselected.
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

  // Seed the editable payout tiers once per tournament: from its saved structure,
  // or a default split for a new one.
  //
  // Keyed on which tournament has been seeded, not on the list being empty — an
  // empty list is a legitimate state (no payouts, or the operator just reset
  // them), and re-seeding on it put the saved places straight back on screen.
  const seededTiersFor = useRef<string | null>(null);

  useEffect(() => {
    const key = existing?.id ?? 'new';
    if (seededTiersFor.current === key) return;
    seededTiersFor.current = key;
    setCustomTiers(
      existing ? existing.payoutTiers.map((tier) => ({ ...tier })) : createDefaultPayoutTiers(),
    );
  }, [existing]);

  /**
   * Empties the saved payout structure, not just the form. Only the payout
   * columns are written — the rest of the draft may be half-typed, and a reset
   * of the payouts is not a save of everything else.
   */
  async function handleResetPayouts(): Promise<string | null> {
    if (!existing) return null;
    try {
      await saveTournament({ ...existing, payoutTiers: [], payoutUnit: undefined });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not reset the payouts.';
    }
  }

  function update<K extends keyof TournamentDraft>(key: K, value: TournamentDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function updateSound(key: keyof SoundSettings, value: SoundId) {
    setDraft((d) => ({ ...d, sounds: { ...d.sounds, [key]: value } }));
  }

  const basicsError =
    validateRebuyAddOnPrices({
      allowRebuy: draft.allowRebuy,
      rebuyPrice: Number(draft.rebuyPrice),
      allowAddOn: draft.allowAddOn,
      addOnPrice: Number(draft.addOnPrice),
    }) ??
    validateSchedule({
      scheduleRepeat: draft.scheduleRepeat,
      tournamentStartAt: scheduleLocalToIso(draft.tournamentStart),
      scheduleWeekdays: draft.scheduleWeekdays,
      startTime: draft.startTime,
    });

  // Only a new tournament counts against the allowance — editing one the account
  // already has doesn't add to the total, however full the plan is.
  const planError = existing
    ? null
    : planLimitMessage(plan, 'tournaments', tournaments.length);

  async function handleFinish() {
    if (basicsError) {
      setStep(STEP_INDEX.basics);
      return;
    }
    if (planError) {
      showToast(planError);
      return;
    }
    const tournament = draftToTournament(
      draft,
      { blindLevels: customLevels, payoutTiers: customTiers, payoutUnit },
      existing,
      () => crypto.randomUUID(),
      () => new Date().toISOString(),
    );
    setIsSaving(true);
    try {
      await saveTournament(tournament);
      navigate(`/tournament/${tournament.id}/control`);
    } catch (error) {
      // The plan limits are enforced by database triggers, so a save can be
      // refused for a reason the form had no way to see — a second browser
      // having used the last slot, say. Whatever it says, the operator is the
      // one who needs to read it.
      showToast(error instanceof Error ? error.message : 'Could not save the tournament.');
    } finally {
      setIsSaving(false);
    }
  }

  // A payout total that doesn't match the guarantee is surfaced as a warning in
  // the editor, not a block — some tournaments intentionally pay out something
  // other than the advertised guarantee.
  const canAdvance = step !== STEP_INDEX.basics || !basicsError;

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

      <StepRail step={step} onStepChange={setStep} />

      <div className="scroll felt px-4 pt-4 pb-6">
        <div className="content">
          {planError && (
            <p className="mb-3 text-[18px] text-coral">{planError}</p>
          )}

          {step === STEP_INDEX.basics && (
            <BasicsStep
              draft={draft}
              currencies={currencies}
              // Only a dated schedule locks once the clock has run: it describes
              // an evening that has happened. A weekly one describes the
              // arrangement, which stays editable mid-run — otherwise setting it
              // up once, the whole point, would be impossible to correct.
              scheduleLocked={
                draft.scheduleRepeat === 'once' &&
                !!existing &&
                hasTournamentStarted(existing.status)
              }
              onChange={update}
            />
          )}

          {step === STEP_INDEX.blinds && (
            <div className="flex flex-col gap-3.5">
              <BlindStructureImport
                levels={customLevels}
                onImport={setCustomLevels}
                tournamentName={draft.name}
              />
              <BlindLevelsTable levels={customLevels} editable onChange={setCustomLevels} />
            </div>
          )}

          {step === STEP_INDEX.payouts && (
            <div className="flex flex-col gap-2.5">
              <PayoutStructureEditor
                tiers={customTiers}
                unit={payoutUnit}
                onUnitChange={setPayoutUnit}
                onChange={setCustomTiers}
                currency={draft.currency}
                guaranteedPrizePoolCents={draftGuaranteeCents(draft)}
                onReset={existing ? handleResetPayouts : undefined}
              />
            </div>
          )}

          {step === STEP_INDEX.projector && (
            <ProjectorStep
              backgroundId={draft.projectorBackgroundId}
              layout={draft.projectorLayout}
              backgrounds={backgroundOptions}
              onBackgroundChange={(backgroundId) => update('projectorBackgroundId', backgroundId)}
              onLayoutChange={(layout) => update('projectorLayout', layout)}
            />
          )}

          {step === STEP_INDEX.sounds && <SoundsStep sounds={draft.sounds} onChange={updateSound} />}

          {step === STEP_INDEX.review && (
            <ReviewStep
              draft={draft}
              structures={{ blindLevels: customLevels, payoutTiers: customTiers }}
              entryPriceLines={getEntryPriceLines({
                buyIn: toCents(Number(draft.buyIn)),
                allowRebuy: draft.allowRebuy,
                rebuyPrice: toCents(Number(draft.rebuyPrice)),
                allowAddOn: draft.allowAddOn,
                addOnPrice: toCents(Number(draft.addOnPrice)),
              })}
              joinCode={existing?.joinCode}
            />
          )}
        </div>
      </div>

      <WizardFooter
        step={step}
        isEditing={Boolean(existing)}
        isSaving={isSaving}
        canAdvance={canAdvance}
        canSave={!basicsError && !planError}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(LAST_STEP, s + 1))}
        onFinish={handleFinish}
      />

      <Toast message={toastMessage} />
    </Screen>
  );
}
