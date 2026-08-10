import { Link } from 'react-router-dom';
import { ChevronLeftIcon, HomeIcon } from '@application/components/ui/icons';

interface BackLinkProps {
  to: string;
  label: string;
  /** `home` renders the house glyph, `caret` the back arrow. */
  glyph?: 'home' | 'caret';
}

/** The leftmost control on the bar — back to the previous screen, or home. */
export default function BackLink({ to, label, glyph = 'caret' }: BackLinkProps) {
  return (
    <Link
      to={to}
      className={`btn btn-icon ${glyph === 'home' ? 'btn-secondary' : 'btn-quiet'}`}
      title={label}
      aria-label={label}
    >
      {glyph === 'home' ? (
        <HomeIcon className="size-4" />
      ) : (
        <ChevronLeftIcon className="size-[19px]" />
      )}
    </Link>
  );
}
