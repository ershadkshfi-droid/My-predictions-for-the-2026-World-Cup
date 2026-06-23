-- ==========================================
-- Supabase Authentication & Authorization
-- RLS Policies & Roles Setup
-- ==========================================

-- 1. إضافة عمود الصلاحيات (Role) وربط المستخدمين مع Supabase Auth
ALTER TABLE public.users
ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ==========================================
-- 2. تفعيل سياسات الأمان على مستوى الصفوف (Enable RLS)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. دالة للتحقق من صلاحيات المدير (Admin Check Function)
-- ==========================================
-- تقوم هذه الدالة بالتحقق ما إذا كان المستخدم الحالي لديه صلاحية admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR(20);
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN coalesce(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. سياسات الجداول (RLS Policies)
-- ==========================================

-- ------------------------------------------
-- جدول المستخدمين (users)
-- يمنع المستخدم من رؤية/تعديل بيانات غيره
-- ------------------------------------------
CREATE POLICY "Admins have full access to users" ON public.users
  FOR ALL USING (is_admin());

CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- يمكن للمستخدمين الجدد إدراج حسابهم (عند التسجيل)
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ------------------------------------------
-- جدول التوقعات (predictions)
-- التوقعات الخاصة والمخفية للآخرين
-- ------------------------------------------
CREATE POLICY "Admins have full access to predictions" ON public.predictions
  FOR ALL USING (is_admin());

CREATE POLICY "Users can read own predictions" ON public.predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions" ON public.predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON public.predictions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions" ON public.predictions
  FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------
-- جدول تفصيل النقاط (scores)
-- خصوصية النقاط المحصلة
-- ------------------------------------------
CREATE POLICY "Admins have full access to scores" ON public.scores
  FOR ALL USING (is_admin());

CREATE POLICY "Users can read own scores" ON public.scores
  FOR SELECT USING (auth.uid() = user_id);

-- ------------------------------------------
-- سجل النشاطات (activity_logs)
-- ------------------------------------------
CREATE POLICY "Admins have full access to activity logs" ON public.activity_logs
  FOR ALL USING (is_admin());

CREATE POLICY "Users can read own activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);


-- ==========================================
-- 5. الجداول المفتوحة للقراءة العامة أو للمستخدمين الموثقين
-- (لضمان عمل النظام يجب أن يرى الجميع المباريات والترتيب)
-- ==========================================

-- ------------------------------------------
-- جدول المباريات (matches) 
-- ------------------------------------------
CREATE POLICY "Admins have full access to matches" ON public.matches
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can read matches" ON public.matches
  FOR SELECT USING (true); -- متاح للجميع للقراءة (لإتاحة إمكانية التوقع)

-- ------------------------------------------
-- جدول نتائج المباريات (match_results)
-- ------------------------------------------
CREATE POLICY "Admins have full access to match results" ON public.match_results
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can read match results" ON public.match_results
  FOR SELECT USING (true);

-- ------------------------------------------
-- جدول لوحة المتصدرين (leaderboard)
-- الترتيب عام ومتاح للقراءة، التعديل فقط للأدمن
-- ------------------------------------------
CREATE POLICY "Admins have full access to leaderboard" ON public.leaderboard
  FOR ALL USING (is_admin());

CREATE POLICY "Auth users can read leaderboard" ON public.leaderboard
  FOR SELECT USING (auth.role() = 'authenticated');

-- ------------------------------------------
-- جدول الإعدادات العامة (settings)
-- ------------------------------------------
CREATE POLICY "Admins have full access to settings" ON public.settings
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can read settings" ON public.settings
  FOR SELECT USING (true);

-- ==========================================
-- 6. دوال الزناد (Triggers) للمستخدمين الجدد
-- إنشاء سجل تلقائي عند قيام مستخدم إدراج حسابه عبر Auth
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (new.id, new.email, split_part(new.email, '@', 1), 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ربط Supabase Auth لإنشاء المستخدم بالجدول تلقائيا
-- ملاحظة: هذه الخطوة تُطبق على مخطط auth الخاص بـ Supabase
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
