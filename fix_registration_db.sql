-- ==========================================
-- إيقاف التسجيل إذا كانت الإعدادات تمنع ذلك
-- شغل هذا الكود في SQL Editor في Supabase
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_allow_new_registrations BOOLEAN;
BEGIN
  -- التحقق من إعدادات المنصة
  SELECT allow_new_registrations INTO v_allow_new_registrations FROM public.settings WHERE id = 1;
  
  -- إذا كانت الإعدادات تمنع التسجيل والمستخدم ليس مدير (يمكنك استثناء الإيميل الخاص بك)
  IF v_allow_new_registrations = false AND new.email != 'ershadkshfi@gmail.com' THEN
    RAISE EXCEPTION 'Registration is currently disabled by the administrator.';
  END IF;

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
