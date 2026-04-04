import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DriverNotificationRequest {
  driverEmail: string;
  driverName: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { driverEmail, driverName, status, rejectionReason }: DriverNotificationRequest = await req.json();

    console.log(`Sending ${status} notification to ${driverEmail}`);

    let subject: string;
    let htmlContent: string;

    if (status === 'approved') {
      subject = "🎉 Congratulations! Your VanuRide Driver Application is Approved!";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to VanuRide!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 18px;">Dear <strong>${driverName}</strong>,</p>
            <p>We're thrilled to inform you that your driver application has been <strong style="color: #10b981;">approved!</strong></p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin-top: 0; color: #059669;">Getting Started</h3>
              <ul style="padding-left: 20px;">
                <li>Log in to your VanuRide account</li>
                <li>Visit your Driver Dashboard</li>
                <li>Toggle "Go Online" to start accepting rides</li>
                <li>Earn money with every completed trip!</li>
              </ul>
            </div>

            <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>💰 Earnings:</strong> You keep 80% of every fare. Payments are processed weekly.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://app.vanuway.com/driver/dashboard"
                 style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Go to Driver Dashboard
              </a>
            </div>

            <p>If you have any questions, our support team is here to help.</p>
            <p style="margin-bottom: 0;">Welcome aboard,<br><strong>The VanuRide Team</strong></p>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "Update on Your VanuRide Driver Application";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #6b7280; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">VanuRide Application Update</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 18px;">Dear <strong>${driverName}</strong>,</p>
            <p>Thank you for your interest in becoming a VanuRide driver. After reviewing your application, we regret to inform you that we are unable to approve it at this time.</p>
            
            ${rejectionReason ? `
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="margin-top: 0; color: #dc2626;">Reason</h3>
              <p style="margin-bottom: 0;">${rejectionReason}</p>
            </div>
            ` : ''}

            <div style="background: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>📝 What's Next?</strong> You may reapply after addressing the concerns mentioned above. We encourage you to update your documents and submit a new application.</p>
            </div>

            <p>If you believe this decision was made in error, please contact our support team.</p>
            <p style="margin-bottom: 0;">Best regards,<br><strong>The VanuRide Team</strong></p>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "VanuWay <noreply@vanuway.com>",
      to: [driverEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-driver-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
