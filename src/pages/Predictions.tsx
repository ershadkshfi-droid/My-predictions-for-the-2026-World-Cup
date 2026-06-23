import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Check, Clock, AlertCircle, Trophy } from 'lucide-react';

import { TeamFlag } from '../components/TeamFlag';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  stage: string;
  status: string;
}

interface Prediction {
  id: string;
  match_id: string;
  winner_prediction: 'home' | 'away' | 'draw';
  home_score: number;
  away_score: number;
  penalty_prediction: 'none' | 'home' | 'away';
  points_earned: number;
}

export function Predictions() {
  const { userProfile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (userProfile?.id) {
      fetchTodayMatches();
    }
    
    // Timer to update the date and refresh matches if the day changes
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== currentDate.getDate()) {
        setCurrentDate(now);
        if (userProfile?.id) fetchTodayMatches();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(timer);
  }, [userProfile, currentDate]);

  const fetchTodayMatches = async () => {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .gte('match_date', todayStart.toISOString())
        .lte('match_date', todayEnd.toISOString())
        .order('match_date', { ascending: true });

      if (matchesError) throw matchesError;

      if (matchesData) {
        setMatches(matchesData);
        
        const matchIds = matchesData.map(m => m.id);
        if (matchIds.length > 0) {
          const { data: predictionsData, error: predictionsError } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', userProfile?.id)
            .in('match_id', matchIds);

          if (predictionsError) throw predictionsError;

          if (predictionsData) {
            const predsMap: Record<string, Prediction> = {};
            predictionsData.forEach(p => {
              predsMap[p.match_id] = p;
            });
            setPredictions(predsMap);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (
    matchId: string, 
    winner: 'home' | 'away' | 'draw', 
    homeScore: number, 
    awayScore: number, 
    penalty: 'none' | 'home' | 'away'
  ) => {
    if (!userProfile?.id) return;
    setSavingId(matchId);
    try {
      const newPrediction = {
        user_id: userProfile.id,
        match_id: matchId,
        winner_prediction: winner,
        home_score: homeScore,
        away_score: awayScore,
        penalty_prediction: penalty
      };

      const { data, error } = await supabase
        .from('predictions')
        .insert([newPrediction])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setPredictions(prev => ({ ...prev, [matchId]: data }));
      }
    } catch (e) {
      console.error('Error saving prediction:', e);
      toast.error('حدث خطأ أثناء حفظ التوقع. ربما تكون قد توقعت هذه المباراة مسبقاً.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center gap-5 shadow-sm text-center sm:text-right">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
          <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">مباريات اليوم</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-3 text-sm">
            {currentDate.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Riyadh' })}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
            <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-emerald-500"/> الجوائز: الفائز (2 نقطة)</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-500"/> النتيجة (3 نقاط)</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4 text-emerald-500"/> ركلة الجزاء (1 نقطة)</span>
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-neutral-500 font-medium text-lg">لا توجد مباريات مقررة لهذا اليوم.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {matches.map(match => {
            const prediction = predictions[match.id];
            return (
              <PredictionCard 
                key={match.id} 
                match={match} 
                prediction={prediction} 
                isSaving={savingId === match.id}
                onSave={(w, h, a, p) => handlePredict(match.id, w, h, a, p)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function PredictionCard({ 
  match, 
  prediction, 
  isSaving, 
  onSave 
}: { 
  match: Match, 
  prediction?: Prediction, 
  isSaving: boolean,
  onSave: (winner: 'home' | 'away' | 'draw', home: number, away: number, penalty: 'none' | 'home' | 'away') => void 
}) {
  const [winner, setWinner] = useState<'home' | 'away' | 'draw' | ''>(prediction?.winner_prediction ?? '');
  const [homeScore, setHomeScore] = useState<number | ''>(prediction?.home_score ?? '');
  const [awayScore, setAwayScore] = useState<number | ''>(prediction?.away_score ?? '');
  const [penalty, setPenalty] = useState<'none' | 'home' | 'away'>(prediction?.penalty_prediction ?? 'none');

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (prediction) return; // Stop counting if already predicted and closed
    const matchDate = new Date(match.match_date);
    if (now.getTime() > matchDate.getTime()) return; // Stop counting if match started
    
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [match.match_date, prediction]);

  const matchDate = new Date(match.match_date);
  const msToMatch = matchDate.getTime() - now.getTime();
  const msToLock = msToMatch - (60 * 60 * 1000); // Closes exactly 1 hour before

  const isLockedTime = msToLock <= 0;
  const matchStarted = msToMatch <= 0;
  
  const isLocked = isLockedTime || match.status !== 'scheduled' || !!prediction;

  const canSave = !isLocked && winner !== '' && typeof homeScore === 'number' && typeof awayScore === 'number';

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' });
  };
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', timeZone: 'Asia/Riyadh' });
  };

  const renderTimer = () => {
    if (prediction) {
      if (match.status === 'finished') {
        return (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-bold">
            <Check className="w-4 h-4" />
            <span>انتهت المباراة (النقاط: {prediction.points_earned})</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-bold">
          <Check className="w-4 h-4" />
          <span>تم اعتماد التوقع نهائياً</span>
        </div>
      );
    }
    
    if (matchStarted) {
      return (
        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-full text-xs font-bold">
          <AlertCircle className="w-4 h-4" />
          <span dir="ltr">Locked تم إغلاق التوقعات</span>
        </div>
      );
    }

    if (isLockedTime) {
      return (
        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-full text-xs font-bold">
          <AlertCircle className="w-4 h-4" />
          <span>مغلق, تبدأ المباراة قريباً</span>
        </div>
      );
    }

    // Countdown if less than 1 hour remains to Lock
    if (msToLock > 0 && msToLock <= 60 * 60 * 1000) {
      const min = Math.floor(msToLock / 1000 / 60);
      const sec = Math.floor((msToLock / 1000) % 60);
      return (
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full text-sm font-bold animate-pulse">
          <Clock className="w-4 h-4" />
          <span>يغلق التوقع بعد {min}:{sec.toString().padStart(2, '0')}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 dark:border-neutral-800 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700">
            {match.stage}
          </span>
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-sm font-bold">
            <Clock className="w-4 h-4" />
            <span>{formatDate(match.match_date)} - الساعة {formatTime(match.match_date)}</span>
          </div>
        </div>
        {renderTimer()}
      </div>

      <div className="p-6 md:p-8 space-y-10">
        
        {/* Match Teams Header */}
        <div className="flex items-center justify-center gap-8 md:gap-16">
          <div className="flex flex-col items-center gap-3 flex-1">
            <TeamFlag team={match.home_team} className="w-16 h-11 md:w-24 md:h-16" />
            <h3 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white text-center">{match.home_team}</h3>
          </div>
          
          <div className="text-2xl md:text-3xl font-black text-neutral-300 dark:text-neutral-700">VS</div>
          
          <div className="flex flex-col items-center gap-3 flex-1">
            <TeamFlag team={match.away_team} className="w-16 h-11 md:w-24 md:h-16" />
            <h3 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white text-center">{match.away_team}</h3>
          </div>
        </div>

        {/* Prediction Form */}
        <div className="max-w-2xl mx-auto space-y-10">
          
          {/* Section 1: Winner */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
              <h4 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">توقع الفائز</h4>
              <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md">2 نقطة</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'home', label: match.home_team },
                { id: 'draw', label: 'تعادل' },
                { id: 'away', label: match.away_team }
              ].map(opt => (
                <button
                  key={opt.id}
                  disabled={isLocked}
                  onClick={() => setWinner(opt.id as any)}
                  className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border-2
                    ${winner === opt.id 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' 
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-emerald-200 dark:hover:border-emerald-800 text-neutral-600 dark:text-neutral-400'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Score */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
              <h4 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">توقع النتيجة</h4>
              <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md">3 نقاط</span>
            </div>
            <div className="flex justify-center items-center gap-6" dir="ltr">
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-neutral-500">{match.home_team}</span>
                <input
                  type="number" min="0" max="20"
                  value={homeScore === '' ? '' : homeScore}
                  onChange={e => setHomeScore(e.target.value !== '' ? parseInt(e.target.value) : '')}
                  disabled={isLocked}
                  className="w-20 h-24 text-center text-4xl font-black bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none disabled:opacity-70 disabled:bg-neutral-50 dark:disabled:bg-neutral-900 transition-all"
                  placeholder="-"
                />
              </div>
              <span className="text-4xl font-black text-neutral-300 dark:text-neutral-700 mt-6">:</span>
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-neutral-500">{match.away_team}</span>
                <input
                  type="number" min="0" max="20"
                  value={awayScore === '' ? '' : awayScore}
                  onChange={e => setAwayScore(e.target.value !== '' ? parseInt(e.target.value) : '')}
                  disabled={isLocked}
                  className="w-20 h-24 text-center text-4xl font-black bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none disabled:opacity-70 disabled:bg-neutral-50 dark:disabled:bg-neutral-900 transition-all"
                  placeholder="-"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Penalty */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
              <h4 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">توقع ركلة الجزاء</h4>
              <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md">1 نقطة</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'none', label: 'لا توجد ركلة جزاء' },
                { id: 'home', label: `ركلة جزاء لعرقلة ${match.home_team}` },
                { id: 'away', label: `ركلة جزاء لعرقلة ${match.away_team}` }
              ].map(opt => (
                <button
                  key={opt.id}
                  disabled={isLocked}
                  onClick={() => setPenalty(opt.id as any)}
                  className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border-2
                    ${penalty === opt.id 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' 
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-emerald-200 dark:hover:border-emerald-800 text-neutral-600 dark:text-neutral-400'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Button */}
        {!prediction && (
          <div className="mt-10 flex justify-center border-t border-neutral-100 dark:border-neutral-800 pt-8">
            <button
              onClick={() => winner && typeof homeScore === 'number' && typeof awayScore === 'number' && onSave(winner as any, homeScore, awayScore, penalty)}
              disabled={!canSave || isSaving}
              className={`px-10 py-4 rounded-2xl font-bold text-lg min-w-[250px] transition-all
                ${canSave 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-[0.98] transform' 
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'}`}
            >
              {isSaving ? 'جاري الحفظ...' : isLocked ? 'التوقع مغلق' : 'حفظ التوقع'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
