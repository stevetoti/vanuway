"use server";

export async function submitContactForm(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const reason = formData.get("reason") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !reason || !message) {
    return { success: false, error: "All required fields must be filled" };
  }

  // Send via Resend if API key is configured, otherwise log and succeed
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "VanuWay Contact <noreply@vanuway.com>",
          to: ["hello@vanuway.com"],
          replyTo: email,
          subject: `[VanuWay Contact] ${reason} — ${name}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <hr />
            <p>${message.replace(/\n/g, "<br />")}</p>
          `,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Resend API error:", errorData);
        return { success: false, error: "Failed to send message. Please try again." };
      }
    } catch (err) {
      console.error("Contact form submission error:", err);
      return { success: false, error: "Failed to send message. Please try again." };
    }
  } else {
    // No Resend key — log for development
    console.log("[Contact Form]", { name, email, phone, reason, message });
  }

  return { success: true };
}
