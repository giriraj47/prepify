import { useRoadmapStore } from "@/lib/store";

export function useRoadmap() {
  const {
    roadmap,
    topics,
    selectedRoadmapId,
    loading,
    error,
    loadRoadmap,
    updateTopicProgress,
    setSelectedRoadmap,
    clearError,
  } = useRoadmapStore();

  const allTopicsCompleted = topics.every(
    (topic) => topic.status === "completed",
  );
  const completedTopicsCount = topics.filter(
    (topic) => topic.status === "completed",
  ).length;

  return {
    roadmap,
    topics,
    selectedRoadmapId,
    loading,
    error,
    allTopicsCompleted,
    completedTopicsCount,
    totalTopicsCount: topics.length,
    loadRoadmap,
    updateTopicProgress,
    setSelectedRoadmap,
    clearError,
  };
}
