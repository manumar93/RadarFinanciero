const path = require("node:path");
const dotenv = require("dotenv");

const BASE_DIR = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(BASE_DIR, "public");
dotenv.config({ path: path.join(BASE_DIR, ".env") });

module.exports = {
  PORT: Number(process.env.PORT || 3000),
  FINNHUB_API_KEY: process.env.FINNHUB_API_KEY || "",
  TWELVE_DATA_API_KEY: process.env.TWELVE_DATA_API_KEY || "",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  BASE_DIR,
  PUBLIC_DIR,
  DISCOVER_LIMIT_DEFAULT: 300,
};
