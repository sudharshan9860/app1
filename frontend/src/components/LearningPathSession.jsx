// LearningPathSession.jsx - Main component for learning path study sessions
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Route,
  Calendar,
  Clock,
  BookOpen,
  ListChecks,
  CheckCircle,
  Play,
  Home,
  BarChart3,
  Lightbulb,
  Trophy,
  Flame,
  ArrowLeft,
  Star,
  Lock,
  Unlock,
} from "lucide-react";
import MarkdownWithMath from "./MarkdownWithMath";

function LearningPathSession() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract data from location state
  const {
    learningPathData: initialLearningPathData,
    planId,
    examId,
    class_id,
    subject_id,
    topic_ids,
    learningPathForm,
    currentDay,
    nextDayData,
  } = location.state || {};

 console.log("pathid",planId)

  // Transform nextDayData from ExamMode into learningPathData format if needed
  const learningPathData = React.useMemo(() => {
    // If we have nextDayData from ExamMode, always use it to transform questions properly
    if (nextDayData) {
      return {
        daily_plans: [{
          day_number: nextDayData.next_day,
          topic: nextDayData.topic,
          what_to_study: nextDayData.what_to_study,
          expected_time: nextDayData.expected_time,
          checklist: nextDayData.checklist || [],
          questions: (nextDayData.questions || []).map(q => ({
            id: q.id || q.question_id,
            question_id: q.question_id || q.id,
            question: q.question_text || q.question || "",
            question_image: q.question_image || "",
            question_level: q.question_level || "medium",
            topic: q.topic || nextDayData.topic,
            points: q.points || 0,
            solved: q.solved || false,
          })),
        }],
      };
    }
    return initialLearningPathData;
  }, [initialLearningPathData, nextDayData]);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Active day index
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Track completed questions per day
  const [completedQuestions, setCompletedQuestions] = useState(() => {
    const stored = localStorage.getItem(`lp_completed_${planId}`);
    return stored ? JSON.parse(stored) : {};
  });

  // Track earned points
  const [earnedPoints, setEarnedPoints] = useState(() => {
    const stored = localStorage.getItem(`lp_points_${planId}`);
    return stored ? parseInt(stored, 10) : 0;
  });

  // Redirect if no learning path data
  useEffect(() => {
    if (!learningPathData || !learningPathData.daily_plans) {
      navigate("/exam-mode");
    }
  }, [learningPathData, navigate]);

  // Apply dark mode
  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDarkMode);

    const handleDarkModeChange = (e) => {
      setIsDarkMode(e.detail.isDarkMode);
    };

    window.addEventListener("darkModeChange", handleDarkModeChange);
    return () => {
      window.removeEventListener("darkModeChange", handleDarkModeChange);
    };
  }, [isDarkMode]);

  // Save progress to localStorage
  useEffect(() => {
    if (planId) {
      localStorage.setItem(`lp_completed_${planId}`, JSON.stringify(completedQuestions));
      localStorage.setItem(`lp_points_${planId}`, earnedPoints.toString());
    }
  }, [completedQuestions, earnedPoints, planId]);

  // Get difficulty color
  const getDifficultyColor = (level) => {
    const normalizedLevel = level?.toLowerCase() || "";
    if (normalizedLevel === "easy") return "bg-green-100 text-green-800";
    if (normalizedLevel === "medium") return "bg-yellow-100 text-yellow-800";
    if (normalizedLevel === "hard") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  // Navigate between days
  const goToPreviousDay = () => {
    if (activeDayIndex > 0) setActiveDayIndex(activeDayIndex - 1);
  };

  const goToNextDay = () => {
    if (learningPathData?.daily_plans && activeDayIndex < learningPathData.daily_plans.length - 1) {
      setActiveDayIndex(activeDayIndex + 1);
    }
  };

  // Check if a question is completed
  const isQuestionCompleted = (dayIndex, questionId) => {
    const key = `${dayIndex}-${questionId}`;
    return completedQuestions[key] === true;
  };

  // Get day completion percentage
  const getDayCompletionPercentage = (dayIndex) => {
    const day = learningPathData?.daily_plans?.[dayIndex];
    if (!day?.questions || day.questions.length === 0) return 0;

    const completedCount = day.questions.filter((q) =>
      isQuestionCompleted(dayIndex, q.id || q.question_id)
    ).length;

    return Math.round((completedCount / day.questions.length) * 100);
  };

  // Get overall completion percentage
  const getOverallCompletionPercentage = () => {
    if (!learningPathData?.daily_plans) return 0;

    let totalQuestions = 0;
    let completedCount = 0;

    learningPathData.daily_plans.forEach((day, dayIndex) => {
      if (day.questions) {
        totalQuestions += day.questions.length;
        completedCount += day.questions.filter((q) =>
          isQuestionCompleted(dayIndex, q.id || q.question_id)
        ).length;
      }
    });

    return totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;
  };

  // Handle question click - navigate to question solving page
  const handleQuestionClick = (question, questionIndex, dayIndex) => {
    const activeDay = learningPathData.daily_plans[dayIndex];

    navigate("/learning-path-question", {
      state: {
        question: question.question || question.question_text || "",
        questionId: question.question_id,
        questionImage: question.question_image || "",
        questionLevel: question.question_level || "medium",
        topic: question.topic || activeDay.topic,
        dayNumber: activeDay.day_number || dayIndex + 1,
        dayTopic: activeDay.topic,
        planId,
        examId,
        class_id,
        subject_id,
        topic_ids,
        totalQuestionsInDay: activeDay.questions.length,
        currentQuestionIndex: questionIndex,
        allDayQuestions: activeDay.questions,
        learningPathData,
        learningPathForm,
        completedQuestions,
        activeDayIndex: dayIndex,
        nextDayData,
      },
    });
  };

  // Handle update from question completion
  const handleUpdateProgress = useCallback((questionId, dayIndex, points) => {
    const key = `${dayIndex}-${questionId}`;
    setCompletedQuestions((prev) => ({
      ...prev,
      [key]: true,
    }));
    setEarnedPoints((prev) => prev + (points || 0));
  }, []);

  // Handle back - go to exam mode or previous page
  const handleBackToResults = () => {
    // If we came from ExamMode (via nextDayData), go back to exam-mode
    if (nextDayData) {
      navigate("/exam-mode");
    } else {
      navigate(-1);
    }
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate("/student-dash");
  };

  const activeDay = learningPathData.daily_plans[activeDayIndex];
  const totalDays = learningPathData.daily_plans.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBackToResults}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold text-[#0B1120] flex items-center gap-2 justify-center">
              <Route className="w-5 h-5 text-[#00A0E3]" />
              Your Learning Journey
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {learningPathForm?.total_days || totalDays} Day Study Plan
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-yellow-700">{earnedPoints} Points</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        {/* Gap Analysis Summary */}
        {learningPathData.gap_analysis && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h5 className="text-sm font-semibold text-[#0B1120] flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Areas to Improve
            </h5>
            {learningPathData.gap_analysis.summary && (
              <p className="text-sm text-gray-600 mb-3">{learningPathData.gap_analysis.summary}</p>
            )}
            {learningPathData.gap_analysis.weak_concepts &&
              learningPathData.gap_analysis.weak_concepts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {learningPathData.gap_analysis.weak_concepts.map((concept, idx) => (
                    <span key={idx} className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      {concept}
                    </span>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Day Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={goToPreviousDay}
              disabled={activeDayIndex === 0}
              className="p-2 text-gray-400 hover:text-[#00A0E3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2 overflow-x-auto py-1">
              {learningPathData.daily_plans.map((day, idx) => {
                const dayCompletion = getDayCompletionPercentage(idx);
                const isCompleted = dayCompletion === 100;
                const isCurrent = idx === activeDayIndex;

                return (
                  <button
                    key={idx}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all flex-shrink-0 ${
                      isCurrent
                        ? 'bg-[#00A0E3] text-white shadow-md scale-110'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-500 hover:border-[#00A0E3] hover:text-[#00A0E3]'
                    }`}
                    onClick={() => setActiveDayIndex(idx)}
                    title={`Day ${idx + 1}: ${day.topic} (${dayCompletion}% complete)`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToNextDay}
              disabled={activeDayIndex === totalDays - 1}
              className="p-2 text-gray-400 hover:text-[#00A0E3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Day Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Day Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold bg-[#00A0E3] text-white rounded-full">
                Day {activeDay.day_number || activeDayIndex + 1}
              </span>
              <h2 className="text-lg font-bold text-[#0B1120]">{activeDay.topic}</h2>
            </div>
            {activeDay.expected_time && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4" />
                {activeDay.expected_time}
              </div>
            )}
          </div>

          {/* What to Study */}
          {activeDay.what_to_study && (
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-[#0B1120] flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-[#00A0E3]" />
                What to Study
              </h6>
              <div className="bg-[#F8FAFC] rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                <MarkdownWithMath content={activeDay.what_to_study} />
              </div>
            </div>
          )}

          {/* Checklist */}
          {activeDay.checklist && activeDay.checklist.length > 0 && (
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-[#0B1120] flex items-center gap-2 mb-3">
                <ListChecks className="w-4 h-4 text-[#00A0E3]" />
                Today's Checklist
              </h6>
              <ul className="space-y-2">
                {activeDay.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <MarkdownWithMath content={item} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Practice Questions */}
          {activeDay.questions && activeDay.questions.length > 0 && (
            <div>
              <h6 className="text-sm font-semibold text-[#0B1120] flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-orange-500" />
                Practice Questions ({activeDay.questions.length})
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeDay.questions.map((question, qIdx) => {
                  const qId = question.id || question.question_id;
                  const isCompleted = isQuestionCompleted(activeDayIndex, qId);
                  const questionText = question.question || question.question_text || "";

                  return (
                    <div
                      key={qIdx}
                      className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                        isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-100 hover:border-[#00A0E3]'
                      }`}
                      onClick={() => handleQuestionClick(question, qIdx, activeDayIndex)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#00A0E3]">Q{qIdx + 1}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(question.question_level)}`}>
                            {question.question_level || "Medium"}
                          </span>
                          {question.topic && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {question.topic}
                            </span>
                          )}
                        </div>
                        <div>
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#00A0E3]/10 text-[#00A0E3]">
                              <Play className="w-3 h-3" />
                              Start
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-3">
                        <MarkdownWithMath content={questionText} />
                      </div>
                      {question.question_image && (
                        <div className="mt-2">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            Has Image
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            disabled={activeDayIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Day
          </button>

          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#00A0E3] text-[#00A0E3] rounded-lg hover:bg-[#00A0E3]/5 transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={goToNextDay}
            disabled={activeDayIndex === totalDays - 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next Day
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LearningPathSession;
