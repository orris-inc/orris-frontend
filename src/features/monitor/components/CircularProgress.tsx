/**
 * Circular Progress Component
 * A modern circular gauge with gradient and glow effects
 */

import { memo, useMemo } from 'react';

interface CircularProgressProps {
  /** Value between 0-100 */
  value: number;
  /** Size of the circle in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Label text */
  label: string;
  /** Show value inside circle */
  showValue?: boolean;
  /** Color based on value thresholds */
  colorMode?: 'auto' | 'success' | 'warning' | 'danger' | 'info';
}

export const CircularProgress = memo(({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  showValue = true,
  colorMode = 'auto',
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clampedValue / 100) * circumference;

  // Generate unique ID for gradients
  const gradientId = useMemo(() => `gauge-gradient-${Math.random().toString(36).slice(2, 9)}`, []);

  // Determine colors based on value or mode using CSS variables
  const colors = useMemo(() => {
    // Color configurations using CSS variables
    const colorConfigs = {
      success: {
        start: 'var(--color-progress-success-start)',
        end: 'var(--color-progress-success-end)',
        text: 'text-success',
        glow: 'var(--color-progress-success-glow)',
      },
      warning: {
        start: 'var(--color-progress-warning-start)',
        end: 'var(--color-progress-warning-end)',
        text: 'text-warning',
        glow: 'var(--color-progress-warning-glow)',
      },
      danger: {
        start: 'var(--color-progress-danger-start)',
        end: 'var(--color-progress-danger-end)',
        text: 'text-destructive',
        glow: 'var(--color-progress-danger-glow)',
      },
      info: {
        start: 'var(--color-progress-info-start)',
        end: 'var(--color-progress-info-end)',
        text: 'text-info',
        glow: 'var(--color-progress-info-glow)',
      },
    };

    if (colorMode !== 'auto') {
      return colorConfigs[colorMode];
    }
    // Auto color based on value thresholds
    if (clampedValue >= 90) {
      return colorConfigs.danger;
    }
    if (clampedValue >= 75) {
      return colorConfigs.warning;
    }
    return colorConfigs.success;
  }, [colorMode, clampedValue]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
            {/* Glow filter */}
            <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />

          {/* Progress circle with gradient */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            filter={`url(#${gradientId}-glow)`}
            className="transition-all duration-500 ease-out"
          />

          {/* End dot indicator */}
          {clampedValue > 0 && (
            <circle
              cx={size / 2 + radius * Math.cos((clampedValue / 100) * 2 * Math.PI - Math.PI / 2)}
              cy={size / 2 + radius * Math.sin((clampedValue / 100) * 2 * Math.PI - Math.PI / 2)}
              r={strokeWidth / 2 + 1}
              fill={colors.end}
              className="transition-all duration-500 ease-out"
              style={{ filter: `drop-shadow(0 0 4px ${colors.glow})` }}
            />
          )}
        </svg>

        {/* Center value */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`font-bold tabular-nums ${colors.text}`}
              style={{ fontSize: size * 0.22 }}
            >
              {clampedValue.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
      <span
        className="font-medium text-muted-foreground"
        style={{ fontSize: Math.max(size * 0.15, 10) }}
      >
        {label}
      </span>
    </div>
  );
});
CircularProgress.displayName = 'CircularProgress';
