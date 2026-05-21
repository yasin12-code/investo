const cheerio = require('cheerio');

async function testFetch() {
  const url = 'https://www.zameen.com/Buy/Karachi-2-1.html';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const text = await response.text();
    const $ = cheerio.load(text);
    
    console.log('--- EXTRACTED LISTINGS ---');
    const listings = [];
    
    $('article').each((i, element) => {
      const card = $(element);
      const title = card.find('[aria-label="Title"]').text().trim();
      const priceStr = card.find('[aria-label="Price"]').text().trim();
      const area = card.find('[aria-label="Area"]').text().trim();
      const location = card.find('[aria-label="Location"]').text().trim();
      
      if (title && priceStr) {
        listings.push({ title, priceStr, area, location });
      }
    });
    
    listings.slice(0, 10).forEach((l, idx) => {
      console.log(`Listing #${idx+1}:`);
      console.log(`  Title   : "${l.title}"`);
      console.log(`  Price   : "${l.priceStr}"`);
      console.log(`  Area    : "${l.area}"`);
      console.log(`  Location: "${l.location}"`);
      console.log('------------------------------------');
    });

    console.log(`Total listings successfully parsed: ${listings.length}`);

  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testFetch();
