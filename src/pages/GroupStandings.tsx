import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ListOrdered } from 'lucide-react';
import { motion } from 'motion/react';
import { TeamFlag } from '../components/TeamFlag';

interface TeamStats {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

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

export function GroupStandings() {
  const [standings, setStandings] = useState<Record<string, TeamStats[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatchesAndCompute();
  }, []);

  const fetchMatchesAndCompute = async () => {
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .like('stage', 'المجموعة%');

      if (error) throw error;

      // Initialize standings
      const initialStandings: Record<string, TeamStats[]> = {};
      for (const [groupName, teams] of Object.entries(worldCupGroups)) {
        initialStandings[groupName] = teams.map(team => ({
          name: team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          points: 0
        }));
      }

      // Compute if there are matches
      if (matches) {
        for (const match of matches) {
          if (match.status !== 'finished') continue;

          // match.stage format "المجموعة A - الجولة 1" -> extract 'A'
          const groupMatch = match.stage.match(/المجموعة\s([A-L])/);
          if (!groupMatch) continue;
          
          const groupName = groupMatch[1];
          const homeTeam = match.home_team;
          const awayTeam = match.away_team;
          const homeScore = match.home_score ?? 0;
          const awayScore = match.away_score ?? 0;

          const group = initialStandings[groupName];
          if (!group) continue;

          const homeStats = group.find(t => t.name === homeTeam);
          const awayStats = group.find(t => t.name === awayTeam);

          if (homeStats && awayStats) {
            homeStats.played += 1;
            awayStats.played += 1;
            
            homeStats.gf += homeScore;
            homeStats.ga += awayScore;
            homeStats.gd = homeStats.gf - homeStats.ga;

            awayStats.gf += awayScore;
            awayStats.ga += homeScore;
            awayStats.gd = awayStats.gf - awayStats.ga;

            if (homeScore > awayScore) {
              homeStats.won += 1;
              awayStats.lost += 1;
              homeStats.points += 3;
            } else if (homeScore < awayScore) {
              awayStats.won += 1;
              homeStats.lost += 1;
              awayStats.points += 3;
            } else {
              homeStats.drawn += 1;
              awayStats.drawn += 1;
              homeStats.points += 1;
              awayStats.points += 1;
            }
          }
        }
      }

      // Sort teams within each group
      for (const groupName in initialStandings) {
        initialStandings[groupName].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        });
      }

      setStandings(initialStandings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-500/20 border-t-slate-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
          <ListOrdered className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="text-center sm:text-right">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">ترتيب المجموعات</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            تابع حالة وترتيب المنتخبات في كل مجموعة خلال بطولة كأس العالم 2026.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(standings).map((groupName, idx) => (
          <motion.div
            key={groupName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="font-bold text-lg text-neutral-900 dark:text-white">المجموعة {groupName}</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-right whitespace-nowrap">
                <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 font-bold border-b border-neutral-100 dark:border-neutral-800">
                  <tr>
                    <th className="py-3 px-4 w-8 text-center">#</th>
                    <th className="py-3 px-2 text-right">المنتخب</th>
                    <th className="py-3 px-2 text-center" title="لعب">ل</th>
                    <th className="py-3 px-2 text-center" title="فاز">ف</th>
                    <th className="py-3 px-2 text-center" title="تعادل">ت</th>
                    <th className="py-3 px-2 text-center" title="خسر">خ</th>
                    <th className="py-3 px-2 text-center" title="فارق الأهداف">+/-</th>
                    <th className="py-3 px-4 text-center font-black">نقاط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {standings[groupName].map((team, rank) => (
                    <tr key={team.name} className={`${rank < 2 ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''} hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors`}>
                      <td className={`py-3 px-4 text-center font-bold ${rank < 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`}>
                        {rank + 1}
                      </td>
                      <td className="py-3 px-2 font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                        <TeamFlag team={team.name} className="w-8 h-5" />
                        {team.name}
                      </td>
                      <td className="py-3 px-2 text-center text-neutral-600 dark:text-neutral-400">{team.played}</td>
                      <td className="py-3 px-2 text-center text-neutral-600 dark:text-neutral-400">{team.won}</td>
                      <td className="py-3 px-2 text-center text-neutral-600 dark:text-neutral-400">{team.drawn}</td>
                      <td className="py-3 px-2 text-center text-neutral-600 dark:text-neutral-400">{team.lost}</td>
                      <td className="py-3 px-2 text-center text-neutral-600 dark:text-neutral-400" dir="ltr">
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-indigo-600 dark:text-indigo-400 text-base">
                        {team.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 flex gap-4 justify-center">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> تأهل مباشر</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
