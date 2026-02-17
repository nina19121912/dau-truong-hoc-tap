
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://keyqsvtbpfarxodiewtt.supabase.co';
const supabaseKey = 'sb_publishable_xBCwK5lmNFtkyAUmfDBukg__e6IYDA2';

export const supabase = createClient(supabaseUrl, supabaseKey);
