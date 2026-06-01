import { Link } from "react-router-dom";
import { LOGO_ALT, LOGO_ALT_FULL, LOGO_SRC } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Props = {
  /** Full stacked logo or bird mark only (collapsed sidebar / top bar) */
  variant?: "full" | "mark";
  className?: string;
  linkToDashboard?: boolean;
};

export default function BrandLogo({
  variant = "full",
  className,
  linkToDashboard = true,
}: Props) {
  const img =
    variant === "mark" ? (
      <span
        className={cn(
          "inline-flex h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-white shadow-sm",
          className,
        )}
      >
        <img
          src={LOGO_SRC}
          alt={LOGO_ALT}
          className="h-full w-full object-cover object-[center_6%] scale-[1.55]"
          decoding="async"
        />
      </span>
    ) : (
      <img
        src={LOGO_SRC}
        alt={LOGO_ALT_FULL}
        className={cn(
          "w-full h-auto max-h-[8.75rem] object-contain drop-shadow-sm",
          className,
        )}
        decoding="async"
      />
    );

  if (!linkToDashboard) return img;

  return (
    <Link
      to="/dashboard"
      className="block min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      title={LOGO_ALT}
    >
      {img}
    </Link>
  );
}
