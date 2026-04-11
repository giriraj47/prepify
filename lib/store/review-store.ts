import { create } from "zustand";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "./auth-store";

export interface ReviewAnswer {
  [questionIndex: number]: string;
}

interface ReviewState {
  answers: ReviewAnswer;
  currentIndex: number;
  syncStatus: "idle" | "saving" | "synced";
  submitted: boolean;
  roadmapId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadReview: (roadmapId: string) => Promise<void>;
  updateAnswer: (index: number, answer: string) => void;
  setCurrentIndex: (index: number) => void;
  submitReview: () => Promise<void>;
  clearError: () => void;
}

const LOCALSTORAGE_AUTOSAVE_DELAY = 500; // 500ms for immediate local save
const DB_SYNC_DELAY = 3000; // 3 seconds for DB sync

function getReviewStorageKey(roadmapId: string) {
  return `prepai-review:answers:${roadmapId}`;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  answers: {},
  currentIndex: 0,
  syncStatus: "idle",
  submitted: false,
  roadmapId: null,
  loading: false,
  error: null,

  loadReview: async (roadmapId: string) => {
    try {
      set({ loading: true, error: null, roadmapId });
      const supabase = createSupabaseBrowserClient();
      const { user } = useAuthStore.getState();

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Load from localStorage first
      const storageKey = getReviewStorageKey(roadmapId);
      const savedAnswers = localStorage.getItem(storageKey);
      if (savedAnswers) {
        try {
          const parsed = JSON.parse(savedAnswers);
          set({ answers: parsed });
        } catch {
          // Ignore parsing errors
        }
      }

      // Load from database (if exists)
      const { data, error } = await supabase
        .from("review_answers")
        .select("answers, submitted")
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmapId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        set({
          answers: data.answers || {},
          submitted: data.submitted || false,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "Failed to load review",
      });
    }
  },

  updateAnswer: (index: number, answer: string) => {
    const { answers, roadmapId, submitted } = get();
    if (submitted) return;

    const newAnswers = { ...answers, [index]: answer };
    set({ answers: newAnswers });

    // Auto-save to localStorage
    if (roadmapId) {
      const storageKey = getReviewStorageKey(roadmapId);
      setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newAnswers));
          set({ syncStatus: "saving" });
        } catch (err) {
          console.error("Failed to save to localStorage:", err);
        }
      }, LOCALSTORAGE_AUTOSAVE_DELAY);

      // Sync to database
      setTimeout(async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { user } = useAuthStore.getState();

          if (!user?.id || !roadmapId) return;

          const { error } = await supabase.from("review_answers").upsert(
            {
              user_id: user.id,
              roadmap_id: roadmapId,
              answers: newAnswers,
              submitted: false,
            },
            { onConflict: "user_id,roadmap_id" }
          );

          if (error) {
            console.error("Failed to sync to database:", {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            });
            set({ syncStatus: "idle" });
          } else {
            set({ syncStatus: "synced" });
            setTimeout(() => set({ syncStatus: "idle" }), 2000);
          }
        } catch (err) {
          console.error("Failed to sync answers:", err);
          set({ syncStatus: "idle" });
        }
      }, DB_SYNC_DELAY);
    }
  },

  setCurrentIndex: (index: number) => {
    set({ currentIndex: index });
  },

  submitReview: async () => {
    try {
      set({ loading: true, error: null });
      const supabase = createSupabaseBrowserClient();
      const { user } = useAuthStore.getState();
      const { roadmapId, answers } = get();

      if (!user?.id || !roadmapId) {
        throw new Error("User not authenticated or no roadmap selected");
      }

      const { error } = await supabase
        .from("review_answers")
        .update({ submitted: true })
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmapId);

      if (error) {
        throw error;
      }

      set({
        submitted: true,
        loading: false,
        syncStatus: "idle",
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "Failed to submit review",
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
