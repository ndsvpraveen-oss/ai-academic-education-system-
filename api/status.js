module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({
    status: 'online',
    system: 'Academiq OS Core 2.5',
    timestamp: new Date().toISOString(),
    aiEngine: process.env.GEMINI_API_KEY ? 'gemini-2.5-pro' : 'simulation-mode',
    database: process.env.SUPABASE_URL ? 'supabase-connected' : 'local-storage',
    supabaseRef: 'rdfuhgnhvdkexpcveros'
  }));
};
