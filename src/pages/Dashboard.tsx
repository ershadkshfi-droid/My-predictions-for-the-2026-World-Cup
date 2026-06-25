import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Trophy, Activity, Target, Flame, Users, CalendarDays, CheckCircle2, XCircle, TrendingUp, Presentation, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

type TabType = 'my-stats' | 'global-stats';

export function Dashboard() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('my-stats');

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl w-full max-w-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'my-stats', label: 'إحصائياتي', icon: Activity },
          { id: 'global-stats', label: 'الإحصائيات العامة', icon: Presentation }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[60vh]">
        {activeTab === 'my-stats' && <MyStats />}
        {activeTab === 'global-stats' && <GlobalStats />}
      </div>
    </div>
  );
}

function MyStats() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    predictions: 0,
    successes: 0,
    failures: 0,
    points: 0,
    successRate: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) return;

    const fetchMyStats = async () => {
      setLoading(true);
      try {
        const { data: myPredictions, error } = await supabase
          .from('predictions')
          .select('*, matches!inner(*)')
          .eq('user_id', userProfile.id);

        if (error) throw error;

        let totalPredictions = myPredictions?.length || 0;
        let successes = 0;
        let failures = 0;
        let points = 0;
        let timeline: any[] = [];

        myPredictions?.forEach(p => {
          // Only evaluate stats for finished matches
          if (p.matches.status === 'finished') {
            points += p.points_earned;
            // A prediction is a success if they earned points
            if (p.points_earned > 0) {
              successes++;
            } else {
              failures++;
            }
            
            timeline.push({
              date: new Date(p.created_at).toLocaleDateString('ar-SA'),
              points: p.points_earned
            });
          }
        });

        const evaluatedTotal = successes + failures;
        const rate = evaluatedTotal > 0 ? Math.round((successes / evaluatedTotal) * 100) : 0;

        setStats({
          predictions: totalPredictions,
          successes,
          failures,
          points,
          successRate: rate
        });
        
        // Group timeline by date
        const groupedMap = new Map();
        timeline.forEach(t => {
           groupedMap.set(t.date, (groupedMap.get(t.date) || 0) + t.points);
        });
        
        const gTimeline = Array.from(groupedMap.keys()).map(k => ({ date: k, points: groupedMap.get(k) }));
        setChartData(gTimeline);
        
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchMyStats();
  }, [userProfile]);

  if (loading) return <div className="p-10 text-center text-neutral-500">جاري التحميل...</div>;

  const pieData = [
    { name: 'نجاح', value: stats.successes, color: '#10b981' },
    { name: 'إخفاق', value: stats.failures, color: '#ef4444' }
  ];

  const lineChartParams = {
    labels: chartData.map(d => d.date),
    datasets: [
      {
        label: 'النقاط',
        data: chartData.map(d => d.points),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const pieChartParams = {
    labels: pieData.map(d => d.name),
    datasets: [
      {
        data: pieData.map(d => d.value),
        backgroundColor: pieData.map(d => d.color),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const handleShare = async () => {
    const text = `توقعاتي في تحدي المونديال 2026 🏆\nالنقاط: ${stats.points}\nنسبة النجاح: %${stats.successRate}\nشارك وتوقع وأثبت مهارتك اليوم!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تحدي التوقعات',
          text: text,
          url: window.location.origin
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(text + '\n' + window.location.origin);
      alert('تم نسخ النص للمشاركة!');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-neutral-500" />
          نظرة عامة على أدائي
        </h2>
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          مشاركة إحصائياتي
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="عدد التوقعات" value={stats.predictions} icon={Target} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
        <StatCard title="عدد النجاحات" value={stats.successes} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatCard title="عدد الإخفاقات" value={stats.failures} icon={XCircle} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-500/10" />
        <StatCard title="مجموع النقاط" value={stats.points} icon={Flame} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
        <StatCard title="نسبة النجاح" value={`${stats.successRate}%`} icon={TrendingUp} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-6">تطور النقاط</h3>
          <div className="w-full h-[250px] flex items-center justify-center">
             <Line data={lineChartParams} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#e5e5e5' } } } }} />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-6">نسبة التوقعات</h3>
          <div className="w-full h-[250px] flex items-center justify-center">
             <Pie data={pieChartParams} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function GlobalStats() {
  const [stats, setStats] = useState({
    usersCount: 0,
    matchesTotal: 0,
    matchesDone: 0,
    matchesUpcoming: 0,
    totalPredictions: 0,
    totalPoints: 0,
    completionRate: 0
  });
  const [topAccuracyUsers, setTopAccuracyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const [usersRes, matchesRes, predsRes, topUsersRes] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact' }),
          supabase.from('matches').select('id, status'),
          supabase.from('predictions').select('points_earned'),
          supabase.from('users').select('*').gt('played_predictions', 0)
        ]);

        const usersCount = usersRes.count || 0;
        const totalM = matchesRes.data?.length || 0;
        const doneM = matchesRes.data?.filter(m => m.status === 'finished').length || 0;
        const upcomingM = totalM - doneM;
        const totalP = predsRes.data?.length || 0;
        const sumPoints = predsRes.data?.reduce((acc, curr) => acc + (curr.points_earned || 0), 0) || 0;
        const completionRate = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;

        setStats({
          usersCount, matchesTotal: totalM, matchesDone: doneM,
          matchesUpcoming: upcomingM, totalPredictions: totalP,
          totalPoints: sumPoints, completionRate
        });

        if (topUsersRes.data) {
          const sorted = topUsersRes.data.map(u => ({
            ...u,
            successRate: Math.round(((u.exact_scores + u.correct_winners) / u.played_predictions) * 100)
          })).sort((a, b) => b.successRate - a.successRate).slice(0, 5);
          setTopAccuracyUsers(sorted);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalStats();
  }, []);

  const barData = [
    { name: 'إجمالي', value: stats.matchesTotal },
    { name: 'منتهية', value: stats.matchesDone },
    { name: 'قادمة', value: stats.matchesUpcoming }
  ];

  const barChartParams = {
    labels: barData.map(d => d.name),
    datasets: [
      {
        label: 'العدد',
        data: barData.map(d => d.value),
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }
    ]
  };

  if (loading) return <div className="p-10 text-center text-neutral-500">جاري التحميل...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard title="المشاركين" value={stats.usersCount} icon={Users} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-500/10" />
          <StatCard title="المباريات" value={stats.matchesTotal} icon={CalendarDays} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
          <StatCard title="منتهية" value={stats.matchesDone} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
          <StatCard title="قادمة" value={stats.matchesUpcoming} icon={Clock} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
          <StatCard title="التوقعات" value={stats.totalPredictions} icon={Target} color="text-fuchsia-500" bg="bg-fuchsia-50 dark:bg-fuchsia-500/10" />
          <StatCard title="النقاط" value={stats.totalPoints} icon={Flame} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-500/10" />
          <StatCard title="الإنجاز" value={`${stats.completionRate}%`} icon={Activity} color="text-teal-500" bg="bg-teal-50 dark:bg-teal-500/10" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6">حالة المباريات</h3>
            <div className="w-full h-[250px]">
               <Bar data={barChartParams} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#e5e5e5' } } } }} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6">أكثر المستخدمين دقة</h3>
            <div className="space-y-4">
              {topAccuracyUsers.map((user, idx) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-neutral-400 w-4 text-center">{idx + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden border border-emerald-200 dark:border-emerald-800">
                       <img 
                         src={user.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}&backgroundColor=b6e3f4`} 
                         alt={user.username} 
                         className="w-full h-full object-cover" 
                         onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}&backgroundColor=b6e3f4` }}
                       />
                    </div>
                    <span className="font-bold">{user.username}</span>
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-emerald-600 dark:text-emerald-400">{user.successRate}%</span>
                    <span className="text-xs text-neutral-500">من {user.played_predictions} توقعات</span>
                  </div>
                </div>
              ))}
              {topAccuracyUsers.length === 0 && (
                <div className="text-center text-neutral-500 py-10">لا توجد توقعات ملعوبة حتى الآن</div>
              )}
            </div>
          </div>
       </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className={`rounded-3xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-sm relative overflow-hidden bg-white dark:bg-neutral-900`}>
       <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
         <Icon className={`w-6 h-6 ${color}`} />
       </div>
       <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold mb-1">{title}</p>
       <h4 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{value}</h4>
    </div>
  );
}
