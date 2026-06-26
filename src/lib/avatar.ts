export function getDefaultAvatar(seed: string, bgColor: string = 'b6e3f4') {
  // Use a mix of short hair and neutral clothes to ensure a male appearance
  const top = 'shortHair,shortHairDreads01,shortHairDreads02,shortHairFrizzle,shortHairShaggyMullet,shortHairShortCurly,shortHairShortFlat,shortHairShortRound,shortHairShortWaved,shortHairSides,shortHairTheCaesar,shortHairTheCaesarSidePart';
  const clothing = 'blazerAndShirt,blazerAndSweater,collarAndSweater,graphicShirt,hoodie,overall,shirtCrewNeck,shirtScoopNeck,shirtVNeck';
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bgColor}&top=${top}&clothing=${clothing}`;
}
