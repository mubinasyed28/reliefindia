import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "disaster_created" | "tokens_allocated" | "beneficiary_added";
  recipientEmail?: string;
  recipientEmails?: string[];
  data: {
    disasterName?: string;
    affectedStates?: string[];
    tokensAllocated?: number;
    beneficiaryName?: string;
    tokensAmount?: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientEmail, recipientEmails, data }: NotificationRequest = await req.json();

    console.log(`Processing notification type: ${type}`, { recipientEmail, recipientEmails, data });

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "disaster_created":
        subject = `🚨 New Disaster Alert: ${data.disasterName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626, #f97316); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚨 New Disaster Created</h1>
            </div>
            <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937; margin-bottom: 16px;">${data.disasterName}</h2>
              <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Affected States:</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600;">${data.affectedStates?.join(", ") || "Not specified"}</p>
              </div>
              <div style="background: white; padding: 16px; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Total Tokens Allocated:</p>
                <p style="margin: 0; color: #059669; font-weight: 600; font-size: 20px;">₹${data.tokensAllocated?.toLocaleString("en-IN") || "0"}</p>
              </div>
              <p style="color: #6b7280; font-size: 12px; margin-top: 24px; text-align: center;">
                This is an automated notification from the Relief Token System.
              </p>
            </div>
          </div>
        `;
        break;

      case "tokens_allocated":
        subject = `💰 Tokens Allocated: ${data.disasterName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💰 Tokens Allocated</h1>
            </div>
            <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937; margin-bottom: 16px;">${data.disasterName}</h2>
              <div style="background: white; padding: 16px; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">New Tokens Added:</p>
                <p style="margin: 0; color: #059669; font-weight: 600; font-size: 24px;">₹${data.tokensAmount?.toLocaleString("en-IN") || "0"}</p>
              </div>
              <p style="color: #6b7280; font-size: 12px; margin-top: 24px; text-align: center;">
                This is an automated notification from the Relief Token System.
              </p>
            </div>
          </div>
        `;
        break;

      case "beneficiary_added":
        subject = `✅ You've been added as a beneficiary: ${data.disasterName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✅ Beneficiary Registration</h1>
            </div>
            <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="color: #1f2937; font-size: 16px; margin-bottom: 16px;">
                Hello <strong>${data.beneficiaryName || "Beneficiary"}</strong>,
              </p>
              <p style="color: #4b5563; margin-bottom: 16px;">
                You have been registered as a beneficiary for disaster relief under:
              </p>
              <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Disaster:</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600;">${data.disasterName}</p>
              </div>
              <div style="background: white; padding: 16px; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Tokens Allocated to You:</p>
                <p style="margin: 0; color: #059669; font-weight: 600; font-size: 24px;">₹${data.tokensAmount?.toLocaleString("en-IN") || "0"}</p>
              </div>
              <p style="color: #4b5563; margin-top: 16px;">
                You can use these tokens at registered merchants for essential supplies.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 24px; text-align: center;">
                This is an automated notification from the Relief Token System.
              </p>
            </div>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Determine recipients
    const recipients = recipientEmails || (recipientEmail ? [recipientEmail] : []);
    
    if (recipients.length === 0) {
      console.log("No recipients specified, skipping email send");
      return new Response(
        JSON.stringify({ success: true, message: "No recipients specified" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending email to ${recipients.length} recipient(s)`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Relief Token System <onboarding@resend.dev>",
        to: recipients,
        subject,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
