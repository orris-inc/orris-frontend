/**
 * PageToolbar - Stats pills (left) + Action buttons (right)
 *
 * Standard first row for admin pages, following Linear/Vercel layout.
 * Children = stats pills, actions = buttons on the right.
 */

export interface PageToolbarProps {
  /** Stats pills (left side) */
  children: React.ReactNode;
  /** Action buttons (right side) */
  actions?: React.ReactNode;
}

export function PageToolbar({ children, actions }: PageToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        {children}
      </div>
      {actions && (
        <div className="flex items-center gap-1.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
