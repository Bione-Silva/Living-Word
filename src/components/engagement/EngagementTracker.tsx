// @ts-nocheck
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

    try {
      await supabase.functions.invoke('track-engagement', {
        body: {
          devotionalId,
          action,
          durationSeconds,
          theme,
          seriesNumber,
          ...extra,
        },
      });
      onEngagement?.(action);
    } catch (e) {
      console.error('Engagement tracking error:', e);
    }
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
