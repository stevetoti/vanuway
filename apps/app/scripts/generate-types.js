/**
 * Generate TypeScript types from Supabase database schema
 * Run with: node scripts/generate-types.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateTypes() {
  console.log('🔍 Fetching database schema...');

  try {
    // Query to get all tables and their columns
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);

      // Try alternative method using RPC
      console.log('🔄 Trying alternative method...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_schema_info');

      if (rpcError) {
        console.error('❌ Alternative method failed:', rpcError);
        console.log('\n📋 Manual Steps Required:');
        console.log('1. Go to: https://supabase.com/dashboard');
        console.log('2. Select your VanuWay project');
        console.log('3. Click "API" or "API Docs" in sidebar');
        console.log('4. Look for "Tables and Views" tab');
        console.log('5. Copy the TypeScript definitions');
        console.log('6. Paste into: src/integrations/supabase/types.ts');
        process.exit(1);
      }
    }

    console.log(`✅ Found ${tables?.length || 0} tables`);

    if (tables && tables.length > 0) {
      console.log('\n📊 Tables in your database:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }

    // For now, provide manual instructions
    console.log('\n⚠️  Automatic type generation requires Supabase CLI or API access.');
    console.log('\n📋 Please follow these steps:');
    console.log('\n1. Go to your Supabase Dashboard:');
    console.log(`   ${supabaseUrl.replace('.supabase.co', '')}/project/_/api`);
    console.log('\n2. Click on "API Docs" in the left sidebar');
    console.log('\n3. Find the "Tables and Views" tab at the top');
    console.log('\n4. Copy the entire TypeScript definitions (should be 3000+ lines)');
    console.log('\n5. Replace the contents of: src/integrations/supabase/types.ts');
    console.log('\n6. Save and restart your dev server');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

generateTypes();
