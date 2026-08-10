import { Link } from 'react-router-dom';
import Screen from '@application/components/template/Screen';

export default function NotFoundPage() {
  return (
    <Screen>
      <div className="scroll felt flex flex-col items-center justify-center gap-1.5 p-8">
        <div className="display text-[91px] leading-none font-bold text-hair">404</div>
        <h1 className="text-[22px]">Page not found</h1>
        <p className="max-w-70 text-center text-[16px] text-faint">
          That screen does not exist, or the tournament it belonged to was deleted.
        </p>
        <Link to="/" className="btn btn-primary mt-2">
          Back to dashboard
        </Link>
      </div>
    </Screen>
  );
}
