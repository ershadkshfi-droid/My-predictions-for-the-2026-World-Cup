-- ==========================================
-- الإصلاحات الأمنية الشاملة لبيئة Supabase
-- ==========================================

-- 1. حماية حقول المستخدم من التعديل العشوائي وتصعيد الصلاحيات (نظام تسجيل النقاط والصلاحيات)
CREATE OR REPLACE FUNCTION public.protect_user_fields()
RETURNS trigger AS $$
BEGIN
  -- إذا لم يكن المستخدم مديراً، يتم الرجوع للقيم القديمة للحقول الحساسة
  IF NOT public.is_admin() THEN
    NEW.role = OLD.role;
    NEW.total_points = OLD.total_points;
    NEW.rank = OLD.rank;
    NEW.played_predictions = OLD.played_predictions;
    NEW.exact_scores = OLD.exact_scores;
    NEW.correct_winners = OLD.correct_winners;
    NEW.correct_penalties = OLD.correct_penalties;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_user_fields ON public.users;
CREATE TRIGGER tr_protect_user_fields
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_user_fields();

-- 2. حماية حقول التوقعات (منع التلاعب بالنقاط والتقييم من قبل المستخدمين عند الإدراج أو التحديث)
CREATE OR REPLACE FUNCTION public.protect_prediction_fields()
RETURNS trigger AS $$
BEGIN
  -- إذا لم يكن المستخدم مديراً، يمنع من تحديد أو تعديل نقاطه وحالة التقييم
  IF NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.points_earned = 0;
      NEW.is_evaluated = false;
      NEW.points_breakdown = NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.points_earned = OLD.points_earned;
      NEW.is_evaluated = OLD.is_evaluated;
      NEW.points_breakdown = OLD.points_breakdown;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_prediction_fields ON public.predictions;
CREATE TRIGGER tr_protect_prediction_fields
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_prediction_fields();


-- 3. تأمين إدراج وتحديث التوقعات (مسموح فقط قبل بدء المباراة والمباراة يجب أن تكون مجدولة)
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can insert own predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users can update own predictions" ON public.predictions;

-- إضافة السياسة المحدثة للإدراج
CREATE POLICY "Users can insert own predictions" ON public.predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id 
        AND status = 'scheduled' 
        AND match_date > now()
    )
  );

-- إضافة السياسة المحدثة للتحديث
CREATE POLICY "Users can update own predictions" ON public.predictions
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id 
        AND status = 'scheduled' 
        AND match_date > now()
    )
  ) WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id 
        AND status = 'scheduled' 
        AND match_date > now()
    )
  );
