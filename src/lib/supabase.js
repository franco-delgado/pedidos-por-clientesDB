import { createClient } from "@supabase/supabase-js";

// Estas credenciales las sacas de Settings > API en tu panel de Supabase
const supabaseUrl = "https://cqcgmktnohxhffbrnezk.supabase.co";
const supabaseKey = "sb_publishable_GGpK8H2ipC22yl2u0b8O-A_p8oNKGJY";

export const supabase = createClient(supabaseUrl, supabaseKey);
