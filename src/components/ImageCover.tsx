import Image from "next/image";
import { cn } from "@/lib/ui";

type ImageCoverProps = {
  src: string;
  alt: string;
  size?: number;
  className?: string;
};

export function ImageCover({ src, alt, size = 64, className }: ImageCoverProps) {
  const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Crect fill='%23e5e7eb' width='${size}' height='${size}'/%3E%3C/svg%3E`;

  if (!src) {
    return (
      <div
        className={cn("shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800", className)}
        style={{ width: size, height: size }}
        aria-label={alt}
      />
    );
  }

  return (
    <div className={cn("shrink-0", className)} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-lg object-cover"
        sizes={`${size}px`}
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = placeholder;
        }}
      />
    </div>
  );
}

