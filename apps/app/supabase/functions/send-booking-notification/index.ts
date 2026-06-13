import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  type: 'new_booking' | 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder';
  recipientEmail: string;
  recipientName: string;
  bookingDate: string;
  bookingTime: string;
  serviceName?: string;
  serviceCategory: string;
  passengers: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  totalPrice?: number;
  paymentMethod?: string;
  otherPartyName: string;
  otherPartyPhone?: string;
  specialRequests?: string;
  cancellationReason?: string;
}

const categoryLabels: Record<string, string> = {
  cruise_transfer: 'Cruise Transfer',
  airport_transfer: 'Airport Transfer',
  tour: 'Tour',
  ride: 'Ride',
  hauling: 'Hauling',
};

const categoryEmoji: Record<string, string> = {
  cruise_transfer: '🚢',
  airport_transfer: '✈️',
  tour: '🌴',
  ride: '🚗',
  hauling: '🚛',
};

function buildEmailHtml(data: BookingNotificationRequest): { subject: string; html: string } {
  const emoji = categoryEmoji[data.serviceCategory] || '📋';
  const catLabel = categoryLabels[data.serviceCategory] || data.serviceCategory;

  const bookingDetails = `
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Service</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; text-align: right;">${emoji} ${data.serviceName || catLabel}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Date & Time</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; text-align: right;">${data.bookingDate} at ${data.bookingTime}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Passengers</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; text-align: right;">${data.passengers}</td>
      </tr>
      ${data.pickupLocation ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Pickup</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: right;">${data.pickupLocation}</td></tr>` : ''}
      ${data.dropoffLocation ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Dropoff</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: right;">${data.dropoffLocation}</td></tr>` : ''}
      ${data.totalPrice ? `<tr><td style="padding: 8px 0; font-size: 13px; color: #6b7280;">Total</td><td style="padding: 8px 0; font-size: 16px; font-weight: 700; text-align: right; color: #059669;">VUV ${data.totalPrice.toLocaleString()}</td></tr>` : ''}
    </table>
  `;

  let subject: string;
  let headerGradient: string;
  let headerTitle: string;
  let bodyContent: string;
  let ctaText: string;
  let ctaUrl: string;

  switch (data.type) {
    case 'new_booking':
      subject = `${emoji} New Booking Request - ${data.bookingDate}`;
      headerGradient = 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
      headerTitle = 'New Booking Request!';
      bodyContent = `
        <p style="font-size: 16px;">Hi <strong>${data.recipientName}</strong>,</p>
        <p>You have a new booking request from <strong>${data.otherPartyName}</strong>.</p>
        ${bookingDetails}
        ${data.specialRequests ? `<div style="background: #fef3c7; border-radius: 8px; padding: 12px; margin: 15px 0;"><p style="margin: 0; font-size: 13px;"><strong>Special Requests:</strong> ${data.specialRequests}</p></div>` : ''}
        ${data.otherPartyPhone ? `<p style="font-size: 13px; color: #6b7280;">Contact: <a href="tel:${data.otherPartyPhone}" style="color: #2563eb;">${data.otherPartyPhone}</a></p>` : ''}
        <p>Please confirm or decline this booking from your dashboard.</p>
      `;
      ctaText = 'View Booking';
      ctaUrl = 'https://app.vanuway.com/driver/bookings';
      break;

    case 'booking_confirmed':
      subject = `Booking Confirmed - ${data.bookingDate}`;
      headerGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      headerTitle = 'Booking Confirmed!';
      bodyContent = `
        <p style="font-size: 16px;">Hi <strong>${data.recipientName}</strong>,</p>
        <p>Great news! Your booking with <strong>${data.otherPartyName}</strong> has been confirmed.</p>
        ${bookingDetails}
        ${data.otherPartyPhone ? `<div style="background: #dbeafe; border-radius: 8px; padding: 12px; margin: 15px 0;"><p style="margin: 0; font-size: 13px;"><strong>Driver Contact:</strong> <a href="tel:${data.otherPartyPhone}" style="color: #2563eb;">${data.otherPartyPhone}</a></p></div>` : ''}
        <p>Your driver will be waiting at the pickup location on the day.</p>
      `;
      ctaText = 'View My Bookings';
      ctaUrl = 'https://app.vanuway.com/bookings';
      break;

    case 'booking_cancelled':
      subject = `Booking Cancelled - ${data.bookingDate}`;
      headerGradient = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      headerTitle = 'Booking Cancelled';
      bodyContent = `
        <p style="font-size: 16px;">Hi <strong>${data.recipientName}</strong>,</p>
        <p>Unfortunately, the booking for <strong>${data.bookingDate}</strong> has been cancelled.</p>
        ${bookingDetails}
        ${data.cancellationReason ? `<div style="background: #fee2e2; border-radius: 8px; padding: 12px; margin: 15px 0;"><p style="margin: 0; font-size: 13px;"><strong>Reason:</strong> ${data.cancellationReason}</p></div>` : ''}
        <p>You can browse other available drivers and rebook.</p>
      `;
      ctaText = 'Find Another Driver';
      ctaUrl = 'https://app.vanuway.com/drivers';
      break;

    case 'booking_reminder':
      subject = `Reminder: Booking Tomorrow - ${data.bookingTime}`;
      headerGradient = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
      headerTitle = 'Booking Reminder';
      bodyContent = `
        <p style="font-size: 16px;">Hi <strong>${data.recipientName}</strong>,</p>
        <p>This is a reminder that you have a booking <strong>tomorrow</strong> with <strong>${data.otherPartyName}</strong>.</p>
        ${bookingDetails}
        ${data.otherPartyPhone ? `<div style="background: #dbeafe; border-radius: 8px; padding: 12px; margin: 15px 0;"><p style="margin: 0; font-size: 13px;"><strong>Contact:</strong> <a href="tel:${data.otherPartyPhone}" style="color: #2563eb;">${data.otherPartyPhone}</a></p></div>` : ''}
        <p>Please be at the pickup location on time.</p>
      `;
      ctaText = 'View Booking';
      ctaUrl = 'https://app.vanuway.com/bookings';
      break;

    default:
      subject = 'VanuWay Booking Update';
      headerGradient = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
      headerTitle = 'Booking Update';
      bodyContent = `<p>You have a booking update.</p>${bookingDetails}`;
      ctaText = 'View Bookings';
      ctaUrl = 'https://app.vanuway.com/bookings';
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: ${headerGradient}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;"><h1 style="color: white; margin: 0; font-size: 24px;">${headerTitle}</h1></div><div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">${bodyContent}<div style="text-align: center; margin: 25px 0;"><a href="${ctaUrl}" style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">${ctaText}</a></div><p style="margin-bottom: 0; font-size: 13px; color: #6b7280;">Best regards,<br><strong>The VanuWay Team</strong></p></div></body></html>`;

  return { subject, html };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: BookingNotificationRequest = await req.json();
    console.log(`Sending ${data.type} notification to ${data.recipientEmail}`);

    const { subject, html } = buildEmailHtml(data);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'VanuWay <noreply@vanuway.com>',
        to: [data.recipientEmail],
        subject,
        html,
      }),
    });

    const emailResponse = await res.json();
    console.log('Booking email sent:', emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error('Error in send-booking-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
