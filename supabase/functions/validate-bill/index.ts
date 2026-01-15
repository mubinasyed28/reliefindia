import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { billValidationId, fileUrl, claimedAmount, vendorName } = await req.json();
    
    console.log('Validating bill:', { billValidationId, claimedAmount, vendorName });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call Lovable AI to validate the bill
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a bill/invoice validation AI for a disaster relief fund management system. 
Your job is to analyze bills and determine their validity for NGO expense claims.

You must analyze the bill and return a JSON response with the following structure:
{
  "isValid": boolean,
  "status": "valid" | "invalid" | "requires_review",
  "confidenceScore": number (0.0 to 1.0),
  "extractedAmount": number or null,
  "extractedVendor": string or null,
  "extractedDate": string (YYYY-MM-DD format) or null,
  "discrepancies": string[] (list of issues found),
  "notes": string (summary of validation)
}

Validation rules:
1. Check if the claimed amount matches the bill amount (within 5% tolerance)
2. Verify the vendor name matches if provided
3. Check for signs of tampering or irregularities
4. Ensure the bill has proper details (date, items, totals)
5. Flag bills that seem suspicious or need manual review

For amounts above ₹50,000, be extra vigilant for:
- Missing GST numbers
- Inconsistent formatting
- Unusually round numbers
- Missing itemization`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please validate this bill/invoice. 
Claimed amount: ₹${claimedAmount}
Vendor name provided: ${vendorName || 'Not specified'}

Analyze the bill image and verify the details.`
              },
              {
                type: "image_url",
                image_url: {
                  url: fileUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI credits exhausted. Please add more credits." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI validation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    
    console.log('AI response:', aiContent);

    // Parse AI response
    let validationResult;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      validationResult = {
        isValid: false,
        status: "requires_review",
        confidenceScore: 0.5,
        notes: "AI response could not be parsed. Manual review required.",
        discrepancies: ["Unable to parse AI validation response"]
      };
    }

    // Update the bill validation record
    const { error: updateError } = await supabase
      .from("bill_validations")
      .update({
        ai_validation_status: validationResult.status,
        ai_validation_notes: validationResult.notes + (validationResult.discrepancies?.length > 0 
          ? "\n\nDiscrepancies:\n- " + validationResult.discrepancies.join("\n- ") 
          : ""),
        ai_confidence_score: validationResult.confidenceScore,
        vendor_name: validationResult.extractedVendor || vendorName,
        bill_date: validationResult.extractedDate,
        validated_at: new Date().toISOString(),
      })
      .eq("id", billValidationId);

    if (updateError) {
      console.error("Failed to update bill validation:", updateError);
      throw updateError;
    }

    console.log('Bill validation updated successfully');

    return new Response(JSON.stringify({
      success: true,
      validation: validationResult
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in validate-bill function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
