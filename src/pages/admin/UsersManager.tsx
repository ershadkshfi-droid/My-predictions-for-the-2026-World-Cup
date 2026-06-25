import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Search, Edit2, Trash2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function UsersManager() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ username: '', avatar_url: '', role: 'user' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
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
      username: user.username || '',
      avatar_url: user.avatar_url || '',
      role: user.role || 'user'
    });
    setMessage({ type: '', text: '' });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setSaving(true);
      setMessage({ type: 'info', text: 'جاري رفع الصورة...' });

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setEditForm({ ...editForm, avatar_url: data.publicUrl });
      setMessage({ type: 'success', text: 'تم رفع الصورة بنجاح. لا تنس حفظ التعديلات.' });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء رفع الصورة.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: editForm.username,
          avatar_url: editForm.avatar_url,
          role: editForm.role
        })
        .eq('id', editingUser.id);
        
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'تم تحديث بيانات المستخدم بنجاح' });
      
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

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black mb-2">إدارة المستخدمين</h2>
          <p className="text-neutral-500">إدارة حسابات المستخدمين وصلاحياتهم</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-neutral-200/80 dark:border-neutral-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="ابحث عن مستخدم..." 
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
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">الدور</th>
                <th className="p-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-neutral-500">جاري التحميل...</td></tr>
              ) : usersList.length > 0 ? (
                usersList.map((user, idx) => (
                  <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 text-neutral-500 font-medium">{idx + 1}</td>
                    <td className="p-4 font-bold">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}&backgroundColor=b6e3f4`} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full object-cover" 
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}&backgroundColor=b6e3f4` }}
                        />
                        {user.username}
                      </div>
                    </td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-400 font-medium dir-ltr text-right">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${user.role === 'admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}>
                        {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                      </span>
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
                <h3 className="text-xl font-bold">تعديل بيانات المستخدم</h3>
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
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">اسم المستخدم</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">الصورة الشخصية</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={saving}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {editForm.avatar_url && (
                    <div className="mt-2 flex justify-center">
                      <img 
                        src={editForm.avatar_url} 
                        alt="Preview" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block' }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">الدور والصلاحيات</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="user">مستخدم (توقع)</option>
                    <option value="admin">مدير النظام</option>
                  </select>
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

