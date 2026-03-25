const {
  FINNHUB_API_KEY,
  TWELVE_DATA_API_KEY,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} = require("../config/env");

function health(_req, res) {
  return res.status(200).json({
    ok: true,
    services: {
      finnhub: Boolean(FINNHUB_API_KEY),
      twelveData: Boolean(TWELVE_DATA_API_KEY),
      supabaseUrl: Boolean(SUPABASE_URL),
      supabaseAnonKey: Boolean(SUPABASE_ANON_KEY),
      supabaseServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    },
  });
}

module.exports = { health };
