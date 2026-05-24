-- 1. REPLICA IDENTITY FULL — UPDATE events now carry the new row via postgres_changes
--    so the sender's realtime subscription can flip the double-tick to blue.
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- 2. Allow receiver to mark messages as "read" (current policy only allows sender).
DROP POLICY IF EXISTS "dm_update" ON public.direct_messages;
CREATE POLICY "dm_update" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = sender_id                                   -- sender may edit content
    OR (auth.uid() = receiver_id AND status = 'read')        -- receiver may only mark read
  );

-- 3. Prevent sending a message to someone who has blocked you.
DROP POLICY IF EXISTS "dm_insert" ON public.direct_messages;
CREATE POLICY "dm_insert" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = receiver_id
        AND blocked_id  = auth.uid()
    )
  );

-- 4. Let the blocked user see the record so the frontend can disable the composer.
DROP POLICY IF EXISTS "blocked_select" ON public.blocked_users;
CREATE POLICY "blocked_select" ON public.blocked_users
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
