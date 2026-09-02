import { useEffect } from 'react';
import { usePlanStore } from '@composition/container';
import { planEndingNotice } from '@domain/rules/accountAccess';
import { WarningIcon } from '@application/components/ui/icons';


export default function PlanEndingNotice({ className = '' }: { className?: string }) {
  const plan = usePlanStore((state) => state.plan);
  const loadPlan = usePlanStore((state) => state.load);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const notice = planEndingNotice(plan, new Date().toISOString());
  if (!notice) return null;

  return (
    <div className={`card gap-1.5 ${className}`}>
      <span className="flex items-center gap-1.5 text-[19px] font-semibold text-accent-lift">
        <WarningIcon className="size-[26px] shrink-0" />
        {notice.headline}
      </span>
      <p className="text-[16.5px] text-muted">{notice.consequence}</p>
      <p className="text-[16.5px] text-fg">{notice.action}</p>
    </div>
  );
}
