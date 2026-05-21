function filterNoise(parsedFeedData) {
  const clean = [];
  const filtered = [];
  const filterLog = [];
  
  if (!parsedFeedData || !parsedFeedData.entries) return { clean, filtered, filterLog };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const seenIds = new Set();
  const seenHeadlines = new Set();

  for (const entry of parsedFeedData.entries) {
    let isNoise = false;
    let reason = '';

    // 1. Check staleness
    const entryDate = new Date(entry.timestamp);
    if (entryDate < sixMonthsAgo || entry.is_stale) {
      isNoise = true;
      reason = 'Stale data (older than 6 months)';
    }
    
    // 2. Check corruption
    else if (entry.is_corrupt || entry.value === null) {
      isNoise = true;
      reason = 'Corrupt data (null value or error)';
    }
    
    // 3. Check duplicate
    else if (seenIds.has(entry.id) || (entry.headline && seenHeadlines.has(entry.headline))) {
      isNoise = true;
      reason = 'Duplicate entry';
    }
    
    // 4. Low credibility/spam
    else if (entry.confidence < 0.3) {
      isNoise = true;
      reason = 'Low confidence / spam-like content';
    }

    if (isNoise) {
      filtered.push(entry);
      filterLog.push({ id: entry.id, reason });
    } else {
      clean.push(entry);
      seenIds.add(entry.id);
      if (entry.headline) seenHeadlines.add(entry.headline);
    }
  }

  // Return clean data mimicking the original structure for seamless integration
  return {
    cleanFeed: {
       ...parsedFeedData,
       entries: clean
    },
    filterLog
  };
}

module.exports = { filterNoise };
