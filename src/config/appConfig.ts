import base from '../../config/base.json';
import winwise from '../../config/winwise.json';

export interface BackgroundOption {
  id: string;
  label: string;
  path: string;
}

interface BaseConfig {
  /** Bundled background images the Setup wizard can offer for the projector view. */
  backgrounds: BackgroundOption[];
}

interface BrandConfig {
  /** Path to the club's logo, shown top-left on the projector. Empty = no logo shown at all. */
  logo: string;
}

const baseConfig = base as BaseConfig;
const brandConfig = winwise as BrandConfig;

export function getLogoPath(): string {
  return brandConfig.logo;
}

export function getBackgroundOptions(): BackgroundOption[] {
  return baseConfig.backgrounds;
}

export function getBackgroundPath(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return baseConfig.backgrounds.find((background) => background.id === id)?.path;
}
