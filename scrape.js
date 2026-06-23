import * as cheerio from 'cheerio';

async function scrape() {
  const res = await fetch('https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=GR&wtw-filter=ALL', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const text = await res.text();
  const $ = cheerio.load(text);
  console.log("Title: ", $('title').text());
  
  // They are rendered using React and probably the games are inside some script tag
  console.log("Text snippet: ", $('body').text().substring(0, 1000));
}

scrape();
