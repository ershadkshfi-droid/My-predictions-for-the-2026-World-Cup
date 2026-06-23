import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Trophy, Medal, Star } from 'lucide-react';

export function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('total_points', { ascending: false })
          .limit(100);

        if (error) throw error;
        setUsers(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="p-10 text-center text-neutral-500">جاري التحميل...</div>;

  const top3 = users.slice(0, 3);
  const remainingUsers = users.slice(3);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      <div className="flex flex-col items-center justify-center text-center space-y-4 pt-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-2">
          <Trophy className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
          لوحة <span className="text-amber-500">المتصدرين</span>
        </h1>
        <p className="text-lg text-neutral-500 max-w-xl">
          تنافس مع الأصدقاء وتصدر قائمة أفضل المتوقعين لنتائج مباريات كأس العالم 2026.
        </p>
      </div>

      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4 md:gap-8 items-end max-w-4xl mx-auto px-4 mt-12 mb-16">
          {/* Second Place */}
          {top3[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center relative z-10"
            >
              <div className="relative mb-4">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-300 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-lg shadow-slate-300/30">
                   <img 
                     src={top3[1].avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${top3[1].username}&backgroundColor=b6e3f4`} 
                     alt="Avatar" 
                     className="w-full h-full object-cover" 
                     onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${top3[1].username}&backgroundColor=b6e3f4` }}
                   />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-300 text-slate-800 font-black rounded-full flex items-center justify-center text-sm shadow-md border-2 border-white dark:border-neutral-950">2</div>
              </div>
              <h3 className="font-bold text-lg md:text-xl text-neutral-900 dark:text-white truncate w-full text-center">{top3[1].username}</h3>
              <div className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 px-4 py-1.5 rounded-full mt-2 font-black text-sm">
                {top3[1].total_points} نقطة
              </div>
              <div className="w-full h-32 md:h-40 bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-t-2xl mt-6 border-t-4 border-slate-300 shadow-inner"></div>
            </motion.div>
          )}

          {/* First Place */}
          {top3[0] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center relative z-20"
            >
              <div className="absolute -top-12 text-amber-500 animate-bounce">
                <Medal className="w-10 h-10 drop-shadow-lg" />
              </div>
              <div className="relative mb-4">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-amber-400 bg-amber-100 dark:bg-amber-900/30 overflow-hidden shadow-xl shadow-amber-500/40">
                   <img 
                     src={top3[0].avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${top3[0].username}&backgroundColor=b6e3f4`} 
                     alt="Avatar" 
                     className="w-full h-full object-cover" 
                     onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${top3[0].username}&backgroundColor=b6e3f4` }}
                   />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-amber-300 to-amber-500 text-white font-black rounded-full flex items-center justify-center text-base shadow-lg border-2 border-white dark:border-neutral-950">1</div>
              </div>
              <h3 className="font-black text-xl md:text-2xl text-neutral-900 dark:text-white truncate w-full text-center">{top3[0].username}</h3>
              <div className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-6 py-2 rounded-full mt-2 font-black text-base shadow-sm">
                {top3[0].total_points} نقطة
              </div>
              <div className="w-full h-40 md:h-52 bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/20 rounded-t-2xl mt-6 border-t-4 border-amber-400 shadow-[inset_0_4px_20px_rgba(0,0,0,0.05)] relative flex justify-center">
                 <Star className="w-16 h-16 text-amber-300/30 mt-8" />
              </div>
            </motion.div>
          )}

          {/* Third Place */}
          {top3[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center relative z-10"
            >
              <div className="relative mb-4">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-amber-700 bg-amber-50 dark:bg-amber-950/30 overflow-hidden shadow-lg shadow-amber-900/30">
                   <img 
                     src={top3[2].avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${top3[2].username}&backgroundColor=b6e3f4`} 
                     alt="Avatar" 
                     className="w-full h-full object-cover" 
                     onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${top3[2].username}&backgroundColor=b6e3f4` }}
                   />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-700 text-white font-black rounded-full flex items-center justify-center text-sm shadow-md border-2 border-white dark:border-neutral-950">3</div>
              </div>
              <h3 className="font-bold text-lg md:text-xl text-neutral-900 dark:text-white truncate w-full text-center">{top3[2].username}</h3>
              <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-600 px-4 py-1.5 rounded-full mt-2 font-black text-sm">
                {top3[2].total_points} نقطة
              </div>
              <div className="w-full h-24 md:h-32 bg-gradient-to-t from-amber-100/80 to-amber-50 dark:from-amber-950/50 dark:to-amber-950/20 rounded-t-2xl mt-6 border-t-4 border-amber-700 shadow-inner"></div>
            </motion.div>
          )}
        </div>
      )}

      {remainingUsers.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-right whitespace-nowrap">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-sm font-bold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="p-5 pl-0 text-center w-20">الترتيب</th>
                  <th className="p-5">المستخدم</th>
                  <th className="p-5 text-center">التوقعات</th>
                  <th className="p-5 text-center">النقاط</th>
                  <th className="p-5 text-center">نسبة النجاح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50 text-sm font-medium">
                {remainingUsers.map((user, idx) => {
                  const successRate = user.played_predictions > 0 
                    ? Math.round(((user.exact_scores + user.correct_winners) / user.played_predictions) * 100) 
                    : 0;

                  return (
                    <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="p-5 text-center font-bold text-neutral-400">{idx + 4}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden border border-emerald-200 dark:border-emerald-800">
                             <img 
                               src={user.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}&backgroundColor=b6e3f4`} 
                               alt={user.username} 
                               className="w-full h-full object-cover" 
                               onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}&backgroundColor=b6e3f4` }}
                             />
                          </div>
                          <span className="font-bold text-neutral-900 dark:text-white text-base">{user.username}</span>
                        </div>
                      </td>
                      <td className="p-5 text-center text-neutral-600 dark:text-neutral-400">{user.played_predictions}</td>
                      <td className="p-5 text-center font-black text-emerald-600 dark:text-emerald-400 text-base">{user.total_points || 0}</td>
                      <td className="p-5 text-center text-neutral-600 dark:text-neutral-400">
                         <div className="inline-flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full font-bold">
                           {successRate}%
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
