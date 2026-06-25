import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export function SettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    correct_winner_points: 2,
    correct_score_points: 3,
    correct_penalty_points: 1,
    correct_red_card_points: 1,
    max_points_per_match: 7,
    allow_new_registrations: true,
    auto_close_predictions: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') {
           console.error('Error fetching settings:', error);
        }
      } else if (data) {
        setSettings({
          correct_winner_points: data.correct_winner_points ?? 2,
          correct_score_points: data.correct_score_points ?? 3,
          correct_penalty_points: data.correct_penalty_points ?? 1,
          correct_red_card_points: data.correct_red_card_points ?? 1,
          max_points_per_match: data.max_points_per_match ?? 7,
          allow_new_registrations: data.allow_new_registrations ?? true,
          auto_close_predictions: data.auto_close_predictions ?? true,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      // Upsert the settings - assuming there's only one row with id = 1
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 1, ...settings });

      if (error) throw error;
      
      setSaveMessage('تم حفظ الإعدادات بنجاح!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveMessage('حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl relative">
      <div>
        <h2 className="text-3xl font-black mb-2">الإعدادات النظام</h2>
        <p className="text-neutral-500">إدارة إعدادات المنصة وقواعد احتساب النقاط</p>
      </div>

      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl font-bold flex items-center justify-center ${
              saveMessage.includes('خطأ') 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}
          >
            {saveMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-8">
        
        {/* نظام احتساب النقاط */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-rose-600 to-orange-500">نظام احتساب النقاط</h3>
            <p className="text-neutral-500 text-sm mt-1">القواعد التي يتم بناء عليها منح النقاط للمستخدمين</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">الفائز الصحيح</label>
              <input 
                type="number" 
                value={settings.correct_winner_points} 
                onChange={(e) => setSettings({...settings, correct_winner_points: parseInt(e.target.value) || 0})}
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/50 border border-transparent font-medium text-left" 
                dir="ltr" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">النتيجة الصحيحة</label>
              <input 
                type="number" 
                value={settings.correct_score_points} 
                onChange={(e) => setSettings({...settings, correct_score_points: parseInt(e.target.value) || 0})}
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/50 border border-transparent font-medium text-left" 
                dir="ltr" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">ركلة الجزاء الصحيحة</label>
              <input 
                type="number" 
                value={settings.correct_penalty_points} 
                onChange={(e) => setSettings({...settings, correct_penalty_points: parseInt(e.target.value) || 0})}
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/50 border border-transparent font-medium text-left" 
                dir="ltr" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">البطاقة الحمراء الصحيحة</label>
              <input 
                type="number" 
                value={settings.correct_red_card_points} 
                onChange={(e) => setSettings({...settings, correct_red_card_points: parseInt(e.target.value) || 0})}
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/50 border border-transparent font-medium text-left" 
                dir="ltr" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">الحد الأعلى لكل مباراة</label>
              <input 
                type="number" 
                value={settings.max_points_per_match} 
                onChange={(e) => setSettings({...settings, max_points_per_match: parseInt(e.target.value) || 0})}
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/50 border border-transparent font-medium text-left" 
                dir="ltr" 
              />
            </div>
          </div>
        </section>

        <hr className="border-neutral-200 dark:border-neutral-800" />

        {/* إعدادات المنصة */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">إعدادات المنصة العامة</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-white">تسجيل مستخدمين جدد</h4>
                <p className="text-sm text-neutral-500">السماح بإنشاء حسابات جديدة للمنصة</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.allow_new_registrations}
                  onChange={(e) => setSettings({...settings, allow_new_registrations: e.target.checked})}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:-translate-x-1 rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] rtl:after:right-auto rtl:after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-white">إغلاق التوقعات تلقائياً</h4>
                <p className="text-sm text-neutral-500">إغلاق وتجميد التوقعات قبل بدء المباراة بنصف ساعة</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.auto_close_predictions}
                  onChange={(e) => setSettings({...settings, auto_close_predictions: e.target.checked})}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:-translate-x-1 rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] rtl:after:right-auto rtl:after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
              </label>
            </div>
          </div>
        </section>

        <div className="pt-6 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>

      </div>
    </div>
  );
}
