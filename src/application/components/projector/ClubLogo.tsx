import { getLogoPath } from '../../../config/appConfig';
import { pu } from '../../shared/projectorScale';

/** Club logo, top-left of the projector screen — reads config/winwise.json. Renders nothing when no logo is configured. */
export default function ClubLogo() {
  const logoPath = getLogoPath();
  if (!logoPath) return null;

  return (
    <img
      src={logoPath}
      alt="Club logo"
      className="shrink-0 rounded-full object-contain shadow-lg"
      style={{ width: pu(6), height: pu(6) }}
    />
  );
}
