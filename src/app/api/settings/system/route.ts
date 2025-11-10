import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/settings/system
 * Get all system settings (Admin/Root only)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Check user role
  const { data: roleData } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('profile_id', user.id)
    .in('role', ['admin', 'root'])
    .single();

  if (!roleData) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Get all settings
  const { data: settings, error } = await supabaseAdmin
    .from('system_settings')
    .select('*')
    .order('setting_key');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings });
}

/**
 * PATCH /api/settings/system
 * Update a system setting (Admin/Root only)
 */
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Check user role
  const { data: roleData } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('profile_id', user.id)
    .in('role', ['admin', 'root'])
    .single();

  if (!roleData) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await request.json();
  const { setting_key, setting_value } = body;

  if (!setting_key || !setting_value) {
    return NextResponse.json({ error: 'setting_key and setting_value are required' }, { status: 400 });
  }

  // Update setting
  const { data: updatedSetting, error } = await supabaseAdmin
    .from('system_settings')
    .update({
      setting_value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('setting_key', setting_key)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ setting: updatedSetting });
}



