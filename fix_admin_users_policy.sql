-- ==========================================
-- سياسات تحديث المستخدمين لمدير النظام
-- شغل هذا الكود في SQL Editor في Supabase
-- ==========================================

DO $$ BEGIN
  CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete all users" ON public.users FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;
