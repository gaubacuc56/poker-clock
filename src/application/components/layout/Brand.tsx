interface BrandProps {
  className: string;
  /** Adds the ember drop-shadow used on the sign-in screen's large mark. */
  glow?: boolean;
}

/** The club mark. Served from `public/icons/`, so it needs no bundler asset. */
export default function Brand({ className, glow = false }: BrandProps) {
  return (
    <img
      src="/icons/logo.png"
      alt=""
      className={`shrink-0 object-contain ${
        glow ? 'drop-shadow-[0_6px_18px_rgb(255_122_24/.18)]' : ''
      } ${className}`}
    />
  );
}
