"use client";

import { trackClick } from "@/lib/tracking";

interface TrackedLinkProps {
  id: string;
  label: string;
  href: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function TrackedLink({ id, label, href, className, children, style }: TrackedLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => trackClick({ id, label, href })}
    >
      {children}
    </a>
  );
}
