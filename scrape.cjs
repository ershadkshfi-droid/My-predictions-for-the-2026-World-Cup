import * as cheerio from 'cheerio';

async function scrape() {
  const res = await fetch('https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=GR&wtw-filter=ALL', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const text = await res.text();
  const $ = cheerio.load(text);
  console.log("Title: ", $('title').text());
  
  // Try to find the react state
  const scripts = $('script').toArray();
  for (let s of scripts) {
    const content = $(s).html();
    if (content && content.includes('__NEXT_DATA__')) {
       console.log("Found Next data!");
    }
  }
}

scrape();
