import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Edit2, X, Save, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDefaultAvatar } from '../../lib/avatar';

export function PreviousEvaluationsManager() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ previous_predictions: 0, previous_points: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').order('username', { ascending: true });
      if (error) throw error;
      setUsersList(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setEditForm({
      previous_predictions: user.previous_predictions || 0,
      previous_points: user.previous_points || 0
    });
    setMessage({ type: '', text: '' });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const { error } = await supabase
        .from('users')
        .update({
          previous_predictions: editForm.previous_predictions,
          previous_points: editForm.previous_points
        })
        .eq('id', editingUser.id);
        
      if (error) throw error;
      
      // إجبار إعادة الحساب المجموع الكلي
      await supabase.rpc('recalculate_user_stats', { p_user_id: editingUser.id });
      
      setMessage({ type: 'success', text: 'تم تحديث التقييمات السابقة بنجاح' });
      
      // Update local state
      setUsersList(usersList.map(u => 
        u.id === editingUser.id ? { ...u, ...editForm } : u
      ));
      
      setTimeout(() => {
        setEditingUser(null);
      }, 1500);
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: e.message || 'حدث خطأ أثناء التحديث' });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = usersList.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black mb-2">التقييمات السابقة</h2>
          <p className="text-neutral-500">حصر وإدارة التوقعات والنقاط السابقة للمستخدمين</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-neutral-200/80 dark:border-neutral-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="ابحث عن مستخدم..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2.5 pr-12 pl-4 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right shrink-0">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-bold text-sm">
                <th className="p-4 w-16">#</th>
                <th className="p-4">المستخدم</th>
                <th className="p-4 text-center">توقعات سابقة</th>
                <th className="p-4 text-center">نقاط سابقة</th>
                <th className="p-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-neutral-500">جاري التحميل...</td></tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 text-neutral-500 font-medium">{idx + 1}</td>
                    <td className="p-4 font-bold">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar_url || getDefaultAvatar(user.username)} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full object-cover" 
                          onError={(e) => { (e.target as HTMLImageElement).src = getDefaultAvatar(user.username) }}
                        />
                        {user.username}
                      </div>
                    </td>
                    <td className="p-4 text-center text-neutral-600 dark:text-neutral-400 font-bold">
                      {user.previous_predictions || 0}
                    </td>
                    <td className="p-4 text-center text-amber-600 dark:text-amber-500 font-bold">
                      {user.previous_points || 0}
                    </td>
                    <td className="p-4 text-left space-x-2 space-x-reverse">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="p-2 text-neutral-400 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-8 text-center text-neutral-500">لا يوجد مستخدمين</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-neutral-400" />
                  تعديل التقييمات السابقة
                </h3>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors bg-neutral-100 dark:bg-neutral-800 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {message.text && (
                  <div className={`p-3 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {message.text}
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <img 
                    src={editingUser.avatar_url || getDefaultAvatar(editingUser.username)} 
                    alt="avatar" 
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                  <div>
                    <div className="font-bold">{editingUser.username}</div>
                    <div className="text-sm text-neutral-500">{editingUser.email}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">التوقعات السابقة</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.previous_predictions}
                    onChange={(e) => setEditForm({...editForm, previous_predictions: parseInt(e.target.value) || 0})}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <p className="text-xs text-neutral-500">إجمالي عدد المباريات التي توقعها المستخدم مسبقاً</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">النقاط السابقة</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.previous_points}
                    onChange={(e) => setEditForm({...editForm, previous_points: parseInt(e.target.value) || 0})}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <p className="text-xs text-neutral-500">إجمالي النقاط التي حصل عليها المستخدم مسبقاً</p>
                </div>
              </div>

              <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex gap-3">
                <button
                  onClick={handleSaveUser}
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  {saving ? 'جاري الحفظ...' : (
                    <>
                      <Save className="w-5 h-5" />
                      حفظ التعديلات
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-6 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-bold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
