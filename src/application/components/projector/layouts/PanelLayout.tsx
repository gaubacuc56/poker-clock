import { formatMoney } from '@domain/rules/format';
import { pu } from '../../../shared/projectorScale';
import ClubLogo from '../ClubLogo';
import { buildProjectorModel } from '../projectorData';
import type { ProjectorViewProps } from '../ProjectorView';

/**
 * B · Panel — stat rows against hairlines on the left, the clock raised onto a
 * card in the centre with a gold seam across its top edge, payouts as a
 * place/amount ledger on the right.
 */
export default function PanelLayout(props: ProjectorViewProps) {
  const m = buildProjectorModel(props);
  const { tournamentName, currency, prizePool, isFinished = false } = props;

  return (
    <div
      className="absolute inset-0 grid"
      style={{
        gridTemplateColumns: 'minmax(0,24fr) minmax(0,52fr) minmax(0,24fr)',
        gap: pu(2),
        padding: `${pu(3.4)} ${pu(4)}`,
        color: 'var(--pj-ink)',
      }}
    >
      <div className="flex flex-col">
        <div className="flex items-center" style={{ height: pu(8) }}>
          <ClubLogo />
        </div>
        <div
          className="grid flex-1"
          style={{ gridTemplateRows: 'repeat(6,1fr)', gap: pu(0.6) }}
        >
          {m.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-baseline justify-between"
              style={{
                gap: pu(1),
                borderBottom: '1px solid var(--pj-hair)',
                paddingBottom: pu(0.6),
              }}
            >
              <span
                className="uppercase"
                style={{ fontSize: pu(1.5), letterSpacing: '.18em', color: 'var(--pj-faint)' }}
              >
                {stat.label}
              </span>
              <span
                className="display tabular-nums"
                style={{ fontSize: pu(2.8), fontWeight: 600 }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center" style={{ gap: pu(1.4) }}>
        <div className="flex items-baseline justify-between" style={{ gap: pu(2) }}>
          <span
            className="display min-w-0 truncate"
            style={{ fontSize: pu(3), fontWeight: 600 }}
          >
            {tournamentName}
          </span>
          <span style={{ fontSize: pu(1.5), color: 'var(--pj-dim)', letterSpacing: '.08em' }}>
            {m.priceLine}
          </span>
        </div>

        <div
          className="relative flex flex-col items-center"
          style={{
            borderRadius: pu(1.2),
            background: 'var(--pj-card)',
            boxShadow: '0 0 0 1px var(--pj-gold-dim), var(--pj-card-shadow)',
            padding: `${pu(3)} ${pu(3)} ${pu(2.6)}`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '18%',
              right: '18%',
              height: '2px',
              background: 'linear-gradient(to right,transparent,var(--pj-gold),transparent)',
            }}
          />
          <div
            className="uppercase"
            style={{ fontSize: pu(2.2), letterSpacing: '.2em', color: m.levelColor }}
          >
            {m.levelLabel}
          </div>
          {m.chipRaceLine && (
            <div
              className="uppercase"
              style={{
                fontSize: pu(1.7),
                letterSpacing: '.16em',
                color: 'var(--color-break)',
                marginTop: pu(0.5),
              }}
            >
              {m.chipRaceLine}
            </div>
          )}
          <div
            key={m.levelKey}
            className="display tabular-nums whitespace-nowrap"
            style={{
              fontSize: isFinished ? pu(6) : pu(13),
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: m.clockColor,
              margin: `${pu(0.6)} 0`,
              textShadow: m.clockShadow,
              animation: m.isLowTime ? 'cdpulse 1s ease-in-out infinite' : 'lvlin .5s ease',
            }}
          >
            {m.clockText}
          </div>
          {m.showBlinds && (
            <div className="flex" style={{ gap: pu(4), marginTop: pu(1.2) }}>
              <Cell label="BLINDS" value={m.blindsText} />
              <div style={{ width: '1px', background: 'var(--pj-hair-2)' }} />
              <Cell label="ANTE" value={m.blinds.ante} />
            </div>
          )}
        </div>

        <div
          className="text-center"
          style={{ fontSize: pu(1.7), color: 'var(--pj-dim)', letterSpacing: '.06em' }}
        >
          {m.nextText}
        </div>
      </div>

      <div className="flex flex-col justify-center" style={{ minWidth: pu(19) }}>
        <span
          className="uppercase"
          style={{ fontSize: pu(1.5), letterSpacing: '.2em', color: 'var(--pj-faint)' }}
        >
          Prize Pool
        </span>
        <div
          className="display tabular-nums"
          style={{ fontSize: pu(3.8), fontWeight: 600, color: 'var(--pj-gold)', lineHeight: 1.2 }}
        >
          {formatMoney(prizePool, currency)}
        </div>
        <div
          className="flex justify-between uppercase"
          style={{
            marginTop: pu(1.4),
            fontSize: pu(1.3),
            letterSpacing: '.18em',
            color: 'var(--pj-faint)',
          }}
        >
          <span>Place</span>
          <span>Payout</span>
        </div>
        {m.payouts.map((row) => (
          <div
            key={row.place}
            className="flex items-baseline justify-between"
            style={{
              gap: pu(1),
              padding: `${pu(0.5)} 0`,
              borderBottom: '1px solid var(--pj-hair)',
            }}
          >
            <span className="tabular-nums" style={{ fontSize: pu(1.9), color: 'var(--pj-dim)' }}>
              {row.place}
            </span>
            <span
              className="display text-right tabular-nums"
              style={{ fontSize: pu(1.9), fontWeight: 600 }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div style={{ fontSize: pu(1.4), letterSpacing: '.2em', color: 'var(--pj-faint)' }}>
        {label}
      </div>
      <div className="display tabular-nums" style={{ fontSize: pu(3.2), fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}
