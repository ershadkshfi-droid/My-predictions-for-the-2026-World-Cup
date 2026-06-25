-- ==========================================
-- إعداد مساحة تخزين الصور (Avatars Bucket)
-- شغل هذا الكود في SQL Editor في Supabase
-- ==========================================

-- إنشاء الباكيت إذا لم يكن موجوداً
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- سياسة لرفع الصور (للمدراء فقط أو المستخدمين الموثقين)
-- السماح للمدير برفع وتعديل وحذف الصور
CREATE POLICY "Admins can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND role = 'admin')
);

-- السماح للجميع برؤية الصور
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );
