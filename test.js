const http = require('http');

const data = JSON.stringify({
  location: "Lahore",
  budget: 50000000,
  targetReturn: 15,
  riskTolerance: "Moderate",
  timeHorizon: 5
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        const payload = JSON.parse(line.substring(6));
        if (payload.type === 'progress') {
           console.log(`PROGRESS: ${payload.message}`);
        } else if (payload.type === 'complete') {
           console.log(`COMPLETE: Recommendations: ${payload.result.recommendations.map(r=>r.name).join(', ')}`);
        } else if (payload.type === 'error') {
           console.log(`ERROR: ${payload.message}`);
        }
      }
    });
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
