import type { AnchorHTMLAttributes } from "react";

export default function GhostPill({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={className ? `ghost-pill ${className}` : "ghost-pill"} />;
}
