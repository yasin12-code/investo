const cheerio = require('cheerio');

async function testUrl(url, label) {
  console.log(`\n===== ${label || url} =====`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.graana.com/'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000)
    });
    console.log(`Status: ${response.status} | Final URL: ${response.url}`);
    if (response.ok) {
      const text = await response.text();
      const $ = cheerio.load(text);
      console.log(`Title: "${$('title').text()}"`);
      console.log(`HTML length: ${text.length}`);
      
      const nextDataRaw = $('#__NEXT_DATA__').html();
      if (nextDataRaw) {
        try {
          const nd = JSON.parse(nextDataRaw);
          const pp = nd?.props?.pageProps;
          console.log(`pageProps keys: ${Object.keys(pp || {}).join(', ')}`);
          // Try to find listing arrays
          const str = JSON.stringify(pp);
          const listingsMatch = str.match(/"(listings|properties|results|items|data)":\[/g);
          if (listingsMatch) console.log(`Possible listing keys found: ${listingsMatch.join(', ')}`);
          // Print first 2000 chars of pageProps
          console.log(`pageProps snippet: ${str.substring(0, 2000)}`);
        } catch(e) {
          console.log(`__NEXT_DATA__ parse error: ${e.message}`);
        }
      } else {
        console.log('No __NEXT_DATA__ found');
      }
      
      // Check for article tags (Zameen style)
      const articles = $('article').length;
      console.log(`Articles: ${articles}`);
    }
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

async function run() {
  // Follow redirects to get real pages
  await testUrl('https://www.graana.com/homes-for-sale/karachi/', 'homes-for-sale/karachi/');
  await testUrl('https://www.graana.com/buy/', 'buy/');
  await testUrl('https://www.graana.com/properties/', 'properties/');
  await testUrl('https://www.graana.com/search/', 'search/');
  
  // Try Graana's internal search API
  const jsonUrls = [
    'https://www.graana.com/_next/data/latest/homes-for-sale/karachi.json',
    'https://www.graana.com/graphql',
  ];
  for (const url of jsonUrls) {
    await testUrl(url, url);
  }
}

run();
