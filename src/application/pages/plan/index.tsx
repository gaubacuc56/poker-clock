import { Fragment, useEffect } from 'react';
import {
  useBackgroundStore,
  usePlanStore,
  useTournamentStore,
} from '@composition/container';
import {
  countPlanUsage,
  effectivePlanCode,
  planLimit,
  planPeriodRows,
  type PlanLimitKind,
} from '@domain/rules/planLimits';
import PlanEndingNotice from '@application/components/shared/PlanEndingNotice';
import Screen from '@application/components/template/Screen';
import TopBar from '@application/components/template/TopBar';
import BackLink from '@application/components/template/TopBar/sections/BackLink';
import { WarningIcon } from '@application/components/ui/icons';
import AllowanceRow from './sections/AllowanceRow';

const ALLOWANCES: { kind: PlanLimitKind; label: string }[] = [
  { kind: 'tournaments', label: 'Tournaments' },
  { kind: 'runningTournaments', label: 'Running at once' },
  { kind: 'backgrounds', label: 'Projector backgrounds' },
];

/**
 * The account's plan, on its own screen beside Profile and Backgrounds.
 *
 * Every allowance is shown against what has actually been used, because a number
 * on its own doesn't answer the question an organiser is here to ask — which is
 * never "what is my limit" but "have I got room for one more".
 */
export default function PlanPage() {
  const plan = usePlanStore((state) => state.plan);
  const isLoaded = usePlanStore((state) => state.isLoaded);
  const loadPlan = usePlanStore((state) => state.load);

  const tournaments = useTournamentStore((state) => state.tournaments);
  const loadTournaments = useTournamentStore((state) => state.load);
  const backgrounds = useBackgroundStore((state) => state.backgrounds);
  const loadBackgrounds = useBackgroundStore((state) => state.load);

  useEffect(() => {
    void loadPlan();
    void loadTournaments();
    void loadBackgrounds();
  }, [loadPlan, loadTournaments, loadBackgrounds]);

  const usage = countPlanUsage(
    tournaments.map((tournament) => tournament.status),
    backgrounds.length,
  );

  const hasLapsed = Boolean(plan && plan.planCode && !plan.isActive);

  return (
    <Screen>
      <TopBar>
        <BackLink to="/settings" label="Back to settings" />
      </TopBar>

      <div className="scroll felt px-4 py-3.5">
        <div className="content flex flex-col gap-3">
          {!isLoaded ? (
            <p className="px-2 py-10 text-center text-[16px] text-faint">Loading…</p>
          ) : (
            <>
              <div className="card gap-1">
                <span className="kicker">Current plan</span>
                <span className="engrave display text-[34px] leading-[1.1] text-accent">
                  {effectivePlanCode(plan)}
                </span>
                <div className="mt-0.5 grid grid-cols-[max-content_auto] gap-x-2 gap-y-0.5">
                  {planPeriodRows(plan).map(({ label, value }) => (
                    <Fragment key={label}>
                      <span className="text-[17px] text-muted">{label}:</span>
                      <span className="text-[17px] tabular-nums text-fg">{value}</span>
                    </Fragment>
                  ))}
                </div>

                {hasLapsed && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[17px] text-coral">
                    <WarningIcon className="mt-1 size-[15px] shrink-0" />
                    {plan?.planCode} is not in force today — you are on{' '}
                    {effectivePlanCode(plan)} allowances until it is renewed.
                  </p>
                )}
              </div>

              <PlanEndingNotice />

              <div className="card gap-3.5">
                <span className="kicker">Allowances</span>
                {ALLOWANCES.map(({ kind, label }) => (
                  <AllowanceRow
                    key={kind}
                    label={label}
                    limit={planLimit(plan, kind)}
                    used={usage[kind]}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Screen>
  );
}
