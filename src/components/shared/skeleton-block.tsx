import { cn } from "@/lib/utils/cn";

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <div aria-hidden className={cn("skeleton-block", className)} />;
}
