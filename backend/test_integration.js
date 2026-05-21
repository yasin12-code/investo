const { scrapeZameen } = require('./src/ingestion/zameenScraper');
const { scrapeGraana } = require('./src/ingestion/graanaScraper');
const { rankInvestments } = require('./src/scoring/rankingEngine');

async function runTest() {
  const city = 'Karachi';
  const profile = { location: city, budget: 50000000, targetReturn: 12, riskTolerance: 'moderate' };

  console.log(`\n=== Fetching Zameen.com data for ${city} ===`);
  const zameenData = await scrapeZameen(city);
  console.log(`✅ Zameen: ${zameenData.properties.length} listings`);
  console.log(`   Sources: ${[...new Set(zameenData.properties.map(p => p.source))].join(', ')}`);

  console.log(`\n=== Fetching Graana.com data for ${city} ===`);
  const graanaData = await scrapeGraana(city);
  console.log(`✅ Graana: ${graanaData.properties.length} listings`);
  console.log(`   Sources: ${[...new Set(graanaData.properties.map(p => p.source))].join(', ')}`);

  console.log(`\n=== Running Ranking Engine ===`);
  const ranked = rankInvestments([], profile, zameenData, graanaData);
  console.log(`✅ Total ranked results: ${ranked.length}`);

  const zameenCount = ranked.filter(r => (r.source || '').includes('Zameen')).length;
  const graanaCount = ranked.filter(r => (r.source || '').includes('Graana')).length;
  const otherCount = ranked.length - zameenCount - graanaCount;

  console.log(`\n📊 Results breakdown:`);
  console.log(`   🏠 Zameen.com:  ${zameenCount} results`);
  console.log(`   🏠 Graana.com:  ${graanaCount} results`);
  console.log(`   📋 Other:       ${otherCount} results`);

  console.log(`\n=== Top 10 Ranked Results ===`);
  ranked.slice(0, 10).forEach((r, i) => {
    console.log(`\n  [${i + 1}] ${r.name}`);
    console.log(`       Source: ${r.source}`);
    console.log(`       Price: PKR ${(r.price / 1000000).toFixed(1)}M | Return: ${r.expectedReturn.toFixed(1)}% | Risk: ${r.riskScore}`);
    if (r.subLocation) console.log(`       Area: ${r.subLocation}`);
    if (r.area) console.log(`       Size: ${r.area}`);
  });
}

runTest().catch(console.error);
