import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Search, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export function UsersManager() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
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
                      <button className="p-2 text-neutral-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
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
    </div>
  );
}
