import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarDays, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { TeamFlag } from '../components/TeamFlag';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  stage: string;
  status: string;
}

export function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      if (error) throw error;
      if (data) {
        setMatches(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Group matches by date
  const groupedMatches = matches.reduce((acc, match) => {
    const dateStr = new Date(match.match_date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Riyadh' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
          <CalendarDays className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-center sm:text-right">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">جدول المباريات الكامل</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            جميع مباريات كأس العالم 2026 مجدولة حتى النهائي
          </p>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-neutral-500 font-medium text-lg">لم يتم إدراج أي مباريات حتى الآن.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedMatches).map(([dateLabel, dayMatches], idx) => (
            <motion.div 
              key={dateLabel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-black text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                {dateLabel}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayMatches.map((match) => (
                  <div key={match.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center text-xs font-bold text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                      <span className="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">{match.stage}</span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(match.match_date)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between px-2">
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <TeamFlag team={match.home_team} />
                        <span className="font-bold text-sm text-center text-neutral-800 dark:text-neutral-200">{match.home_team}</span>
                      </div>
                      
                      <div className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-black rounded-lg text-sm">
                        VS
                      </div>
                      
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <TeamFlag team={match.away_team} />
                        <span className="font-bold text-sm text-center text-neutral-800 dark:text-neutral-200">{match.away_team}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
