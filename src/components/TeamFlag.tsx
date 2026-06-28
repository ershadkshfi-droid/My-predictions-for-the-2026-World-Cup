import { Flag } from 'lucide-react';

const getIsoCode = (team: string) => {
  const codeMap: Record<string, string> = {
    'السعودية': 'sa', 'البرازيل': 'br', 'الأرجنتين': 'ar', 'فرنسا': 'fr',
    'المغرب': 'ma', 'قطر': 'qa', 'تونس': 'tn', 'مصر': 'eg', 'الجزائر': 'dz',
    'ألمانيا': 'de', 'إسبانيا': 'es', 'إنجلترا': 'gb-eng', 'البرتغال': 'pt',
    'إيطاليا': 'it', 'هولندا': 'nl', 'كرواتيا': 'hr', 'بلجيكا': 'be',
    'اليابان': 'jp', 'كوريا الجنوبية': 'kr', 'السنغال': 'sn', 'المكسيك': 'mx',
    'كندا': 'ca', 'أمريكا': 'us', 'ويلز': 'gb-wls', 'أستراليا': 'au',
    'الكاميرون': 'cm', 'غانا': 'gh', 'الأوروغواي': 'uy', 'صربيا': 'rs',
    'سويسرا': 'ch', 'الدنمارك': 'dk', 'بولندا': 'pl', 'إيران': 'ir',
    'نيوزيلندا': 'nz', 'نيجيريا': 'ng', 'بيرو': 'pe', 'جنوب أفريقيا': 'za',
    'مالي': 'ml', 'كولومبيا': 'co', 'جامايكا': 'jm', 'الإكوادور': 'ec',
    'كوستاريكا': 'cr', 'بنما': 'pa', 'تشيلي': 'cl', 'عمان': 'om',
    'أوزبكستان': 'uz', 'هندوراس': 'hn', 'السويد': 'se', 'العراق': 'iq',
    'التشيك': 'cz', 'البوسنة والهرسك': 'ba', 'اسكتلندا': 'gb-sct', 'هايتي': 'ht',
    'باراغواي': 'py', 'تركيا': 'tr', 'ساحل العاج': 'ci', 'كوراساو': 'cw',
    'الرأس الأخضر': 'cv', 'النرويج': 'no', 'النمسا': 'at', 'الأردن': 'jo',
    'الكونغو الديمقراطية': 'cd',
    
    // Aliases for common manual entry typos
    'الارجنتين': 'ar', 'اسبانيا': 'es', 'أسبانيا': 'es', 'المانيا': 'de',
    'ايطاليا': 'it', 'انجلترا': 'gb-eng', 'اوروغواي': 'uy', 'الاوروغواي': 'uy',
    'امريكا': 'us', 'الولايات المتحدة': 'us', 'كولومبيا ': 'co', 'جنوب افريقيا': 'za',
    'ايران': 'ir', 'اكوادور': 'ec', 'الاكوادور': 'ec', 'اوزبكستان': 'uz', 'استراليا': 'au'
  };
  
  // Normalize Arabic text: remove spaces, convert أ,إ,آ to ا, convert ة to ه, convert ي to ى (sometimes)
  const normalizedTeam = team?.trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه');
    
  const normalizedCodeMap: Record<string, string> = {};
  for (const [key, value] of Object.entries(codeMap)) {
    const normKey = key.trim()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه');
    normalizedCodeMap[normKey] = value;
  }

  return codeMap[team?.trim()] || normalizedCodeMap[normalizedTeam];
};

export const TeamFlag = ({ team, className = "w-10 h-7" }: { team: string, className?: string }) => {
  const iso = getIsoCode(team);
  if (iso) {
    return <img src={`https://flagcdn.com/${iso}.svg`} alt={team} className={`object-cover rounded-sm shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 ${className}`} />;
  }
  return (
    <div className={`bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center border border-neutral-200 dark:border-neutral-700 ${className} overflow-hidden`}>
      <Flag className="w-1/2 h-1/2 text-neutral-300 dark:text-neutral-600" />
    </div>
  );
};
