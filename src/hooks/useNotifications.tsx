import { supabase } from "@/integrations/supabase/client";

interface NotificationData {
  disasterName?: string;
  affectedStates?: string[];
  tokensAllocated?: number;
  beneficiaryName?: string;
  tokensAmount?: number;
}

type NotificationType = "disaster_created" | "tokens_allocated" | "beneficiary_added";

export function useNotifications() {
  const sendNotification = async (
    type: NotificationType,
    data: NotificationData,
    recipientEmail?: string,
    recipientEmails?: string[]
  ) => {
    try {
      const { data: response, error } = await supabase.functions.invoke("send-notification", {
        body: {
          type,
          recipientEmail,
          recipientEmails,
          data,
        },
      });

      if (error) {
        console.error("Failed to send notification:", error);
        return { success: false, error };
      }

      console.log("Notification sent:", response);
      return { success: true, data: response };
    } catch (err) {
      console.error("Error sending notification:", err);
      return { success: false, error: err };
    }
  };

  const notifyDisasterCreated = async (
    disasterName: string,
    affectedStates: string[],
    tokensAllocated: number,
    adminEmails?: string[]
  ) => {
    return sendNotification(
      "disaster_created",
      { disasterName, affectedStates, tokensAllocated },
      undefined,
      adminEmails
    );
  };

  const notifyTokensAllocated = async (
    disasterName: string,
    tokensAmount: number,
    adminEmails?: string[]
  ) => {
    return sendNotification(
      "tokens_allocated",
      { disasterName, tokensAmount },
      undefined,
      adminEmails
    );
  };

  const notifyBeneficiaryAdded = async (
    beneficiaryEmail: string,
    beneficiaryName: string,
    disasterName: string,
    tokensAmount: number
  ) => {
    return sendNotification(
      "beneficiary_added",
      { beneficiaryName, disasterName, tokensAmount },
      beneficiaryEmail
    );
  };

  return {
    sendNotification,
    notifyDisasterCreated,
    notifyTokensAllocated,
    notifyBeneficiaryAdded,
  };
}
