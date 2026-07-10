import { getLogoPath } from '../../config/appConfig';

/** Club logo, top-left of the projector screen — reads config/winwise.json. Renders nothing when no logo is configured. */
export default function ClubLogo() {
  const logoPath = getLogoPath();
  if (!logoPath) return null;

  return (
    <img
      src={logoPath}
      alt="Club logo"
      className="shrink-0 rounded-full object-contain shadow-lg"
      style={{ width: 'clamp(3rem, 6vw, 6.5rem)', height: 'clamp(3rem, 6vw, 6.5rem)' }}
    />
  );
}
