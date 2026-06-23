import { createClient } from '@supabase/supabase-js';

// لقد قمت بتثبيت الروابط والمفاتيح بشكل صريح هنا لتجاهل أي قيم خاطئة موجودة في إعدادات المنصة
const supabaseUrl = 'https://fdoipipeordcbwduhqfk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2lwaXBlb3JkY2J3ZHVocWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4OTMyNzcsImV4cCI6MjA5NzQ2OTI3N30.z0BqYjFhpk3l3LbomeSrtJeP6jjzeo_ti-oTeoNzJTo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
