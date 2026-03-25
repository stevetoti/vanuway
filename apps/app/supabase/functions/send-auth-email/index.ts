import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") || "https://app.vanuway.com";

interface AuthEmailRequest {
  email: string;
  type: 'signup' | 'recovery' | 'magic_link' | 'email_change';
  token?: string;
  redirect_url?: string;
  user_name?: string;
}

const getEmailContent = (type: string, token: string, email: string, userName?: string) => {
  const confirmUrl = `${APP_URL}/auth/confirm?token=${token}&type=${type}`;
  const name = userName || email.split('@')[0];

  switch (type) {
    case 'signup':
      return {
        subject: "Welcome to VanuWay - Confirm Your Email",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to VanuWay!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">The Vanuatu Way</p>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 18px;">Hi <strong>${name}</strong>,</p>
              <p>Thank you for signing up with VanuWay! Please confirm your email address to get started.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmUrl}"
                   style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Confirm Email Address
                </a>
              </div>

              <div style="background: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>What's next?</strong> Once confirmed, you can book rides, hotels, food delivery, and more across Vanuatu!</p>
              </div>

              <p style="font-size: 12px; color: #666;">If you didn't create an account, you can safely ignore this email.</p>
              <p style="margin-bottom: 0;">Welcome aboard,<br><strong>The VanuWay Team</strong></p>
            </div>
          </body>
          </html>
        `,
      };

    case 'recovery':
      return {
        subject: "Reset Your VanuWay Password",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 18px;">Hi <strong>${name}</strong>,</p>
              <p>We received a request to reset your password. Click the button below to create a new password.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmUrl}"
                   style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>

              <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>Important:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
              </div>

              <p style="margin-bottom: 0;">Best regards,<br><strong>The VanuWay Team</strong></p>
            </div>
          </body>
          </html>
        `,
      };

    case 'magic_link':
      return {
        subject: "Your VanuWay Login Link",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Magic Login Link</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 18px;">Hi <strong>${name}</strong>,</p>
              <p>Click the button below to log in to your VanuWay account. No password needed!</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmUrl}"
                   style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Log In to VanuWay
                </a>
              </div>

              <p style="font-size: 12px; color: #666;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
              <p style="margin-bottom: 0;">Best regards,<br><strong>The VanuWay Team</strong></p>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "VanuWay - Email Verification",
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>VanuWay</h2>
            <p>Click the link below to verify your action:</p>
            <a href="${confirmUrl}">Verify Email</a>
          </body>
          </html>
        `,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, token, user_name }: AuthEmailRequest = await req.json();

    if (!email || !type || !token) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, type, token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending ${type} email to ${email}`);

    const { subject, html } = getEmailContent(type, token, email, user_name);

    const emailResponse = await resend.emails.send({
      from: "VanuWay <noreply@vanuway.com>",
      to: [email],
      subject,
      html,
    });

    console.log("Auth email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
