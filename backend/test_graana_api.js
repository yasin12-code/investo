async function testGraanaApi() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.graana.com/',
  };

  // First, dump a full item to understand structure
  console.log('=== Full first item from Graana API ===');
  const r0 = await fetch('https://www.graana.com/api/property?cityId=169&purpose=sale&page=1&limit=5', { headers, signal: AbortSignal.timeout(12000) });
  const d0 = await r0.json();
  if (d0.items && d0.items.length > 0) {
    const item = d0.items[0];
    console.log(JSON.stringify(item, null, 2));
    console.log('\nCity object:', JSON.stringify(item.city));
    console.log('Area object:', JSON.stringify(item.area));
    console.log('Title:', item.title);
    console.log('custom_title:', item.custom_title);
  }

  // Try with different cityId param names
  const paramVariants = [
    `cityId=169&purpose=sale&page=1&limit=5`,
    `city_id=169&purpose=sale&page=1&limit=5`,
    `city=169&purpose=sale&page=1&limit=5`,
    `cityId=169&purpose=buy&page=1&limit=5`,
    `cityId=169&limit=5`,
    // Check if maybe cityId 169 IS Karachi and items just show different city_id due to a bug
    // Verify by checking item city names
    `cityId=1&purpose=sale&page=1&limit=3`, // Islamabad
    `cityId=2&purpose=sale&page=1&limit=3`, // Lahore
    `cityId=3&purpose=sale&page=1&limit=3`, // Rawalpindi
    `cityId=169&purpose=sale&page=1&limit=3`, // Karachi
  ];

  for (const params of paramVariants) {
    const url = `https://www.graana.com/api/property?${params}`;
    console.log(`\n--- ${url} ---`);
    try {
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      console.log(`Status: ${r.status}`);
      if (r.ok) {
        const d = await r.json();
        console.log(`Total: ${d.total}, Items: ${d.items?.length}`);
        if (d.items) {
          d.items.slice(0, 2).forEach((item, i) => {
            console.log(`  [${i}] city_id=${item.city_id} city.name=${item.city?.name} area.name=${item.area?.name} price=${item.price} title="${item.title || item.custom_title}"`);
          });
        }
      }
    } catch(e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

testGraanaApi();
