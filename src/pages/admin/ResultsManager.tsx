import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Gamepad2, Save, CheckCircle } from 'lucide-react';

export function ResultsManager() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('matches').select('*').in('status', ['scheduled', 'in_progress']).order('match_date', { ascending: true });
      if (error) throw error;
      setMatches(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResult = async (matchId: string, homeScore: number, awayScore: number, actualPenalty: 'none'|'home'|'away', actualWinner: 'home'|'away'|'draw') => {
    if (homeScore < 0 || awayScore < 0) return toast.error("الرجاء إدخال أهداف صحيحة");
    if (!actualWinner) return toast.error("الرجاء اختيار الفائز أو حالة التعادل");

    if (confirm("هل أنت متأكد من حفظ النتيجة واعتمادها نهائياً؟ سيتم احتساب النقاط وترقية الترتيب لجميع المستخدمين.")) {
      try {
        const { error } = await supabase
          .from('matches')
          .update({
            home_score: homeScore,
            away_score: awayScore,
            actual_penalty: actualPenalty,
            actual_winner: actualWinner,
            status: 'finished'
          })
          .eq('id', matchId);

        if (error) {
           if (error.message.includes("actual_winner")) {
             toast.error('خطأ: يرجى تحديث قاعدة البيانات وتشغيل ملف supabase_schema.sql لإضافة عمود actual_winner');
             return;
           }
           throw error;
        }
        toast.success("تم اعتماد النتيجة وتقييم التوقعات بنجاح!");
        fetchMatches();
      } catch (err) {
        console.error(err);
        toast.error("حدث خطأ أثناء حفظ النتيجة.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black mb-2">إدارة النتائج</h2>
          <p className="text-neutral-500">تحديث نتائج المباريات الجارية وحساب نقاط التوقعات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-neutral-500 font-medium bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
            جاري تحميل المباريات المتاحة...
          </div>
        ) : matches.length > 0 ? (
          matches.map((match) => (
            <ResultCard key={match.id} match={match} onSave={handleUpdateResult} />
          ))
        ) : (
          <div className="col-span-full p-12 text-center flex flex-col items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
            <Gamepad2 className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-4" />
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">لا توجد مباريات متاحة</h3>
            <p className="text-neutral-500">لا توجد مباريات مجدولة أو جارية حالياً لإدارة نتائجها.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ match, onSave }: { match: any, onSave: (id: string, h: number, a: number, p: string, w: 'home'|'away'|'draw') => void }) {
  const [home, setHome] = useState<number | ''>(match.home_score ?? '');
  const [away, setAway] = useState<number | ''>(match.away_score ?? '');
  const [penalty, setPenalty] = useState<'none'|'home'|'away'>(match.actual_penalty ?? 'none');
  const [winner, setWinner] = useState<'home'|'away'|'draw' | ''>(match.actual_winner ?? '');

  // Update winner automatically if scores change to help admin
  useEffect(() => {
    if (typeof home === 'number' && typeof away === 'number') {
      if (home > away) setWinner('home');
      else if (home < away) setWinner('away');
      else setWinner('draw');
    }
  }, [home, away]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-lg">
          {match.stage}
        </span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${match.status === 'in_progress' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
          {match.status === 'in_progress' ? 'جارية الآن' : 'مجدولة'}
        </span>
      </div>

      <div className="mb-6 space-y-2">
        <p className="text-xs font-bold text-neutral-500">الفائز بالمباراة</p>
        <select 
          value={winner} 
          onChange={e => setWinner(e.target.value as any)}
          className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl text-sm font-bold px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="" disabled>اختر الفائز</option>
          <option value="home">{match.home_team}</option>
          <option value="away">{match.away_team}</option>
          <option value="draw">تعادل</option>
        </select>
      </div>
      
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex-1 text-center font-bold text-lg">{match.home_team}</div>
        <div className="flex items-center gap-2">
          <input type="number" min="0" value={home} onChange={e => setHome(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-12 h-12 text-center font-black text-xl rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0" />
          <span className="text-neutral-400 font-bold">:</span>
          <input type="number" min="0" value={away} onChange={e => setAway(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-12 h-12 text-center font-black text-xl rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0" />
        </div>
        <div className="flex-1 text-center font-bold text-lg">{match.away_team}</div>
      </div>

      <div className="mb-6 space-y-2">
        <p className="text-xs font-bold text-neutral-500">من حصل على ركلة جزاء؟</p>
        <select 
          value={penalty} 
          onChange={e => setPenalty(e.target.value as any)}
          className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl text-sm font-bold px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="none">لا توجد ركلة جزاء</option>
          <option value="home">{match.home_team}</option>
          <option value="away">{match.away_team}</option>
        </select>
      </div>

      <div className="mt-auto">
        <button 
          onClick={() => typeof home === 'number' && typeof away === 'number' && winner !== '' && onSave(match.id, home, away, penalty, winner as 'home'|'away'|'draw')}
          disabled={typeof home !== 'number' || typeof away !== 'number' || winner === ''}
          className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <CheckCircle className="w-5 h-5" />
          تأكيد النتيجة نهائياً
        </button>
      </div>
    </div>
  );
}
