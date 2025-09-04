import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  fullName: string;
  role: 'admin' | 'maintenance_manager' | 'operations_manager' | 'user';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin role
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { data: currentUserProfile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (currentUserProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { email, fullName, role }: CreateUserRequest = await req.json();

    // Generate temporary password
    const { data: tempPasswordData } = await supabaseClient
      .rpc('generate_temp_password');
    
    const temporaryPassword = tempPasswordData as string;

    // Create pending user record
    const { error: pendingUserError } = await supabaseClient
      .from('pending_users')
      .insert({
        email,
        full_name: fullName,
        role,
        temporary_password: temporaryPassword,
        created_by: user.id,
      });

    if (pendingUserError) {
      console.error('Error creating pending user:', pendingUserError);
      return new Response(JSON.stringify({ error: pendingUserError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Send email with credentials
    const emailResponse = await resend.emails.send({
      from: "Telecom Admin <admin@profitloss.com>",
      to: [email],
      subject: "Your Telecom P&L System Account",
      html: `
        <h1>Welcome to the Telecom P&L System</h1>
        <p>Hello ${fullName},</p>
        <p>An administrator has created an account for you in the Telecom Profit & Loss System.</p>
        <p><strong>Your login credentials:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Temporary Password:</strong> ${temporaryPassword}</li>
          <li><strong>Role:</strong> ${role.replace('_', ' ').toUpperCase()}</li>
        </ul>
        <p>Please log in and change your password immediately for security purposes.</p>
        <p><strong>Important:</strong> This temporary password will expire in 7 days.</p>
        <p>Best regards,<br>Telecom P&L System Admin</p>
      `,
    });

    console.log('User created and email sent:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'User created and credentials sent via email' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in create-user function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);