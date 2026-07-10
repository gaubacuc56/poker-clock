import winwise from '../../config/winwise.json';

interface BrandConfig {
  /** Path to the club's logo, shown top-left on the projector. Empty = no logo shown at all. */
  logo: string;
}

const brandConfig = winwise as BrandConfig;

export function getLogoPath(): string {
  return brandConfig.logo;
}
