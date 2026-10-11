import { LOGO_SRC, LOGO_ALT } from "@/lib/brand-logo";

type Props = {
  size?: "xs" | "sm" | "md";
  className?: string;
  muted?: boolean;
};

const box = {
  xs: { className: "h-7 w-7", px: 28 },
  sm: { className: "h-9 w-9", px: 36 },
  md: { className: "h-14 w-14", px: 56 },
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
      className={`${s.className} object-contain rounded-full shrink-0 ${
        muted ? "opacity-90" : ""
      } ${className}`}
      decoding="async"
    />
  );
}
