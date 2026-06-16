'use client';

import { categoryColor } from '@/lib/utils';

interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'xs';
}

export function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const color = categoryColor(category);
  const fontSize = size === 'xs' ? '0.6rem' : '0.6875rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: '4px',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 25%, transparent)`,
        whiteSpace: 'nowrap',
      }}
    >
      {category}
    </span>
  );
}
