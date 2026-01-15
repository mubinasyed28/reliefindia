import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FraudAnalysisRequest {
  entity_type: "ngo" | "merchant";
  entity_id: string;
  transaction_count: number;
  transaction_volume: number;
  fraud_flags: number;
  time_in_system_months: number;
  compliance_rate: number;
  recent_activity: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: FraudAnalysisRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a fraud detection AI for a government disaster relief system called RELIFEX. 
Your task is to analyze entity data and provide a risk assessment.

Consider these factors:
- Transaction patterns (high volume with low count = suspicious)
- Fraud flags history
- Time in system (newer entities are riskier)
- Compliance rate
- Recent activity patterns

Provide a risk score from 0-100 (higher = more risky) and specific red flags if any.`;

    const userPrompt = `Analyze this ${data.entity_type} for fraud risk:

Entity ID: ${data.entity_id}
Transaction Count: ${data.transaction_count}
Transaction Volume: ₹${data.transaction_volume.toLocaleString()}
Previous Fraud Flags: ${data.fraud_flags}
Time in System: ${data.time_in_system_months} months
Compliance Rate: ${data.compliance_rate}%
Recent Activity: ${data.recent_activity}

Provide a JSON response with:
- risk_score (0-100)
- risk_level (low/medium/high/critical)
- red_flags (array of specific concerns)
- recommendations (array of actions to take)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_fraud_analysis",
              description: "Provide structured fraud risk analysis",
              parameters: {
                type: "object",
                properties: {
                  risk_score: { type: "number", minimum: 0, maximum: 100 },
                  risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  red_flags: { 
                    type: "array", 
                    items: { type: "string" } 
                  },
                  recommendations: { 
                    type: "array", 
                    items: { type: "string" } 
                  },
                },
                required: ["risk_score", "risk_level", "red_flags", "recommendations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_fraud_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Extract the function call arguments
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const analysis = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback response
    return new Response(JSON.stringify({
      risk_score: 50,
      risk_level: "medium",
      red_flags: ["Unable to fully analyze - using default assessment"],
      recommendations: ["Manual review recommended"],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in fraud-analysis:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
