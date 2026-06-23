const fs = require('fs');
fetch('https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=GR&wtw-filter=ALL')
  .then(r => r.text())
  .then(html => {
    fs.writeFileSync('fifa.html', html);
    console.log("Saved to fifa.html. Length:", html.length);
  })
  .catch(console.error);
