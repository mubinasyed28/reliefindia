import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OfflineTransaction {
  id: string;
  citizenWallet: string;
  citizenName: string;
  merchantWallet: string;
  amount: number;
  purpose: string;
  timestamp: string;
  qrSignature: string;
  synced: boolean;
  syncAttempts: number;
}

const STORAGE_KEY = "relifex_offline_transactions";

export function useOfflinePayments(merchantWallet: string) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingTransactions, setPendingTransactions] = useState<OfflineTransaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load pending transactions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const transactions = JSON.parse(stored) as OfflineTransaction[];
        setPendingTransactions(transactions.filter(tx => !tx.synced));
      } catch (e) {
        console.error("Failed to parse offline transactions:", e);
      }
    }
  }, []);

  // Save to localStorage whenever pending transactions change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingTransactions));
  }, [pendingTransactions]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Internet connection restored! Syncing transactions...");
      syncTransactions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are offline. Transactions will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingTransactions.length > 0) {
      syncTransactions();
    }
  }, [isOnline]);

  const addOfflineTransaction = useCallback((transaction: Omit<OfflineTransaction, "id" | "synced" | "syncAttempts">) => {
    const newTx: OfflineTransaction = {
      ...transaction,
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      synced: false,
      syncAttempts: 0,
    };

    setPendingTransactions(prev => [...prev, newTx]);
    toast.success("Transaction saved offline. Will sync when online.");
    return newTx;
  }, []);

  const syncTransactions = useCallback(async () => {
    if (isSyncing || !isOnline) return;
    
    const unsynced = pendingTransactions.filter(tx => !tx.synced);
    if (unsynced.length === 0) return;

    setIsSyncing(true);
    let syncedCount = 0;
    let failedCount = 0;

    for (const tx of unsynced) {
      try {
        // Generate transaction hash
        const txHash = "0x" + Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");

        // Insert into transactions table
        const { error: txError } = await supabase
          .from("transactions")
          .insert({
            from_wallet: tx.citizenWallet,
            from_type: "citizen",
            to_wallet: tx.merchantWallet,
            to_type: "merchant",
            amount: tx.amount,
            purpose: tx.purpose,
            status: "synced",
            transaction_hash: txHash,
            is_offline: true,
            created_at: tx.timestamp,
          });

        if (txError) throw txError;

        // Insert into offline_ledger for audit
        const { data: merchantData } = await supabase
          .from("merchants")
          .select("id")
          .eq("wallet_address", tx.merchantWallet)
          .maybeSingle();

        if (merchantData) {
          await supabase.from("offline_ledger").insert({
            merchant_id: merchantData.id,
            citizen_wallet: tx.citizenWallet,
            amount: tx.amount,
            local_timestamp: tx.timestamp,
            qr_signature: tx.qrSignature,
            synced: true,
            synced_at: new Date().toISOString(),
          });
        }

        // Mark as synced
        setPendingTransactions(prev =>
          prev.map(t => t.id === tx.id ? { ...t, synced: true } : t)
        );
        syncedCount++;
      } catch (error) {
        console.error("Failed to sync transaction:", tx.id, error);
        // Increment sync attempts
        setPendingTransactions(prev =>
          prev.map(t => t.id === tx.id ? { ...t, syncAttempts: t.syncAttempts + 1 } : t)
        );
        failedCount++;
      }
    }

    setIsSyncing(false);

    if (syncedCount > 0) {
      toast.success(`Synced ${syncedCount} transaction(s) successfully!`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to sync ${failedCount} transaction(s). Will retry later.`);
    }

    // Clean up synced transactions from storage (keep for 24 hours for reference)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    setPendingTransactions(prev =>
      prev.filter(tx => !tx.synced || new Date(tx.timestamp).getTime() > oneDayAgo)
    );
  }, [pendingTransactions, isOnline, isSyncing]);

  const clearSyncedTransactions = useCallback(() => {
    setPendingTransactions(prev => prev.filter(tx => !tx.synced));
    toast.success("Cleared synced transactions from local storage");
  }, []);

  const getPendingCount = useCallback(() => {
    return pendingTransactions.filter(tx => !tx.synced).length;
  }, [pendingTransactions]);

  return {
    isOnline,
    pendingTransactions,
    isSyncing,
    addOfflineTransaction,
    syncTransactions,
    clearSyncedTransactions,
    getPendingCount,
  };
}
