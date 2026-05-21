const { scrapeGraana } = require('./src/ingestion/graanaScraper');

async function runTest() {
  console.log('==================================================');
  console.log('🚀 STANDALONE GRAANA SCRAPER TEST RUN');
  console.log('==================================================');

  console.log('\n[1/3] Testing scrapeGraana for Karachi...');
  const resultKHI = await scrapeGraana('Karachi');
  console.log('✅ Karachi parsed property count:', resultKHI.properties.length);
  console.log('Credibility Score:', resultKHI.credibilityScore);
  console.log('First property example:', JSON.stringify(resultKHI.properties[0], null, 2));

  console.log('\n[2/3] Testing scrapeGraana for Lahore...');
  const resultLHR = await scrapeGraana('Lahore');
  console.log('✅ Lahore parsed property count:', resultLHR.properties.length);
  console.log('Credibility Score:', resultLHR.credibilityScore);
  console.log('First property example:', JSON.stringify(resultLHR.properties[0], null, 2));

  console.log('\n[3/3] Testing scrapeGraana for Islamabad...');
  const resultISB = await scrapeGraana('Islamabad');
  console.log('✅ Islamabad parsed property count:', resultISB.properties.length);
  console.log('Credibility Score:', resultISB.credibilityScore);
  console.log('First property example:', JSON.stringify(resultISB.properties[0], null, 2));

  console.log('\n==================================================');
  console.log('🎉 ALL GRAANA SCRAPER TESTS COMPLETED');
  console.log('==================================================');
}

runTest().catch(err => {
  console.error('❌ Standalone Graana test failed:', err);
});
