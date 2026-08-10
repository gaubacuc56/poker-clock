import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTournamentStore, useCurrencyStore, useBackgroundStore } from '@composition/container';
import { createDefaultBlindLevels } from '@domain/rules/presets/blindStructures';
import { renumberLevels } from '@domain/rules/blindStructureEditor';
import { createDefaultPayoutTiers } from '@domain/rules/presets/payoutStructures';
import { getEntryPriceLines } from '@domain/rules/entryPricing';
import { toCents } from '@domain/rules/money';
import { validateRebuyAddOnPrices } from '@domain/rules/tournamentValidation';
import {
  createEmptyDraft,
  draftFromTournament,
  draftGuaranteeCents,
  draftToTournament,
  type TournamentDraft,
} from '@domain/rules/tournamentDraft';
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

export default function SetupWizardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useTournamentStore((state) => (id ? state.getById(id) : undefined));
  const saveTournament = useTournamentStore((state) => state.save);
  const currencies = useCurrencyStore((state) => state.currencies);
  const backgroundOptions = useBackgroundStore((state) => state.backgrounds);

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

  // Once the DB-driven currency list loads, snap a new tournament's default onto a real code.
  useEffect(() => {
    if (existing || currencies.length === 0) return;
    setDraft((d) =>
      currencies.some((c) => c.code === d.currency) ? d : { ...d, currency: currencies[0].code },
    );
  }, [existing, currencies]);

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

  // Seed the editable payout tiers once: from the tournament's existing structure, or a default split.
  useEffect(() => {
    if (customTiers.length > 0) return;
    setCustomTiers(
      existing ? existing.payoutTiers.map((tier) => ({ ...tier })) : createDefaultPayoutTiers(),
    );
  }, [existing, customTiers.length]);

  function update<K extends keyof TournamentDraft>(key: K, value: TournamentDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function updateSound(key: keyof SoundSettings, value: SoundId) {
    setDraft((d) => ({ ...d, sounds: { ...d.sounds, [key]: value } }));
  }

  const rebuyAddOnPriceError = validateRebuyAddOnPrices({
    allowRebuy: draft.allowRebuy,
    rebuyPrice: Number(draft.rebuyPrice),
    allowAddOn: draft.allowAddOn,
    addOnPrice: Number(draft.addOnPrice),
  });

  async function handleFinish() {
    if (rebuyAddOnPriceError) {
      setStep(STEP_INDEX.basics);
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
    } finally {
      setIsSaving(false);
    }
  }

  // A payout total that doesn't match the guarantee is surfaced as a warning in
  // the editor, not a block — some tournaments intentionally pay out something
  // other than the advertised guarantee.
  const canAdvance = step !== STEP_INDEX.basics || !rebuyAddOnPriceError;

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
          {step === STEP_INDEX.basics && (
            <BasicsStep draft={draft} currencies={currencies} onChange={update} />
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
                guaranteedPrizePoolCents={draftGuaranteeCents(draft)}
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
        canSave={!rebuyAddOnPriceError}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(LAST_STEP, s + 1))}
        onFinish={handleFinish}
      />
    </Screen>
  );
}
