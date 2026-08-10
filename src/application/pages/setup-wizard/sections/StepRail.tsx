import { STEPS } from '../constants';

interface StepRailProps {
  step: number;
  onStepChange: (step: number) => void;
}

/** The numbered step strip under the bar. Any step can be jumped to directly. */
export default function StepRail({ step, onStepChange }: StepRailProps) {
  return (
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
              onClick={() => onStepChange(index)}
              aria-current={isActive ? 'step' : undefined}
              className="flex w-18 flex-none cursor-pointer flex-col items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] text-inherit"
            >
              <span className={`chip size-8 text-[16px] ${isActive ? 'chip-gold' : 'chip-slate'}`}>
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
  );
}
