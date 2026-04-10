import { useReviewStore } from "@/lib/store";

export function useReview() {
  const {
    answers,
    currentIndex,
    syncStatus,
    submitted,
    roadmapId,
    loading,
    error,
    loadReview,
    updateAnswer,
    setCurrentIndex,
    submitReview,
    clearError,
  } = useReviewStore();

  const answeredCount = Object.values(answers).filter(
    (answer) => answer.trim().length > 0,
  ).length;
  const totalQuestions = 10; // From QUESTION_COUNT constant
  const isComplete = answeredCount === totalQuestions;

  return {
    answers,
    currentIndex,
    syncStatus,
    submitted,
    roadmapId,
    loading,
    error,
    answeredCount,
    totalQuestions,
    isComplete,
    loadReview,
    updateAnswer,
    setCurrentIndex,
    submitReview,
    clearError,
  };
}
