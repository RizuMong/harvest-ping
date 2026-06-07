import {
  ApprovalLineStatus,
  DEFAULT_APPROVERS,
  DEFAULT_SCHEDULERS,
  RequestStatus,
} from "@/config/app.config";
import { supabase } from "@/services/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface ApproverConfig {
  id: string;
  userId: string;
  userName: string;
  sequence: number;
}

export interface ApprovalLine {
  approverId?: string;
  userId?: string;
  approverName: string;
  status: ApprovalLineStatus;
  actionDate?: string;
  remarks?: string;
}

export interface FinishHarvestRequest {
  id: string;
  schedulerId: string;
  schedulerTitle: string;
  harvestDate: string;
  note: string;
  status: RequestStatus;
  submissionDate: string;
  userId: string;
  userName: string;
  approvalLines: ApprovalLine[];
  timeline: {
    status: string;
    date: string;
    note: string;
  }[];
}

export interface Scheduler {
  id: string;
  title: string;
  status?: string;
}

interface HarvestState {
  requests: FinishHarvestRequest[];
  schedulers: Scheduler[];
  approverConfigs: ApproverConfig[];
  loading: boolean;
  
  // Actions
  fetchSchedulers: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  createRequest: (schedulerId: string, harvestDate: string, note: string, userId: string, userName: string) => Promise<void>;
  approveRequest: (requestId: string, approverId: string) => Promise<void>;
  rejectRequest: (requestId: string, approverId: string, remarks: string) => Promise<void>;
  
  // Admin Actions for Approver Config
  addApproverConfig: (userId: string, userName: string) => Promise<void>;
  removeApproverConfig: (id: string) => Promise<void>;
  reorderApproverConfig: (configs: ApproverConfig[]) => Promise<void>;
}

export const useHarvestStore = create<HarvestState>()(
  persist(
    (set, get) => ({
      requests: [],
      schedulers: DEFAULT_SCHEDULERS as Scheduler[],
      approverConfigs: DEFAULT_APPROVERS as ApproverConfig[],
      loading: false,

      fetchSchedulers: async () => {
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from("t_ping_scheduller")
            .select("id, title, status");

          if (!error && data && data.length > 0) {
            set({ schedulers: data.map(s => ({ id: String(s.id), title: s.title, status: s.status ?? undefined })) });
          } else {
            // Seed DB table t_ping_scheduller if it exists but empty
            if (!error) {
              const seedData = DEFAULT_SCHEDULERS.map((s) => ({ id: parseInt(s.id, 10), title: s.title }));
              await supabase.from("t_ping_scheduller").insert(seedData);
            }
            set({ schedulers: DEFAULT_SCHEDULERS as Scheduler[] });
          }
        } catch (err) {
          console.error("fetchSchedulers error:", err);
          set({ schedulers: DEFAULT_SCHEDULERS as Scheduler[] });
        } finally {
          set({ loading: false });
        }
      },

      fetchRequests: async () => {
        set({ loading: true });
        try {
          // Attempt to pull requests from Supabase trx_finish_harvest
          const { data, error } = await supabase
            .from("trx_finish_harvest")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && data) {
            // Map rows back to structured format
            const mapped = data.map((r: any) => ({
              id: String(r.id),
              schedulerId: String(r.scheduler_id),
              schedulerTitle: get().schedulers.find(s => String(s.id) === String(r.scheduler_id))?.title || "Jadwal Panen",
              harvestDate: r.harvest_date,
              note: r.note,
              status: r.status,
              submissionDate: new Date(r.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
              userId: String(r.created_by),
              userName: "Mandor Panen",
              approvalLines: r.approval_lines || [],
              timeline: [], // Will be generated dynamically in UI
            }));
            set({ requests: mapped });
          }
        } catch (err) {
          console.error("fetchRequests error:", err);
        } finally {
          set({ loading: false });
        }
      },

      createRequest: async (schedulerId, harvestDate, note, userId, userName) => {
        set({ loading: true });
        const schedulerTitle = get().schedulers.find(s => String(s.id) === String(schedulerId))?.title || "Jadwal Panen";
        
        // Generate approval lines based on current configuration
        const sortedConfigs = [...get().approverConfigs].sort((a, b) => a.sequence - b.sequence);
        const approvalLines: ApprovalLine[] = sortedConfigs.map((c) => ({
          approverId: c.userId || c.id,
          userId: c.userId || c.id,
          approverName: c.userName,
          status: "Waiting",
        }));

        const numericUserId = parseInt(userId, 10) || 1;

        const newRequest: FinishHarvestRequest = {
          id: String(Date.now()),
          schedulerId,
          schedulerTitle,
          harvestDate,
          note,
          status: "submitted",
          submissionDate: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
          userId,
          userName,
          approvalLines,
          timeline: []
        };

        // Update local state first
        set((state) => ({
          requests: [newRequest, ...state.requests]
        }));

        // Attempt Supabase insert
        try {
          const { error } = await supabase
            .from("trx_finish_harvest")
            .insert({
              scheduler_id: parseInt(schedulerId, 10) || 1,
              harvest_date: harvestDate,
              note: note,
              status: "submitted",
              created_by: numericUserId,
              updated_by: numericUserId,
              approval_lines: approvalLines,
            });

          if (error) {
            console.error("Supabase insert request error:", error);
          } else {
            // Re-fetch to ensure we have the exact database record and real ID
            await get().fetchRequests();
          }
        } catch (err) {
          console.error("Supabase createRequest catch:", err);
        } finally {
          set({ loading: false });
        }
      },

      approveRequest: async (requestId, approverId) => {
        set({ loading: true });
        const request = get().requests.find(r => r.id === requestId);
        if (!request) return;

        const updatedLines = request.approvalLines.map(line => {
          const lineUserId = line.userId || line.approverId;
          if (lineUserId && String(lineUserId) === String(approverId)) {
            return {
              ...line,
              status: "Approved" as const,
              actionDate: new Date().toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
            };
          }
          return line;
        });

        // If all approvers approved, status becomes "approved"
        const allApproved = updatedLines.every(l => l.status === "Approved");
        const nextStatus = allApproved ? ("approved" as const) : ("submitted" as const);

        // Update local state
        set((state) => ({
          requests: state.requests.map(r => r.id === requestId ? {
            ...r,
            approvalLines: updatedLines,
            status: nextStatus,
          } : r)
        }));

        // Sync with Supabase
        try {
          await supabase
            .from("trx_finish_harvest")
            .update({
              status: nextStatus,
              approval_lines: updatedLines,
            })
            .eq("id", parseInt(requestId, 10) || requestId);

          // Auto stop scheduler if request is fully approved
          if (allApproved) {
            const { error: schedError } = await supabase
              .from("t_ping_scheduller")
              .update({ status: "completed" })
              .eq("id", parseInt(request.schedulerId, 10));
            if (schedError) {
              console.error("Failed to stop scheduler:", schedError);
            }
          }
        } catch (err) {
          console.error("Supabase approve error:", err);
        } finally {
          set({ loading: false });
        }
      },

      rejectRequest: async (requestId, approverId, remarks) => {
        set({ loading: true });
        const request = get().requests.find(r => r.id === requestId);
        if (!request) return;

        const updatedLines = request.approvalLines.map(line => {
          const lineUserId = line.userId || line.approverId;
          if (lineUserId && String(lineUserId) === String(approverId)) {
            return {
              ...line,
              status: "Rejected" as const,
              remarks,
              actionDate: new Date().toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
            };
          }
          return line;
        });

        // Update local state
        set((state) => ({
          requests: state.requests.map(r => r.id === requestId ? {
            ...r,
            approvalLines: updatedLines,
            status: "rejected" as const,
          } : r)
        }));

        // Sync with Supabase
        try {
          await supabase
            .from("trx_finish_harvest")
            .update({
              status: "rejected",
              approval_lines: updatedLines,
            })
            .eq("id", parseInt(requestId, 10) || requestId);
        } catch (err) {
          console.error("Supabase reject error:", err);
        } finally {
          set({ loading: false });
        }
      },

      addApproverConfig: async (userId, userName) => {
        const currentConfigs = get().approverConfigs;
        // Avoid duplicate configs
        if (currentConfigs.some(c => c.userId === userId)) return;

        const newConfig: ApproverConfig = {
          id: String(Date.now()),
          userId,
          userName,
          sequence: currentConfigs.length + 1,
        };

        set((state) => ({
          approverConfigs: [...state.approverConfigs, newConfig]
        }));
      },

      removeApproverConfig: async (id) => {
        set((state) => {
          const filtered = state.approverConfigs.filter(c => c.id !== id);
          // Re-index sequences
          const reindexed = filtered.map((c, index) => ({
            ...c,
            sequence: index + 1,
          }));
          return { approverConfigs: reindexed };
        });
      },

      reorderApproverConfig: async (configs) => {
        set({ approverConfigs: configs });
      },
    }),
    {
      name: "harvest-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
