const { scrapeZameen } = require('./src/ingestion/zameenScraper');

async function runTest() {
  console.log('Testing scrapeZameen for Karachi...');
  const resultKHI = await scrapeZameen('Karachi');
  console.log('Karachi parsed count:', resultKHI.properties.length);
  console.log('First property:', resultKHI.properties[0]);

  console.log('\nTesting scrapeZameen for Lahore...');
  const resultLHR = await scrapeZameen('Lahore');
  console.log('Lahore parsed count:', resultLHR.properties.length);
  console.log('First property:', resultLHR.properties[0]);

  console.log('\nTesting scrapeZameen for Islamabad...');
  const resultISB = await scrapeZameen('Islamabad');
  console.log('Islamabad parsed count:', resultISB.properties.length);
  console.log('First property:', resultISB.properties[0]);
}

runTest().catch(console.error);
