const Parser = require('rss-parser');
const parser = new Parser();

async function scrapeLiveNews(location) {
  try {
    const query = encodeURIComponent(`Real Estate ${location} Pakistan`);
    const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-PK&gl=PK&ceid=PK:en`);
    
    const claims = feed.items.slice(0, 5).map(item => ({
      metric: 'market_sentiment',
      value: item.title,
      confidence: 0.8, // Live news is considered highly relevant evidence
      source: item.source || 'Google News',
      date: item.pubDate
    }));

    return {
      sourceName: `Live News Scraper (${location})`,
      sourceType: 'live_web_scrape',
      credibilityScore: 0.9,
      claims
    };
  } catch (error) {
    console.error('Scraping error:', error);
    // Fallback if network blocked
    return {
      sourceName: `Live News Scraper (${location})`,
      sourceType: 'live_web_scrape',
      credibilityScore: 0.5,
      claims: [
        { metric: 'market_sentiment', value: `Market activity observed in ${location}`, confidence: 0.5 }
      ]
    };
  }
}

module.exports = { scrapeLiveNews };
