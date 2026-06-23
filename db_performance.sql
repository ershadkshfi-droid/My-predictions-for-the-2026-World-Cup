-- ==========================================
-- تحسينات الأداء لقاعدة بيانات Supabase (Indexes)
-- ==========================================

-- تسريع جلب المباريات المجدولة والجاري لعبها
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_stage ON public.matches(stage);

-- تسريع جلب توقعات المستخدمين
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON public.predictions(match_id);

-- تسريع لوحة المتصدرين (الترتيب والنقاط)
CREATE INDEX IF NOT EXISTS idx_users_total_points ON public.users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_rank ON public.users(rank ASC);

-- تسريع التحقق من المستخدمين الذين لديهم توقعات
CREATE INDEX IF NOT EXISTS idx_users_played_predictions ON public.users(played_predictions) WHERE played_predictions > 0;
