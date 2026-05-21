const cheerio = require('cheerio');

async function extractNextData() {
  console.log('Fetching Graana homepage to extract __NEXT_DATA__ and build hash...');
  try {
    const response = await fetch('https://www.graana.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000)
    });

    const text = await response.text();
    const $ = cheerio.load(text);

    // Extract build hash from _next/static script tags
    const scripts = [];
    $('script[src*="/_next/static/"]').each((i, el) => {
      scripts.push($(el).attr('src'));
    });
    console.log('\nNext.js static scripts found:');
    scripts.slice(0, 10).forEach(s => console.log(' ', s));

    // Find build ID from __NEXT_DATA__
    const nextDataRaw = $('#__NEXT_DATA__').html();
    if (nextDataRaw) {
      const nd = JSON.parse(nextDataRaw);
      console.log('\nbuildId:', nd.buildId);
      console.log('page:', nd.page);
      console.log('assetPrefix:', nd.assetPrefix);
      console.log('runtimeConfig:', JSON.stringify(nd.runtimeConfig));
      console.log('\nprops keys:', Object.keys(nd.props || {}));
      console.log('pageProps keys:', Object.keys(nd.props?.pageProps || {}));
      
      // Try to find search/listing related data
      const ppStr = JSON.stringify(nd.props?.pageProps);
      console.log('\nPageProps (first 3000 chars):', ppStr.substring(0, 3000));

      // Save full __NEXT_DATA__ to file for inspection
      const fs = require('fs');
      fs.writeFileSync('graana_nextdata.json', nextDataRaw);
      console.log('\n✅ Full __NEXT_DATA__ saved to graana_nextdata.json');

      // Try the _next/data URL with actual buildId
      if (nd.buildId) {
        const buildId = nd.buildId;
        const testPaths = [
          `https://www.graana.com/_next/data/${buildId}/index.json`,
          `https://www.graana.com/_next/data/${buildId}/properties-for-sale/karachi.json`,
          `https://www.graana.com/_next/data/${buildId}/buy/karachi.json`,
        ];
        console.log('\nTesting _next/data URLs with buildId:', buildId);
        for (const url of testPaths) {
          const r = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(8000)
          });
          console.log(`  ${url} -> ${r.status}`);
          if (r.ok) {
            const data = await r.json();
            console.log('  Keys:', Object.keys(data));
          }
        }
      }
    }

    // Also check for any XHR/API calls embedded in page JS
    console.log('\n--- Searching for API endpoints in inline scripts ---');
    $('script:not([src])').each((i, el) => {
      const code = $(el).html() || '';
      if (code.includes('/api/') || code.includes('graana.com/v') || code.includes('fetchProperties')) {
        console.log(`Script ${i}:`, code.substring(0, 500));
      }
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
}

extractNextData();
