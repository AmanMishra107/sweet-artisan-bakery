-- Fix self-referential RLS causing recursion on admin_users
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

CREATE POLICY "Users can view their admin record"
ON public.admin_users
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to manage their own subscriptions from the client
CREATE POLICY "Users can create their own subscription"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);
