import Spinner from '@application/components/ui/Spinner';
import { LAST_STEP } from '../constants';

interface WizardFooterProps {
  step: number;
  /** Editing an existing tournament: every step saves, rather than advancing to a finish. */
  isEditing: boolean;
  isSaving: boolean;
  canAdvance: boolean;
  canSave: boolean;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
}

/** The bottom bar: back on the left, and whichever forward action applies. */
export default function WizardFooter({
  step,
  isEditing,
  isSaving,
  canAdvance,
  canSave,
  onBack,
  onNext,
  onFinish,
}: WizardFooterProps) {
  const isFinishStep = isEditing || step === LAST_STEP;

  return (
    <div className="bar bar-bottom px-4 py-[11px]">
      <div className="content flex items-center gap-2.5">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={step === 0}
          onClick={onBack}
        >
          Back
        </button>
        {isFinishStep ? (
          <button
            type="button"
            className="btn btn-primary ml-auto min-w-33"
            disabled={isSaving || (isEditing && !canSave)}
            onClick={onFinish}
          >
            {isSaving && <Spinner />}
            {isEditing ? 'Save Changes' : 'Create Tournament'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary ml-auto min-w-33"
            disabled={!canAdvance}
            onClick={onNext}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
