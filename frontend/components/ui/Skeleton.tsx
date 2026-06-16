'use client';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`rounded ${className}`}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, var(--surface) 25%, var(--surface-raised) 50%, var(--surface) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function SignalRowSkeleton() {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton height="14px" width="55%" />
        <Skeleton height="11px" width="30%" />
      </div>
      <Skeleton height="24px" width="40px" />
    </div>
  );
}

// Inject shimmer keyframe
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes skeleton-shimmer {
      from { background-position: 200% 0; }
      to   { background-position: -200% 0; }
    }
  `;
  if (!document.head.querySelector('[data-skeleton]')) {
    style.setAttribute('data-skeleton', '');
    document.head.appendChild(style);
  }
}
