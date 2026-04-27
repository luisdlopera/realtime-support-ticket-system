import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800", className)}
      {...props}
    />
  );
}

export { Skeleton };

// Pre-built skeleton components for common patterns
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className || ""}`}
    >
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-8 w-12" />
    </div>
  );
}

export function TicketRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex justify-end mb-2 px-4">
      <div className="max-w-[70%] rounded-lg bg-wa-outgoing-light p-3 dark:bg-wa-outgoing-dark">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-1 h-3 w-20" />
      </div>
    </div>
  );
}

export function InboxItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="mt-1 h-3 w-48" />
      </div>
    </div>
  );
}
