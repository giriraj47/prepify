import { create } from "zustand";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "./auth-store";

export interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  estimated_weeks: number | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapTopic {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: string;
  estimated_hours: number | null;
  resources: Array<{
    title: string;
    url: string;
    type: string;
    completed?: boolean;
  }>;
}

interface RoadmapState {
  roadmap: Roadmap | null;
  topics: RoadmapTopic[];
  selectedRoadmapId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadRoadmap: (roadmapId?: string) => Promise<void>;
  updateTopicProgress: (topicId: string, completed: boolean) => Promise<void>;
  setSelectedRoadmap: (roadmapId: string | null) => void;
  clearError: () => void;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getRoadmapCacheKey(userId: string, roadmapId: string | null) {
  return `prepai-roadmap:${userId}:${roadmapId ?? "latest"}`;
}

function loadCachedRoadmap(userId: string, roadmapId: string | null) {
  if (typeof window === "undefined") return null;
  try {
    const payload = window.localStorage.getItem(
      getRoadmapCacheKey(userId, roadmapId),
    );
    if (!payload) return null;
    const parsed = JSON.parse(payload) as {
      expiresAt: number;
      roadmap: Roadmap;
      topics: RoadmapTopic[];
    };
    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(getRoadmapCacheKey(userId, roadmapId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveRoadmapCache(
  userId: string,
  roadmapId: string | null,
  roadmap: Roadmap,
  topics: RoadmapTopic[],
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getRoadmapCacheKey(userId, roadmapId),
      JSON.stringify({ expiresAt: Date.now() + CACHE_TTL_MS, roadmap, topics }),
    );
  } catch {
    // ignore storage errors
  }
}

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  roadmap: null,
  topics: [],
  selectedRoadmapId: null,
  loading: false,
  error: null,

  loadRoadmap: async (roadmapId?: string) => {
    try {
      set({ loading: true, error: null });
      const supabase = createSupabaseBrowserClient();
      const { user } = useAuthStore.getState();

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const targetRoadmapId = roadmapId || get().selectedRoadmapId;

      // Check cache first
      const cached = loadCachedRoadmap(user.id, targetRoadmapId);
      if (cached) {
        set({
          roadmap: cached.roadmap,
          topics: cached.topics,
          selectedRoadmapId: targetRoadmapId,
          loading: false,
        });
        return;
      }

      // Fetch from database
      const roadmapQuery = supabase
        .from("roadmaps")
        .select(
          "id, title, description, estimated_weeks, created_at, updated_at",
        )
        .eq("user_id", user.id);

      const { data: roadmapRow } = targetRoadmapId
        ? await roadmapQuery.eq("id", targetRoadmapId).maybeSingle()
        : await roadmapQuery
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

      if (!roadmapRow) {
        throw new Error("No roadmap found");
      }

      // Fetch topics
      const { data: topicsData, error: topicsError } = await supabase
        .from("roadmap_topics")
        .select("*")
        .eq("roadmap_id", roadmapRow.id)
        .order("order_index");

      if (topicsError) {
        throw topicsError;
      }

      const topics = topicsData || [];

      // Cache the data
      saveRoadmapCache(user.id, targetRoadmapId, roadmapRow, topics);

      set({
        roadmap: roadmapRow,
        topics,
        selectedRoadmapId: targetRoadmapId,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "Failed to load roadmap",
      });
    }
  },

  updateTopicProgress: async (topicId: string, completed: boolean) => {
    try {
      set({ loading: true, error: null });
      const supabase = createSupabaseBrowserClient();
      const { user } = useAuthStore.getState();

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("roadmap_topics")
        .update({ status: completed ? "completed" : "in_progress" })
        .eq("id", topicId)
        .eq("roadmap_id", get().roadmap?.id);

      if (error) {
        console.error("Failed to update topic progress:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      // Update local state
      set((state) => ({
        topics: state.topics.map((topic) =>
          topic.id === topicId
            ? { ...topic, status: completed ? "completed" : "in_progress" }
            : topic,
        ),
        loading: false,
      }));

      // Refresh cache
      const { roadmap, topics } = get();
      if (roadmap && topics.length > 0) {
        saveRoadmapCache(user.id, get().selectedRoadmapId, roadmap, topics);
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "Failed to update progress",
      });
      throw error;
    }
  },

  setSelectedRoadmap: (roadmapId: string | null) => {
    set({ selectedRoadmapId: roadmapId });
  },

  clearError: () => {
    set({ error: null });
  },
}));
