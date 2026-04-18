import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { safeInvoke } from '@/lib/safe-invoke';

interface EngagementTrackerProps {
  devotionalId?: string;
  theme?: string;
  seriesNumber?: number;
  onEngagement?: (action: string) => void;
}

export function EngagementTracker({ devotionalId, theme, seriesNumber, onEngagement }: EngagementTrackerProps) {
  const { user } = useAuth();
  const startTime = useRef(Date.now());
  const tracked = useRef(false);

  const trackAction = useCallback(async (
    action: 'view' | 'like' | 'save' | 'share' | 'complete_reflection',
    extra?: { reflectionText?: string; reflectionSentiment?: string; emotionalResponse?: string }
  ) => {
    if (!user) return;
    const durationSeconds = Math.round((Date.now() - startTime.current) / 1000);

    // safeInvoke never throws; silently no-ops if session expired
    const { unauthorized, error } = await safeInvoke('track-engagement', {
      body: { devotionalId, action, durationSeconds, theme, seriesNumber, ...extra },
    });
    if (unauthorized) return;
    if (error) {
      console.error('Engagement tracking error:', error);
      return;
    }
    onEngagement?.(action);
  }, [user, devotionalId, theme, seriesNumber, onEngagement]);

  // Track view on mount
  useEffect(() => {
    if (!tracked.current && user && devotionalId) {
      tracked.current = true;
      trackAction('view');
    }
  }, [user, devotionalId, trackAction]);

  return { trackAction };
}

export function useEngagementTracker(props: EngagementTrackerProps) {
  return EngagementTracker(props);
}
