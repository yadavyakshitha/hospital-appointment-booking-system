require("dotenv").config();

const config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY
};

if (!config.supabaseUrl || !config.supabaseSecretKey) {
    throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SECRET_KEY in backend/.env"
    );
}

module.exports = config;