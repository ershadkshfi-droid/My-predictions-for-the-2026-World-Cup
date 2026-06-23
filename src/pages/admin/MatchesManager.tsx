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
      setTimeout(() => setIsConfirmingSeed(false), 3000);
      return;
    }
    
    setIsConfirmingSeed(false);
    setLoading(true);

    try {
      // First, clear all existing matches
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

      const matchesToInsert: any[] = [];
      let matchNumber = 1;

      const addMatch = (dateStr: string, timeKSAStr: string, groupOrStage: string, t1: string, t2: string) => {
        const [h, m] = timeKSAStr.split(':');
        let utcHour = parseInt(h) - 3;
        let dateObj = new Date(dateStr);
        if (utcHour < 0) {
          utcHour += 24;
          dateObj.setDate(dateObj.getDate() - 1);
        }
        dateObj.setUTCHours(utcHour, parseInt(m), 0, 0);
        
        matchesToInsert.push({
          stage: groupOrStage,
          home_team: t1,
          away_team: t2,
          match_date: dateObj.toISOString(),
          status: 'scheduled'
        });
      };

      const dates = [
        '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14', '2026-06-15', '2026-06-16',
        '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22',
        '2026-06-23', '2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27'
      ];
      
      const worldCupGroups: Record<string, string[]> = {
        'A': ['المكسيك', 'كوريا الجنوبية', 'التشيك', 'جنوب أفريقيا'],
        'B': ['كندا', 'سويسرا', 'البوسنة والهرسك', 'قطر'],
        'C': ['البرازيل', 'المغرب', 'اسكتلندا', 'هايتي'],
        'D': ['أمريكا', 'باراغواي', 'أستراليا', 'تركيا'],
        'E': ['ألمانيا', 'ساحل العاج', 'الإكوادور', 'كوراساو'],
        'F': ['هولندا', 'اليابان', 'السويد', 'تونس'],
        'G': ['بلجيكا', 'إيران', 'مصر', 'نيوزيلندا'],
        'H': ['إسبانيا', 'الأوروغواي', 'السعودية', 'الرأس الأخضر'],
        'I': ['فرنسا', 'النرويج', 'السنغال', 'العراق'],
        'J': ['الأرجنتين', 'النمسا', 'الجزائر', 'الأردن'],
        'K': ['البرتغال', 'كولومبيا', 'أوزبكستان', 'الكونغو الديمقراطية'],
        'L': ['إنجلترا', 'كرواتيا', 'غانا', 'بنما']
      };

      const timeSlots = ["20:00", "23:00", "02:00", "05:00"];
      const groupsList = ["A","B","C","D","E","F","G","H","I","J","K","L"];
      
      const groupMatches: Record<string, any[]> = {};
      groupsList.forEach(g => {
        const teams = worldCupGroups[g];
        const t1 = teams[0];
        const t2 = teams[1];
        const t3 = teams[2];
        const t4 = teams[3];

        groupMatches[g] = [
          {h: t1, a: t2},
          {h: t3, a: t4},
          {h: t1, a: t3},
          {h: t4, a: t2},
          {h: t4, a: t1},
          {h: t2, a: t3}
        ];
      });

      // Special Match 1 to 8 assignment based on dates
      addMatch('2026-06-11', '23:00', 'المجموعة A - الجولة 1', worldCupGroups['A'][0], worldCupGroups['A'][1]);
      addMatch('2026-06-11', '05:00', 'المجموعة A - الجولة 1', worldCupGroups['A'][2], worldCupGroups['A'][3]);
      addMatch('2026-06-12', '02:00', 'المجموعة B - الجولة 1', worldCupGroups['B'][0], worldCupGroups['B'][1]);
      addMatch('2026-06-12', '05:00', 'المجموعة D - الجولة 1', worldCupGroups['D'][0], worldCupGroups['D'][1]);
      addMatch('2026-06-13', '20:00', 'المجموعة C - الجولة 1', worldCupGroups['C'][0], worldCupGroups['C'][1]);
      addMatch('2026-06-13', '23:00', 'المجموعة C - الجولة 1', worldCupGroups['C'][2], worldCupGroups['C'][3]);
      addMatch('2026-06-13', '02:00', 'المجموعة B - الجولة 1', worldCupGroups['B'][2], worldCupGroups['B'][3]);
      addMatch('2026-06-13', '05:00', 'المجموعة D - الجولة 1', worldCupGroups['D'][2], worldCupGroups['D'][3]);

      let remainingGroupMatches: any[] = [];
      groupsList.forEach(g => {
        const mArr = [...groupMatches[g]];
        if(g==='A' || g==='B' || g==='C' || g==='D') {
          mArr.shift(); mArr.shift(); // Remove the first two matches for A, B, C, D (already handled)
        }
        mArr.forEach((ma, idx) => {
          const round = Math.floor((idx + (g==='A'||g==='B'||g==='C'||g==='D'?2:0)) / 2) + 1;
          remainingGroupMatches.push({ g, round, ...ma });
        });
      });

      let dayIdx = 3; // Start from 2026-06-14
      let matchesToday = 0;
      remainingGroupMatches.forEach((rm) => {
        let maxToday = (dayIdx >= 13) ? 6 : 4;
        let t = timeSlots[matchesToday % 4];
        addMatch(dates[dayIdx], t, `المجموعة ${rm.g} - الجولة ${rm.round}`, rm.h, rm.a);
        
        matchesToday++;
        if(matchesToday >= maxToday) {
          matchesToday = 0;
          if (dayIdx < dates.length - 1) dayIdx++;
        }
      });

      // Round of 32 (16 Matches)
      const r32Dates = ['2026-06-28', '2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03'];
      let idR32 = 1;
      for(let d of r32Dates) {
        let games = (d === '2026-06-28' || d === '2026-07-03') ? 2 : 3;
        for(let i=0; i<games; i++) {
          addMatch(d, timeSlots[Math.floor(Math.random()*4)], 'دور الـ 32', `المركز الأول أو الثاني`, `المركز الثاني أو أفضل ثالث`);
          idR32++;
        }
      }

      // Round of 16 (8 Matches)
      const r16Dates = ['2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07'];
      let idR16 = 1;
      for(let d of r16Dates) {
        for(let i=0; i<2; i++) {
          addMatch(d, i===0?'23:00':'02:00', 'دور الـ 16', `فائز دور 32 رقم ${idR16*2-1}`, `فائز دور 32 رقم ${idR16*2}`);
          idR16++;
        }
      }

      // Quarter Finals (4 Matches)
      addMatch('2026-07-09', '02:00', 'ربع النهائي', 'فائز دور 16 رقم 1', 'فائز دور 16 رقم 2');
      addMatch('2026-07-10', '23:00', 'ربع النهائي', 'فائز دور 16 رقم 3', 'فائز دور 16 رقم 4');
      addMatch('2026-07-10', '02:00', 'ربع النهائي', 'فائز دور 16 رقم 5', 'فائز دور 16 رقم 6');
      addMatch('2026-07-11', '02:00', 'ربع النهائي', 'فائز دور 16 رقم 7', 'فائز دور 16 رقم 8');

      // Semi-finals (2 Matches)
      addMatch('2026-07-14', '02:00', 'نصف النهائي', 'فائز ربع النهائي 1', 'فائز ربع النهائي 2');
      addMatch('2026-07-15', '02:00', 'نصف النهائي', 'فائز ربع النهائي 3', 'فائز ربع النهائي 4');

      // Third Place (1 Match)
      addMatch('2026-07-18', '23:00', 'تحديد المركز الثالث', 'خاسر نصف النهائي 1', 'خاسر نصف النهائي 2');

      // Final (1 Match)
      addMatch('2026-07-19', '23:00', 'النهائي', 'فائز نصف النهائي 1', 'فائز نصف النهائي 2');

      // Insert all calculated 104 matches in chunks
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
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);

  const handleDeleteAll = async () => {
    if (!isConfirmingDeleteAll) {
      setIsConfirmingDeleteAll(true);
      setTimeout(() => setIsConfirmingDeleteAll(false), 3000);
      return;
    }
    
    setIsConfirmingDeleteAll(false);
    setLoading(true);
    try {
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
      toast.success('تم حذف جميع المباريات بنجاح');
      fetchMatches();
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setLoading(false);
    }
  };

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
            onClick={handleDeleteAll}
            className={`${isConfirmingDeleteAll ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' : 'bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-600 dark:bg-neutral-800 dark:hover:bg-red-500/10 dark:text-neutral-400 dark:hover:text-red-400 shadow-sm'} px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95`}
          >
            <Trash2 className="w-5 h-5" />
            {isConfirmingDeleteAll ? 'تأكيد الحذف النهائي؟' : 'حذف الجميع'}
          </button>
          <button 
            onClick={handleSeedWorldCup}
            className={`${isConfirmingSeed ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' : 'bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 shadow-neutral-500/10'} px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95`}
          >
            <Wand2 className="w-5 h-5" />
            {isConfirmingSeed ? 'تأكيد التوليد (104 مباراة)؟' : 'توليد مباريات 2026'}
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
