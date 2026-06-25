import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Mail, Lock, ArrowLeft, Eye, EyeOff, AlertCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export function Login() {
  const { session, userProfile, loading: authLoading, reloadProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [allowNewRegistrations, setAllowNewRegistrations] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('allow_new_registrations').eq('id', 1).single();
        if (data && !error) {
          setAllowNewRegistrations(data.allow_new_registrations);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session) {
    if (userProfile?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // التحقق المبدئي
    if (!email || !password || (!isLogin && !username)) {
      setError('يرجى تعبئة جميع الحقول المطلوبة.');
      setLoading(false);
      return;
    }

    if (!isLogin && !allowNewRegistrations) {
      setError('عذراً، التسجيل موقوف حالياً من قبل الإدارة.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن لا تقل عن 6 أحرف.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
              avatar_url: avatarUrl,
            }
          }
        });
        if (error) throw error;

        // Try to update the user profile manually just in case the trigger doesn't map it properly
        if (data.user) {
          const { error: profileError } = await supabase
            .from('users')
            .update({ username: username, avatar_url: avatarUrl })
            .eq('id', data.user.id);
            
          if (profileError && profileError.code !== 'PGRST116') {
             // PGRST116 means zero rows updated, which might happen if the trigger hasn't run yet.
             // If trigger executes right away, this is safe. 
             // If it fails, that's fine, the trigger might handle it.
             console.error('Profile update error:', profileError);
          }
          
          // In case the row does not exist yet (no trigger), try to insert it:
          const { error: insertError } = await supabase
            .from('users')
            .insert([{ id: data.user.id, email: email, username: username, avatar_url: avatarUrl, role: 'user' }]);
            
            // Ignore duplicate key error in case trigger did it

          await reloadProfile();
        }

        setError('تم إنشاء الحساب بنجاح! جاري تحويلك...');
      }
    } catch (err: any) {
      // تخصيص رسائل الخطأ لتكون مقروءة للمستخدم العربي
      let errorMsg = err.message || 'حدث خطأ أثناء المصادقة';
      if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = 'هذا البريد الإلكتروني مسجل لدينا مسبقاً.';
      } else if (errorMsg.includes('Email not confirmed')) {
          errorMsg = 'يرجى تأكيد بريدك الإلكتروني أولاً.';
      }
      setError(errorMsg);
    } finally {
      if (!error || !error.includes('بنجاح')) setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100" dir="rtl">
      
      {/* 1. الجانب الأيمن - واجهة تسجيل الدخول (Form Side) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-16 xl:px-32 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full mx-auto"
        >
          {/* رأس النموذج */}
          <div className="mb-10 text-center sm:text-right">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20 mb-6 relative overflow-hidden">
               {/* تأثير زخرفي داخلي */}
               <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite_linear]"></div>
               <Trophy className="w-8 h-8 text-white relative z-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight text-neutral-900 dark:text-white">
              توقعاتي لكأس العالم 2026
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium text-base sm:text-lg leading-relaxed mb-6">
              منصة تنافسية لإدارة ومتابعة توقعات المستخدمين لجميع مباريات كأس العالم 2026
            </p>
            
            <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 mb-6"></div>

            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">
              {isLogin ? 'مرحباً بعودتك 👋' : 'إنشاء حساب جديد ✨'}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
               {isLogin ? 'سجل دخولك الآن للوصول إلى لوحة التحكم الخاصة بك.' : 'انضم إلينا الآن وابدأ بتوقع النتائج وتنافس مع أصدقائك.'}
            </p>
          </div>

          {/* تنبيهات الأخطاء */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded-2xl flex items-start gap-3 mb-6 border ${error.includes('بنجاح') ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'}`}
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-bold leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* النموذج */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* حقل اسم المستخدم (في حالة التسجيل فقط) */}
            {!isLogin && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">اسم المستخدم</label>
                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 font-bold group-focus-within:text-emerald-500 transition-colors flex items-center justify-center">@</div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    dir="ltr"
                    required={!isLogin}
                    className="w-full bg-neutral-100/80 dark:bg-neutral-900/50 text-neutral-900 dark:text-white rounded-2xl py-3.5 pr-12 pl-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-neutral-200 dark:border-neutral-800 focus:bg-white dark:focus:bg-neutral-900 transition-all font-medium placeholder:text-neutral-400"
                  />
                </div>
              </div>
            )}

            {/* حقل صورة المستخدم (في حالة التسجيل فقط) */}
            {!isLogin && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-3 duration-300">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">صورة المستخدم (اختياري)</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 150;
                            const MAX_HEIGHT = 150;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                              if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                              }
                            } else {
                              if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                              }
                            }

                            canvas.width = width;
                            canvas.height = height;

                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, width, height);
                            setAvatarUrl(canvas.toDataURL('image/jpeg', 0.8));
                          };
                          img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-neutral-100/80 dark:bg-neutral-900/50 text-neutral-900 dark:text-white rounded-2xl py-3 px-4 focus:outline-none border border-neutral-200 dark:border-neutral-800 transition-all font-medium file:ml-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-500/10 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
                  />
                </div>
                {avatarUrl && (
                  <div className="mt-2 flex items-center justify-start gap-3">
                    <img src={avatarUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500" />
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">تم اختيار الصورة بنجاح</span>
                  </div>
                )}
              </div>
            )}

            {/* حقل البريد الإلكتروني */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">البريد الإلكتروني</label>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  required
                  className="w-full bg-neutral-100/80 dark:bg-neutral-900/50 text-neutral-900 dark:text-white rounded-2xl py-3.5 pr-12 pl-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-neutral-200 dark:border-neutral-800 focus:bg-white dark:focus:bg-neutral-900 transition-all font-medium placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* حقل كلمة المرور */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">كلمة المرور</label>
                {isLogin && (
                  <a href="#" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors">
                    نسيت كلمة المرور؟
                  </a>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  required
                  className="w-full bg-neutral-100/80 dark:bg-neutral-900/50 text-neutral-900 dark:text-white rounded-2xl py-3.5 pr-12 pl-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-neutral-200 dark:border-neutral-800 focus:bg-white dark:focus:bg-neutral-900 transition-all font-medium placeholder:text-neutral-400 tracking-widest"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* تذكرني */}
            {isLogin && (
              <div className="flex items-center gap-3 pt-1">
                <div className="relative flex items-center justify-center">
                   <input 
                     type="checkbox" 
                     id="remember"
                     checked={rememberMe}
                     onChange={(e) => setRememberMe(e.target.checked)}
                     className="peer appearance-none w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 checked:bg-emerald-500 checked:border-emerald-500 cursor-pointer transition-all"
                   />
                   <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                   </svg>
                </div>
                <label htmlFor="remember" className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                  تذكرني على هذا الجهاز
                </label>
              </div>
            )}

            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-4 outline-none focus:ring-4 focus:ring-emerald-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isLogin ? (
                <>تسجيل الدخول <ArrowLeft className="w-5 h-5" /></>
              ) : (
                <>إنشاء الحساب <ArrowLeft className="w-5 h-5" /></>
              )}
            </button>
          </form>

          {/* تبديل الوضع */}
          <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center">
            {isLogin ? (
              allowNewRegistrations ? (
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                  ليس لديك حساب بعد؟{' '}
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setError(null);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-700 hover:underline underline-offset-4 transition-all"
                  >
                    سجل معنا الآن
                  </button>
                </p>
              ) : (
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                  تسجيل الحسابات الجديدة موقوف حالياً.
                </p>
              )
            ) : (
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                لديك حساب بالفعل؟{' '}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setError(null);
                  }}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-700 hover:underline underline-offset-4 transition-all"
                >
                  تسجيل الدخول
                </button>
              </p>
            )}
          </div>

        </motion.div>
      </div>

      {/* 2. الجانب الأيسر - العنصر الزخرفي (Decorative Side) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-neutral-900 border-r border-neutral-800 p-12 items-center justify-center">
         
         {/* صورة أو تدرج خلفية */}
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518605368461-1e1e1273950c?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
         <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-emerald-950 via-emerald-900/60 to-transparent"></div>
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-900/80 backdrop-blur-[2px]"></div>

         {/* المحتوى الزخرفي */}
         <div className="relative z-10 w-full max-w-lg">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl"
            >
               <div className="flex items-center gap-3 mb-6">
                 <div className="px-3 py-1 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-lg">LIVE</div>
                 <div className="text-emerald-100 font-medium text-sm">تغطية حية وحصرية للمباريات</div>
               </div>
               
               <h2 className="text-4xl font-black text-white leading-tight mb-4">
                 لا تكن مجرد مشجع، <br />
                 <span className="text-emerald-400">كن المحلل الأول للمونديال!</span>
               </h2>
               
               <p className="text-emerald-50/70 text-lg leading-relaxed mb-8">
                 شارك توقعاتك المونديالية، تحدى عائلتك وأصدقائك في دوريات خاصة، واربح النقاط للوصول إلى قمة المتصدرين في طريقك نحو كأس العالم 2026.
               </p>

               {/* بطاقة إحصائية وهمية للزينة */}
               <div className="bg-black/20 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                 <div className="flex -space-x-3 -space-x-reverse">
                   <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=A&backgroundColor=b6e3f4" className="w-10 h-10 rounded-full border-2 border-emerald-800" alt="user" />
                   <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=B&backgroundColor=c0aede" className="w-10 h-10 rounded-full border-2 border-emerald-800" alt="user" />
                   <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=C&backgroundColor=d1fae5" className="w-10 h-10 rounded-full border-2 border-emerald-800" alt="user" />
                   <div className="w-10 h-10 rounded-full border-2 border-emerald-800 bg-emerald-600 flex items-center justify-center text-xs font-bold text-white z-10">+2k</div>
                 </div>
                 <div className="text-left text-sm" dir="ltr">
                   <div className="text-emerald-100 font-bold">Active Predictors</div>
                   <div className="text-emerald-400/80 font-medium text-xs">Join the community</div>
                 </div>
               </div>
            </motion.div>
         </div>

      </div>
    </div>
  );
}

