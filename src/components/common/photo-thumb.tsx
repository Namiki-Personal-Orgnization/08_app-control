"use client";

import * as React from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PhotoThumb({
  url,
  alt,
  size = "md",
  className,
}: {
  url?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  } as const;

  if (!url) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground",
          sizes[size],
          className,
        )}
      >
        <ImageIcon className="h-1/2 w-1/2 opacity-50" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={cn(
        "shrink-0 rounded-md border object-cover",
        sizes[size],
        className,
      )}
      loading="lazy"
    />
  );
}
