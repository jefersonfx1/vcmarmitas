import { LOGO_SRC, LOGO_ALT } from "@/lib/brand-logo";

type Props = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Soft opacity for dark backgrounds */
  muted?: boolean;
};

const box = {
  xs: { className: "h-7 w-7", px: 28 },
  sm: { className: "h-9 w-9", px: 36 },
  md: { className: "h-12 w-12", px: 48 },
  lg: { className: "h-16 w-16", px: 64 },
} as const;

export default function BrandLogo({
  size = "sm",
  className = "",
  muted = false,
}: Props) {
  const s = box[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt={LOGO_ALT}
      width={s.px}
      height={s.px}
      className={`${s.className} object-contain shrink-0 rounded-lg ${
        muted ? "opacity-95" : ""
      } ${className}`}
      decoding="async"
    />
  );
}
