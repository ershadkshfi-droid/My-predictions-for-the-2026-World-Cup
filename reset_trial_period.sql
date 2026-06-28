-- ==========================================
-- سكريبت التصفير الشامل لجميع التوقعات والنقاط (بما فيها التقييمات السابقة)
-- انسخ هذا الكود وقم بتشغيله في SQL Editor في Supabase
-- سيقوم هذا السكريبت بتصفير لوحة المتصدرين تماماً وإعادة كل شيء للصفر
-- ==========================================

BEGIN;

-- 1. حذف جميع التوقعات الحالية من النظام
DELETE FROM public.predictions;

-- 2. حذف سجلات التقييم السابقة
DELETE FROM public.evaluation_logs;

-- 3. تصفير جميع الإحصائيات بالكامل لجميع المستخدمين
UPDATE public.users
SET 
  total_points = 0,
  played_predictions = 0,
  exact_scores = 0,
  correct_winners = 0,
  correct_penalties = 0,
  correct_red_cards = 0,
  successful_predictions = 0,
  previous_points = 0,
  previous_predictions = 0,
  rank = NULL,
  updated_at = NOW()
WHERE id IS NOT NULL;

-- 4. إعادة الترتيب
WITH ranked_users AS (
  SELECT id, RANK() OVER (ORDER BY total_points DESC, username ASC) as user_rank
  FROM public.users
)
UPDATE public.users u
SET rank = r.user_rank
FROM ranked_users r
WHERE u.id = r.id;

COMMIT;
