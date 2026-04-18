-- Enable realtime for the notification_queue table so the in-app bell
-- receives new notifications (and updates / deletions) without refresh.
ALTER TABLE public.notification_queue REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_queue;