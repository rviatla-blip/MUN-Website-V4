import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface AllocationRequest {
  delegateId: string;
}

interface Preference {
  committee: string;
  country: string;
}

interface AllocationResult {
  success: boolean;
  message?: string;
  error?: string;
  assignment?: {
    committee: string;
    country: string;
    allocationType: string;
  };
}

async function allocateSlot(delegateId: string): Promise<AllocationResult> {
  // Get delegate with preferences
  const { data: delegate, error: delegateError } = await supabase
    .from("delegates")
    .select("*")
    .eq("id", delegateId)
    .maybeSingle();

  if (delegateError || !delegate) {
    return { success: false, error: "Delegate not found" };
  }

  if (delegate.assigned_committee && delegate.assigned_country) {
    return {
      success: true,
      message: "Already assigned",
      assignment: {
        committee: delegate.assigned_committee,
        country: delegate.assigned_country,
        allocationType: delegate.allocation_type || "Unknown",
      },
    };
  }

  const preferences: Preference[] = [
    { committee: delegate.preference_1_committee, country: delegate.preference_1_country },
    { committee: delegate.preference_2_committee, country: delegate.preference_2_country },
    { committee: delegate.preference_3_committee, country: delegate.preference_3_country },
  ];

  const allocationTypes = ["1st Preference", "2nd Preference", "3rd Preference"];

  let assignedSlot = null;
  let allocationType = "";

  // Try each preference in order
  for (let i = 0; i < preferences.length; i++) {
    const pref = preferences[i];
    const { data: slot, error } = await supabase
      .from("matrix")
      .select("*")
      .eq("committee", pref.committee)
      .eq("country", pref.country)
      .eq("is_assigned", false)
      .maybeSingle();

    if (!error && slot) {
      assignedSlot = slot;
      allocationType = allocationTypes[i];
      break;
    }
  }

  // Fallback: random available slot
  if (!assignedSlot) {
    const { data: availableSlots, error } = await supabase
      .from("matrix")
      .select("*")
      .eq("is_assigned", false)
      .limit(50);

    if (error || !availableSlots || availableSlots.length === 0) {
      return { success: false, error: "No available slots" };
    }

    // Random selection
    assignedSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    allocationType = "Random";
  }

  // Update matrix slot as assigned
  const { error: updateMatrixError } = await supabase
    .from("matrix")
    .update({ is_assigned: true })
    .eq("id", assignedSlot.id);

  if (updateMatrixError) {
    return { success: false, error: "Failed to update matrix" };
  }

  // Update delegate with assignment
  const { error: updateDelegateError } = await supabase
    .from("delegates")
    .update({
      assigned_committee: assignedSlot.committee,
      assigned_country: assignedSlot.country,
      assigned_matrix_id: assignedSlot.id,
      allocation_type: allocationType,
      registration_status: "confirmed",
    })
    .eq("id", delegateId);

  if (updateDelegateError) {
    // Rollback matrix assignment
    await supabase
      .from("matrix")
      .update({ is_assigned: false })
      .eq("id", assignedSlot.id);
    return { success: false, error: "Failed to update delegate" };
  }

  return {
    success: true,
    message: "Successfully allocated",
    assignment: {
      committee: assignedSlot.committee,
      country: assignedSlot.country,
      allocationType: allocationType,
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AllocationRequest = await req.json();

    if (!body.delegateId) {
      return new Response(
        JSON.stringify({ error: "delegateId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await allocateSlot(body.delegateId);

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
