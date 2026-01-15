import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingWallets: string[];
  flagged: boolean;
}

/**
 * Creates a hash from Aadhaar last 4 digits + mobile for duplicate detection
 * In production, this would be a proper cryptographic hash of the full Aadhaar
 */
const createAadhaarHash = (aadhaarLastFour: string, mobile: string): string => {
  // Simple hash simulation - in production use proper cryptographic hashing
  return btoa(`${aadhaarLastFour}-${mobile}`).replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Check if an Aadhaar (represented by last 4 digits + mobile) already has a wallet
 */
export const checkAadhaarDuplicate = async (
  aadhaarLastFour: string,
  mobile: string
): Promise<DuplicateCheckResult> => {
  const aadhaarHash = createAadhaarHash(aadhaarLastFour, mobile);
  
  // Check profiles for existing Aadhaar + mobile combination
  const { data: existingProfiles, error: profileError } = await supabase
    .from("profiles")
    .select("wallet_address, aadhaar_last_four, mobile")
    .eq("aadhaar_last_four", aadhaarLastFour)
    .eq("mobile", mobile);

  if (profileError) {
    console.error("Error checking duplicate Aadhaar:", profileError);
    return { isDuplicate: false, existingWallets: [], flagged: false };
  }

  // Check merchants for existing Aadhaar
  const { data: existingMerchants } = await supabase
    .from("merchants")
    .select("wallet_address, aadhaar_number")
    .ilike("aadhaar_number", `%${aadhaarLastFour}`);

  // Combine all wallets found
  const existingWallets: string[] = [];
  
  if (existingProfiles && existingProfiles.length > 0) {
    existingProfiles.forEach(p => {
      if (p.wallet_address) existingWallets.push(p.wallet_address);
    });
  }

  if (existingMerchants && existingMerchants.length > 0) {
    existingMerchants.forEach(m => {
      if (m.wallet_address) existingWallets.push(m.wallet_address);
    });
  }

  const isDuplicate = existingWallets.length > 0;

  return {
    isDuplicate,
    existingWallets,
    flagged: false,
  };
};

/**
 * Flag a duplicate Aadhaar claim in the database
 */
export const flagDuplicateAadhaar = async (
  aadhaarLastFour: string,
  mobile: string,
  newWalletAddress: string
): Promise<boolean> => {
  const aadhaarHash = createAadhaarHash(aadhaarLastFour, mobile);
  
  // Get existing wallets
  const checkResult = await checkAadhaarDuplicate(aadhaarLastFour, mobile);
  
  if (!checkResult.isDuplicate) {
    return false; // No duplicate to flag
  }

  const allWallets = [...checkResult.existingWallets, newWalletAddress];

  try {
    // Check if already flagged
    const { data: existingFlag } = await supabase
      .from("duplicate_claims")
      .select("id, wallet_addresses")
      .eq("aadhaar_hash", aadhaarHash)
      .maybeSingle();

    if (existingFlag) {
      // Update existing flag with new wallet
      const updatedWallets = Array.from(new Set([...existingFlag.wallet_addresses, newWalletAddress]));
      await supabase
        .from("duplicate_claims")
        .update({ wallet_addresses: updatedWallets })
        .eq("id", existingFlag.id);
    } else {
      // Create new flag
      await supabase
        .from("duplicate_claims")
        .insert({
          aadhaar_hash: aadhaarHash,
          wallet_addresses: allWallets,
          status: "flagged",
        });
    }

    // Log the audit
    await supabase.from("audit_logs").insert({
      entity_type: "duplicate_claim",
      action: "duplicate_aadhaar_detected",
      details: {
        aadhaar_last_four: aadhaarLastFour,
        wallet_count: allWallets.length,
      },
    });

    return true;
  } catch (error) {
    console.error("Error flagging duplicate Aadhaar:", error);
    return false;
  }
};

/**
 * Hook for duplicate Aadhaar detection
 */
export const useAadhaarDuplicateCheck = () => {
  const checkForDuplicate = async (
    aadhaarLastFour: string,
    mobile: string,
    showToast: boolean = true
  ): Promise<DuplicateCheckResult> => {
    const result = await checkAadhaarDuplicate(aadhaarLastFour, mobile);
    
    if (result.isDuplicate && showToast) {
      toast.error(
        "Duplicate Aadhaar Detected",
        {
          description: "This Aadhaar is already registered with another wallet. Your registration has been flagged for review.",
          duration: 8000,
        }
      );
    }

    return result;
  };

  const flagDuplicate = async (
    aadhaarLastFour: string,
    mobile: string,
    newWalletAddress: string
  ): Promise<boolean> => {
    return await flagDuplicateAadhaar(aadhaarLastFour, mobile, newWalletAddress);
  };

  return {
    checkForDuplicate,
    flagDuplicate,
  };
};
