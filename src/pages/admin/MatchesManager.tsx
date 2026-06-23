import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Swords, Plus, Edit2, Trash2, Calendar, X, Wand2 } from 'lucide-react';

export function MatchesManager() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    home_team: '',
    away_team: '',
    match_date: '',
    stage: 'المجموعات',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
      if (error) throw error;
      setMatches(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [isConfirmingSeed, setIsConfirmingSeed] = useState(false);

  const handleSeedWorldCup = async () => {
    if (!isConfirmingSeed) {
      setIsConfirmingSeed(true);
      setTimeout(() => setIsConfirmingSeed(false), 3000); // Reset after 3 seconds
      return;
    }
    
    setIsConfirmingSeed(false);
    setLoading(true);

    try {
      // First, clear all existing matches to generate a pristine tournament bracket
      const { data: allMatches } = await supabase.from('matches').select('id');
      if (allMatches && allMatches.length > 0) {
        const ids = allMatches.map(m => m.id);
        const batchSize = 100;
        for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            await supabase.from('evaluation_logs').delete().in('match_id', batch);
            await supabase.from('predictions').delete().in('match_id', batch);
            await supabase.from('matches').delete().in('id', batch);
        }
      }

      // World Cup 2026 has 12 groups (A to L)
      const worldCupGroups: Record<string, string[]> = {
        'A': ['المكسيك', 'نيجيريا', 'صربيا', 'نيوزيلندا'],
        'B': ['كندا', 'سويسرا', 'الكاميرون', 'اليابان'],
        'C': ['الأرجنتين', 'إسبانيا', 'أستراليا', 'تونس'],
        'D': ['أمريكا', 'كرواتيا', 'السنغال', 'بيرو'],
        'E': ['البرازيل', 'هولندا', 'السعودية', 'جنوب أفريقيا'],
        'F': ['فرنسا', 'الأوروغواي', 'كوريا الجنوبية', 'مالي'],
        'G': ['إنجلترا', 'كولومبيا', 'إيران', 'جامايكا'],
        'H': ['بلجيكا', 'الإكوادور', 'المغرب', 'كوستاريكا'],
        'I': ['البرتغال', 'الجزائر', 'ويلز', 'بنما'],
        'J': ['إيطاليا', 'تشيلي', 'عمان', 'أوزبكستان'],
        'K': ['ألمانيا', 'بولندا', 'مصر', 'هندوراس'],
        'L': ['الدنمارك', 'السويد', 'قطر', 'العراق']
      };

      const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
      const matchesToInsert = [];
      
      // Group Stage: June 11 - June 27, 2026
      // Saudi time is UTC+3. Time slots (local NA times vs KSA times).
      // Assuming slots at: 15:00 UTC (18:00 KSA), 18:00 UTC (21:00 KSA), 21:00 UTC (00:00 KSA), 00:00 UTC (03:00 KSA)
      const timeSlots = ['15:00:00Z', '18:00:00Z', '21:00:00Z', '00:00:00Z'];
      
      let baseDate = new Date('2026-06-11');
      let matchCount = 0;

      for (const g of groups) {
        const teams = worldCupGroups[g];
        const [t1, t2, t3, t4] = teams;
        
        // Matchday 1
        matchesToInsert.push({ stage: `المجموعة ${g} - الجولة 1`, home_team: t1, away_team: t2, match_date: new Date(`${baseDate.toISOString().split('T')[0]}T${timeSlots[0]}`).toISOString(), status: 'scheduled' });
        matchesToInsert.push({ stage: `المجموعة ${g} - الجولة 1`, home_team: t3, away_team: t4, match_date: new Date(`${baseDate.toISOString().split('T')[0]}T${timeSlots[1]}`).toISOString(), status: 'scheduled' });
        
        // Matchday 2 (approx 4-5 days later)
        let md2Date = new Date(baseDate);
        md2Date.setDate(md2Date.getDate() + 5);
        matchesToInsert.push({ stage: `المجموعة ${g} - الجولة 2`, home_team: t1, away_team: t3, match_date: new Date(`${md2Date.toISOString().split('T')[0]}T${timeSlots[2]}`).toISOString(), status: 'scheduled' });
        matchesToInsert.push({ stage: `المجموعة ${g} - الجولة 2`, home_team: t4, away_team: t2, match_date: new Date(`${md2Date.toISOString().split('T')[0]}T${timeSlots[3]}`).toISOString(), status: 'scheduled' });
        
        // Matchday 3 (approx 9-10 days later)
        let md3Date = new Date(baseDate);
        md3Date.setDate(md3Date.getDate() + 10);
        matchesToInsert.push({ stage: `المجموعة ${g} - الجولة 3`, home_team: t4, away_team: t1, match_date: new Date(`${md3Date.toISOString().split('T')[0]}T${timeSlots[0]}`).toISOString(), status: 'scheduled' });
        matchesToInsert.push({ stage: `المجموعة ${g} - الجولة 3`, home_team: t2, away_team: t3, match_date: new Date(`${md3Date.toISOString().split('T')[0]}T${timeSlots[0]}`).toISOString(), status: 'scheduled' });
        
        // advance base date by 1 for next group's schedule staggered
        baseDate.setDate(baseDate.getDate() + 1);
        matchCount += 6;
      }

      // Round of 32 (16 Matches) - June 28 - July 3
      let r32Matches = [
        { d: '2026-06-28', t: '20:00:00Z', h: 'وصيف المجموعة A', a: 'وصيف المجموعة B' },
        { d: '2026-06-28', t: '23:00:00Z', h: 'بطل المجموعة A', a: 'أفضل ثالث' },
        { d: '2026-06-29', t: '02:00:00Z', h: 'بطل المجموعة E', a: 'أفضل ثالث' },
        { d: '2026-06-29', t: '05:00:00Z', h: 'بطل المجموعة F', a: 'وصيف المجموعة C' },
        { d: '2026-06-29', t: '23:00:00Z', h: 'بطل المجموعة C', a: 'أفضل ثالث' },
        { d: '2026-06-30', t: '02:00:00Z', h: 'بطل المجموعة I', a: 'أفضل ثالث' },
        { d: '2026-06-30', t: '20:00:00Z', h: 'وصيف المجموعة E', a: 'وصيف المجموعة F' },
        { d: '2026-06-30', t: '23:00:00Z', h: 'وصيف المجموعة I', a: 'وصيف المجموعة J' },
        { d: '2026-07-01', t: '02:00:00Z', h: 'بطل المجموعة J', a: 'وصيف المجموعة H' },
        { d: '2026-07-01', t: '05:00:00Z', h: 'بطل المجموعة D', a: 'أفضل ثالث' },
        { d: '2026-07-01', t: '23:00:00Z', h: 'بطل المجموعة B', a: 'أفضل ثالث' },
        { d: '2026-07-02', t: '02:00:00Z', h: 'بطل المجموعة G', a: 'أفضل ثالث' },
        { d: '2026-07-02', t: '20:00:00Z', h: 'وصيف المجموعة C', a: 'وصيف المجموعة D' },
        { d: '2026-07-02', t: '23:00:00Z', h: 'بطل المجموعة H', a: 'وصيف المجموعة J' },
        { d: '2026-07-03', t: '02:00:00Z', h: 'بطل المجموعة K', a: 'أفضل ثالث' },
        { d: '2026-07-03', t: '05:00:00Z', h: 'بطل المجموعة L', a: 'وصيف المجموعة K' }
      ];

      for (let i = 0; i < r32Matches.length; i++) {
        let m = r32Matches[i];
        // Time is stored as UTC. Here we assume the provided times map to the actual KSA evening/night watch times
        // Example: 20:00:00Z -> 23:00 KSA.
        matchesToInsert.push({ stage: 'دور الـ 32', home_team: m.h, away_team: m.a, match_date: new Date(`${m.d}T${m.t}`).toISOString(), status: 'scheduled' });
      }

      // Round of 16 (8 Matches) - July 4 - July 7
      let r16Date = new Date('2026-07-04');
      for (let i = 1; i <= 8; i++) {
        matchesToInsert.push({ stage: 'دور الـ 16', home_team: `الفائز من دور 32 رقم ${i*2-1}`, away_team: `الفائز من دور 32 رقم ${i*2}`, match_date: new Date(`${r16Date.toISOString().split('T')[0]}T${timeSlots[(i%2)+1]}`).toISOString(), status: 'scheduled' });
        if (i % 2 === 0) r16Date.setDate(r16Date.getDate() + 1);
      }

      // Quarter-finals (4 Matches) - July 9 - July 11
      let qfDate = new Date('2026-07-09');
      for (let i = 1; i <= 4; i++) {
        matchesToInsert.push({ stage: 'ربع النهائي', home_team: `الفائز من دور 16 رقم ${i*2-1}`, away_team: `الفائز من دور 16 رقم ${i*2}`, match_date: new Date(`${qfDate.toISOString().split('T')[0]}T${timeSlots[1]}`).toISOString(), status: 'scheduled' });
        if (i % 2 === 0) qfDate.setDate(qfDate.getDate() + 1);
      }

      // Semi-finals (2 Matches) - July 14 - July 15
      matchesToInsert.push({ stage: 'نصف النهائي', home_team: `الفائز ربع النهائي 1`, away_team: `الفائز ربع النهائي 2`, match_date: new Date(`2026-07-14T19:00:00Z`).toISOString(), status: 'scheduled' });
      matchesToInsert.push({ stage: 'نصف النهائي', home_team: `الفائز ربع النهائي 3`, away_team: `الفائز ربع النهائي 4`, match_date: new Date(`2026-07-15T19:00:00Z`).toISOString(), status: 'scheduled' });

      // Third Place (1 Match) - July 18
      matchesToInsert.push({ stage: 'تحديد المركز الثالث', home_team: `الخاسر نصف النهائي 1`, away_team: `الخاسر نصف النهائي 2`, match_date: new Date(`2026-07-18T19:00:00Z`).toISOString(), status: 'scheduled' });

      // Final (1 Match) - July 19
      matchesToInsert.push({ stage: 'النهائي', home_team: `الفائز نصف النهائي 1`, away_team: `الفائز نصف النهائي 2`, match_date: new Date(`2026-07-19T19:00:00Z`).toISOString(), status: 'scheduled' });

      // Insert all matches in chunks of 50 to avoid big payload limit
      for (let i = 0; i < matchesToInsert.length; i += 50) {
        const batch = matchesToInsert.slice(i, i + 50);
        const { error } = await supabase.from('matches').insert(batch);
        if (error) throw error;
      }

      toast.success(`تم توليد ${matchesToInsert.length} مباراة لكأس العالم 2026 بنجاح!`);
      fetchMatches();
    } catch(e: any) {
      console.error(e);
      toast.error('حدث خطأ أثناء التوليد، راجع وحدة التحكم');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (match?: any) => {
    if (match) {
      setEditId(match.id);
      // format date for datetime-local input
      const date = new Date(match.match_date);
      const formattedDate = date.toISOString().slice(0, 16);
      
      setFormData({
        home_team: match.home_team,
        away_team: match.away_team,
        match_date: formattedDate,
        stage: match.stage,
        status: match.status
      });
    } else {
      setEditId(null);
      setFormData({
        home_team: '',
        away_team: '',
        match_date: '',
        stage: 'المجموعات',
        status: 'scheduled'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // date validation or conversion if needed
      const payload = {
        home_team: formData.home_team,
        away_team: formData.away_team,
        match_date: new Date(formData.match_date).toISOString(),
        stage: formData.stage,
        status: formData.status
      };

      if (editId) {
        await supabase.from('matches').update(payload).eq('id', editId);
      } else {
        await supabase.from('matches').insert([payload]);
      }
      setIsModalOpen(false);
      fetchMatches();
    } catch (e) {
      console.error('Error saving match:', e);
      toast.error('حدث خطأ أثناء حفظ المباراة');
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000); // clear after 3 seconds
      return;
    }

    setDeleteConfirmId(null);
    try {
      setLoading(true);
      // حذف التوقعات والسجلات المرتبطة أولاً لتجنب خطأ مفتاح التخزين
      await supabase.from('evaluation_logs').delete().eq('match_id', id);
      await supabase.from('predictions').delete().eq('match_id', id);
      
      const { error } = await supabase.from('matches').delete().eq('id', id);
      if (error) throw error;
      
      fetchMatches();
    } catch (e: any) {
      console.error('Error deleting match:', e);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black mb-2">إدارة المباريات</h2>
          <p className="text-neutral-500">إضافة وتعديل جدول المباريات</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSeedWorldCup}
            className={`${isConfirmingSeed ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' : 'bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 shadow-neutral-500/10'} px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95`}
          >
            <Wand2 className="w-5 h-5" />
            {isConfirmingSeed ? 'تأكيد التوليد (104 مباراة)؟' : 'توليد مباريات كأس العالم 2026'}
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            إضافة مباراة
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right shrink-0">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-bold text-sm">
                <th className="p-4 w-16">#</th>
                <th className="p-4">المباراة</th>
                <th className="p-4">المجموعة/الدور</th>
                <th className="p-4">التاريخ والوقت</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-neutral-500">جاري التحميل...</td></tr>
              ) : matches.length > 0 ? (
                matches.map((match, idx) => (
                  <tr key={match.id} className="border-b border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 text-neutral-500 font-medium">{idx + 1}</td>
                    <td className="p-4 font-bold min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <span className="flex-1 text-left">{match.home_team}</span>
                        <span className="text-neutral-400 text-sm">ضد</span>
                        <span className="flex-1 text-right">{match.away_team}</span>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-400 font-medium">{match.stage}</td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-400 font-medium">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span dir="ltr">{new Date(match.match_date).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold 
                        ${match.status === 'scheduled' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : ''}
                        ${match.status === 'in_progress' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}
                        ${match.status === 'finished' ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300' : ''}
                      `}>
                        {match.status === 'scheduled' && 'مجدولة'}
                        {match.status === 'in_progress' && 'جارية'}
                        {match.status === 'finished' && 'منتهية'}
                      </span>
                    </td>
                    <td className="p-4 text-left space-x-2 space-x-reverse min-w-[100px]">
                      <button onClick={() => handleOpenModal(match)} className="p-2 text-neutral-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(match.id)} className={`p-2 transition-colors rounded-lg ${deleteConfirmId === match.id ? 'text-white bg-rose-600 hover:bg-rose-700' : 'text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'}`}>
                        {deleteConfirmId === match.id ? <span className="text-xs font-bold px-1 text-white">تأكيد؟</span> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="p-8 text-center text-neutral-500">لا توجد مباريات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-xl">{editId ? 'تعديل مباراة' : 'مباراة جديدة'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">الفريق الأول</label>
                  <input 
                    required
                    value={formData.home_team}
                    onChange={(e) => setFormData({...formData, home_team: e.target.value})}
                    type="text" className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="مثال: السعودية" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">الفريق الثاني</label>
                  <input 
                    required
                    value={formData.away_team}
                    onChange={(e) => setFormData({...formData, away_team: e.target.value})}
                    type="text" className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="مثال: الأرجنتين" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">تاريخ ووقت المباراة</label>
                <input 
                  required
                  value={formData.match_date}
                  onChange={(e) => setFormData({...formData, match_date: e.target.value})}
                  type="datetime-local" className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none dir-ltr" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">المرحلة / المجموعة</label>
                <select 
                  value={formData.stage}
                  onChange={(e) => setFormData({...formData, stage: e.target.value})}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none appearance-none"
                >
                  <option value="المجموعات">المجموعات</option>
                  <option value="دور الـ 32">دور الـ 32</option>
                  <option value="دور الـ 16">دور الـ 16</option>
                  <option value="ربع النهائي">ربع النهائي</option>
                  <option value="نصف النهائي">نصف النهائي</option>
                  <option value="النهائي">النهائي</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold">حالة المباراة</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none appearance-none"
                >
                  <option value="scheduled">مجدولة</option>
                  <option value="in_progress">جارية</option>
                  <option value="finished">منتهية</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-colors">حفظ التغييرات</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 font-bold py-3 rounded-xl transition-colors">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
