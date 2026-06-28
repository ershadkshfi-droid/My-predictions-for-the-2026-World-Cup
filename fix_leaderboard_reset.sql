-- ==========================================
-- سكريبت التصفير الإجباري للوحة المتصدرين والتوقعات
-- انسخ هذا الكود بالكامل وقم بتشغيله في SQL Editor في Supabase
-- ==========================================

-- أولاً: التأكد من وجود الأعمدة لتجنب أي أخطاء أثناء التحديث
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS previous_points INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS previous_predictions INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS played_predictions INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS exact_scores INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS correct_winners INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS correct_penalties INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS correct_red_cards INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS successful_predictions INTEGER DEFAULT 0;

DO $$ 
BEGIN
  -- تعطيل المشغل الخاص بحماية الحقول فقط لتجنب منع التصفير
  ALTER TABLE public.users DISABLE TRIGGER tr_protect_user_fields;

  -- 1. حذف جميع التوقعات الحالية
  DELETE FROM public.predictions;

  -- 2. حذف سجلات التقييم 
  DELETE FROM public.evaluation_logs;

  -- 3. تصفير الإحصائيات لجميع المستخدمين بشكل قاطع
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

  -- إعادة تفعيل المشغل
  ALTER TABLE public.users ENABLE TRIGGER tr_protect_user_fields;

END $$;
