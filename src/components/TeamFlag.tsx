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
    'الكونغو الديمقراطية': 'cd'
  };
  return codeMap[team];
};

export const TeamFlag = ({ team, className = "w-10 h-7" }: { team: string, className?: string }) => {
  const iso = getIsoCode(team);
  if (iso) {
    return <img src={`https://flagcdn.com/${iso}.svg`} alt={team} className={`object-cover rounded-sm shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 ${className}`} />;
  }
  return <span className="text-3xl">🏳️</span>;
};
