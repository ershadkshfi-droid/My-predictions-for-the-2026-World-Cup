-- ==========================================
-- إصلاح دالة إنشاء المستخدم لدعم صورة الملف الشخصي
-- شغل هذا الكود في SQL Editor في Supabase
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    CASE WHEN new.email = 'ershadkshfi@gmail.com' THEN 'admin' ELSE 'user' END,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
