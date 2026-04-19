import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Non-modal side panel that slides in from the right edge of the viewport.
 *
 * Unlike a Dialog/Sheet, this panel:
 *  - has NO backdrop overlay (the rest of the page stays visible AND interactive)
 *  - does NOT trap focus or block clicks outside the panel
 *  - sits flush to the right edge so the central artwork preview keeps full
 *    visibility while the user picks a verse, scene, or template
 *
 * On small screens it docks to the bottom (full width, sheet-like) so it
 * doesn't crush the canvas on mobile.
 */
interface SidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Tailwind width class for the desktop column. Default `md:w-[420px]`. */
  widthClassName?: string;
}

export function SidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  widthClassName = 'md:w-[420px]',
}: SidePanelProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        {/* No <Overlay> — the artwork must stay visible & clickable. */}
        <DialogPrimitive.Content
          // Prevent the panel from stealing focus / closing when the user
          // clicks the canvas, theme controls, or anything else outside.
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            'theme-app fixed z-40 flex flex-col bg-background text-foreground shadow-2xl border-border',
            // Mobile: bottom sheet (doesn't cover the canvas above)
            'inset-x-0 bottom-0 max-h-[55vh] rounded-t-2xl border-t',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            // Desktop: docked right column, full height, slides from right
            'md:inset-y-4 md:right-4 md:bottom-auto md:left-auto md:max-h-[calc(100vh-2rem)]',
            'md:rounded-2xl md:border',
            'md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right',
            widthClassName,
          )}
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-border">
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-display text-base font-bold leading-tight text-foreground">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
