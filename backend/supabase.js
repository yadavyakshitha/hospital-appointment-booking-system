
const { createClient } = require("@supabase/supabase-js");
const config = require("./config");

const supabase = createClient(
    config.supabaseUrl,
    config.supabaseSecretKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
);

module.exports = supabase;
