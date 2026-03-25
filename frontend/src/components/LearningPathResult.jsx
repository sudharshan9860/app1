// LearningPathResult.jsx - Result page for learning path question submissions
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Home,
  Route,
  Trophy,
  Star,
  Lightbulb,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  GraduationCap,
  XCircle,
  Check,
} from "lucide-react";
import MarkdownWithMath from "./MarkdownWithMath";
import { getImageSrc } from "../utils/imageUtils";

function LearningPathResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    message,
    ai_data,
    points,
    actionType,
    question,
    questionImage,
    questionId,
    dayNumber,
    dayTopic,
    planId,
    examId,
    class_id,
    subject_id,
    topic_ids,
    currentQuestionIndex,
    allDayQuestions,
    learningPathData,
    learningPathForm,
    completedQuestions,
    activeDayIndex,
    totalQuestionsInDay,
    studentImages = [],
    nextDayData,
  } = location.state || {};

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Apply dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeEnabled = localStorage.getItem("darkMode") === "true";
      setIsDarkMode(darkModeEnabled);
      document.body.classList.toggle("dark-mode", darkModeEnabled);
    };

    checkDarkMode();
    window.addEventListener("storage", checkDarkMode);

    return () => {
      window.removeEventListener("storage", checkDarkMode);
    };
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      studentImages.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [studentImages]);

  // Extract AI data
  const {
    ai_explaination,
    student_answer,
    concepts,
    gap_analysis,
    error_type,
    mistakes_made,
    concepts_used,
    time_analysis,
    total_marks,
    obtained_marks,
    question_marks,
    videos = [],
    real_world_videos = [],
    key: responseKey,
  } = ai_data || {};

  // Format concepts used
  const formattedConceptsUsed = Array.isArray(concepts_used)
    ? concepts_used.join(", ")
    : concepts_used || "";

  // Handle navigation to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < allDayQuestions.length - 1) {
      const nextQuestion = allDayQuestions[currentQuestionIndex + 1];
      navigate("/learning-path-question", {
        state: {
          question: nextQuestion.question,
          questionId: nextQuestion.question_id,
          questionImage: nextQuestion.question_image || "",
          questionLevel: nextQuestion.question_level,
          topic: nextQuestion.topic || dayTopic,
          dayNumber, dayTopic, planId, examId, class_id, subject_id, topic_ids,
          totalQuestionsInDay,
          currentQuestionIndex: currentQuestionIndex + 1,
          allDayQuestions, learningPathData, learningPathForm,
          completedQuestions, activeDayIndex, nextDayData,
        },
        replace: true,
      });
    }
  };

  // Handle navigation to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = allDayQuestions[currentQuestionIndex - 1];
      navigate("/learning-path-question", {
        state: {
          question: prevQuestion.question,
          questionId: prevQuestion.question_id,
          questionImage: prevQuestion.question_image || "",
          questionLevel: prevQuestion.question_level,
          topic: prevQuestion.topic || dayTopic,
          dayNumber, dayTopic, planId, examId, class_id, subject_id, topic_ids,
          totalQuestionsInDay,
          currentQuestionIndex: currentQuestionIndex - 1,
          allDayQuestions, learningPathData, learningPathForm,
          completedQuestions, activeDayIndex, nextDayData,
        },
        replace: true,
      });
    }
  };

  // Handle back to current question
  const handleBackToQuestion = () => {
    const currentQuestion = allDayQuestions[currentQuestionIndex];
    navigate("/learning-path-question", {
      state: {
        question: currentQuestion.question,
        questionId: currentQuestion.question_id,
        questionImage: currentQuestion.question_image || "",
        questionLevel: currentQuestion.question_level,
        topic: currentQuestion.topic || dayTopic,
        dayNumber, dayTopic, planId, examId, class_id, subject_id, topic_ids,
        totalQuestionsInDay, currentQuestionIndex,
        allDayQuestions, learningPathData, learningPathForm,
        completedQuestions, activeDayIndex, nextDayData,
      },
      replace: true,
    });
  };

  // Handle back to learning session
  const handleBackToSession = () => {
    navigate("/learning-path-session", {
      state: {
        learningPathData, planId, examId, class_id, subject_id, topic_ids,
        learningPathForm, nextDayData,
      },
      replace: true,
    });
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate("/student-dash");
  };

  // Render solution steps
  const renderSolutionSteps = (steps) => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return <p className="text-slate-500">No solution steps available.</p>;
    }

    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const stepMatch = step.match(/^Step\s+(\d+):\s+(.*)/i);

          if (stepMatch) {
            const [_, stepNumber, stepContent] = stepMatch;
            return (
              <div key={index} className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700/50" : "bg-[#F8FAFC]"} border ${isDarkMode ? "border-slate-600" : "border-slate-200"}`}>
                <div className="font-semibold text-[#00A0E3] mb-2">Step {stepNumber}:</div>
                <div className="text-sm">
                  <MarkdownWithMath content={stepContent} />
                </div>
              </div>
            );
          } else {
            return (
              <div key={index} className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700/50" : "bg-[#F8FAFC]"} border ${isDarkMode ? "border-slate-600" : "border-slate-200"}`}>
                <div className="font-semibold text-[#00A0E3] mb-2">Step {index + 1}:</div>
                <div className="text-sm">
                  <MarkdownWithMath content={step} />
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // Render content based on action type
  const renderContentBasedOnAction = () => {
    switch (actionType) {
      case "explain":
        return (
          <>
            {concepts && concepts.length > 0 && (
              <div className="space-y-4">
                {concepts.map((conceptItem, index) => (
                  <details key={index} open className={`rounded-xl border overflow-hidden ${isDarkMode ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}>
                    <summary className={`px-4 py-3 font-semibold cursor-pointer select-none ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"}`}>
                      Concept {index + 1}: {conceptItem.concept}
                    </summary>
                    <div className="px-4 pb-4 space-y-4">
                      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700/50" : "bg-[#F8FAFC]"}`}>
                        <h6 className="flex items-center gap-2 font-semibold text-amber-500 mb-2">
                          <Lightbulb size={16} />
                          Explanation
                        </h6>
                        <div className="text-sm">
                          <MarkdownWithMath content={conceptItem.explanation} />
                        </div>
                      </div>

                      {conceptItem.example && (
                        <div className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700/50 border-l-4 border-[#00A0E3]" : "bg-blue-50 border-l-4 border-[#00A0E3]"}`}>
                          <h6 className="flex items-center gap-2 font-semibold text-[#00A0E3] mb-2">
                            <BookOpen size={16} />
                            Example
                          </h6>
                          <div className="text-sm">
                            {typeof conceptItem.example === "string" ? (
                              <MarkdownWithMath content={conceptItem.example} />
                            ) : (
                              <>
                                {conceptItem.example.problem && (
                                  <MarkdownWithMath content={conceptItem.example.problem} />
                                )}
                                {conceptItem.example.solution && (
                                  <div className="mt-2">
                                    <strong>Solution:</strong>
                                    <MarkdownWithMath content={conceptItem.example.solution} />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {conceptItem.application && (
                        <div className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700/50 border-l-4 border-green-500" : "bg-green-50 border-l-4 border-green-500"}`}>
                          <h6 className="flex items-center gap-2 font-semibold text-green-600 mb-2">
                            <GraduationCap size={16} />
                            Application
                          </h6>
                          <div className="text-sm">
                            <MarkdownWithMath content={conceptItem.application} />
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </>
        );

      case "solve":
        return (
          <>
            <div className="mb-4">
              <h5 className="flex items-center gap-2 font-semibold text-[#00A0E3] mb-3">
                <BookOpen size={18} />
                AI Solution
              </h5>
              <div>{renderSolutionSteps(ai_explaination)}</div>
            </div>
          </>
        );

      case "correct":
        return (
          <>
            {/* Score Display */}
            <div className="flex flex-col items-center mb-6">
              <div className={`flex items-baseline gap-1 p-6 rounded-2xl ${isDarkMode ? "bg-slate-700" : "bg-[#F8FAFC]"} border ${isDarkMode ? "border-slate-600" : "border-slate-200"}`}>
                <span className="text-4xl font-bold text-[#00A0E3]">{obtained_marks || 0}</span>
                <span className="text-2xl text-slate-400">/</span>
                <span className="text-2xl text-slate-500">{total_marks || question_marks || 10}</span>
              </div>
              <div className="text-sm text-slate-500 mt-2">Score</div>
            </div>

            {/* AI Solution */}
            <div className="mb-6">
              <h5 className="flex items-center gap-2 font-semibold text-[#00A0E3] mb-3">
                <BookOpen size={18} />
                AI Solution
              </h5>
              <div>{renderSolutionSteps(ai_explaination)}</div>
            </div>

            {/* Error Type */}
            {error_type && (
              <div className="mb-4">
                <h5 className="flex items-center gap-2 font-semibold text-red-500 mb-2">
                  <AlertTriangle size={18} />
                  Error Type
                </h5>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                  {error_type}
                </span>
              </div>
            )}

            {/* Gap Analysis */}
            {gap_analysis && (
              <div className="mb-4">
                <h5 className="flex items-center gap-2 font-semibold text-cyan-500 mb-2">
                  <BarChart3 size={18} />
                  Gap Analysis
                </h5>
                <div className={`p-4 rounded-lg text-sm ${isDarkMode ? "bg-cyan-900/20 border border-cyan-800" : "bg-cyan-50 border border-cyan-200"}`}>
                  <MarkdownWithMath content={gap_analysis} />
                </div>
              </div>
            )}

            {/* Mistakes Made */}
            {mistakes_made && (
              <div className="mb-4">
                <h5 className="flex items-center gap-2 font-semibold text-amber-500 mb-2">
                  <XCircle size={18} />
                  Mistakes Made
                </h5>
                <div className={`p-4 rounded-lg text-sm ${isDarkMode ? "bg-amber-900/20 border border-amber-800" : "bg-amber-50 border border-amber-200"}`}>
                  {typeof mistakes_made === "string" ? (
                    <MarkdownWithMath content={mistakes_made} />
                  ) : Array.isArray(mistakes_made) ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {mistakes_made.map((mistake, idx) => (
                        <li key={idx}>{mistake}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            )}

            {/* Time Analysis */}
            {time_analysis && (
              <div className="mb-4">
                <h5 className="flex items-center gap-2 font-semibold mb-2">
                  <Clock size={18} className="text-[#00A0E3]" />
                  Time Management
                </h5>
                <div className={`p-4 rounded-lg text-sm ${isDarkMode ? "bg-slate-700/50 border border-slate-600" : "bg-[#F8FAFC] border border-slate-200"}`}>
                  <MarkdownWithMath content={time_analysis} />
                </div>
              </div>
            )}

            {/* Concepts Used */}
            {formattedConceptsUsed && (
              <div className="mb-4">
                <h5 className="flex items-center gap-2 font-semibold text-[#00A0E3] mb-2">
                  <GraduationCap size={18} />
                  Concepts Required
                </h5>
                <div className={`p-4 rounded-lg text-sm ${isDarkMode ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}>
                  <MarkdownWithMath content={formattedConceptsUsed} />
                </div>
              </div>
            )}
          </>
        );

      default:
        return <p className="text-slate-500">No result data available.</p>;
    }
  };

  // Get action type label
  const getActionTypeLabel = () => {
    switch (actionType) {
      case "explain": return "Concepts";
      case "solve": return "AI Solution";
      case "correct": return "AI Correction";
      default: return "Result";
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case "correct": return Trophy;
      case "solve": return BookOpen;
      default: return Lightbulb;
    }
  };

  const ActionIcon = getActionIcon();

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-[#0B1120] text-white" : "bg-[#F8FAFC] text-[#0B1120]"}`}>
      {/* Fixed Header */}
      <div className={`sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? "bg-[#0B1120]/95 border-slate-700 backdrop-blur" : "bg-white/95 border-slate-200 backdrop-blur"}`}>
        <button
          onClick={handleBackToQuestion}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ArrowLeft size={16} />
          Back to Question
        </button>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#00A0E3] text-white">
            <Route size={12} />
            Day {dayNumber}
          </span>
          <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Q{currentQuestionIndex + 1} of {totalQuestionsInDay}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className={`grid gap-6 ${studentImages.length > 0 && actionType === "correct" ? "lg:grid-cols-[1fr_2fr]" : ""}`}>
          {/* Left Column - Student Images (if any) */}
          {studentImages.length > 0 && actionType === "correct" && (
            <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
              <div className={`px-4 py-3 font-semibold border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                Your Solution
              </div>
              <div className="p-4 space-y-3">
                {studentImages.map((imageUrl, index) => (
                  <div key={index} className="rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={`Solution ${index + 1}`}
                      className="w-full object-contain"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Column */}
          <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ActionIcon size={22} className="text-[#00A0E3]" />
                {getActionTypeLabel()}
              </h2>
            </div>

            <div className="p-6">
              {/* Question Display */}
              <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-slate-700/50 border border-slate-600" : "bg-[#F8FAFC] border border-slate-200"}`}>
                <h6 className="text-xs font-semibold uppercase text-slate-500 mb-2">Question:</h6>
                {questionImage && (
                  <img
                    src={getImageSrc(questionImage)}
                    alt="Question"
                    className="max-w-full max-h-64 rounded-lg mb-3 object-contain"
                  />
                )}
                <div className="text-sm">
                  <MarkdownWithMath content={question} />
                </div>
              </div>

              {/* Result Content */}
              <div>{renderContentBasedOnAction()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className={`sticky bottom-0 z-20 flex items-center justify-between px-4 py-3 border-t ${isDarkMode ? "bg-[#0B1120]/95 border-slate-700 backdrop-blur" : "bg-white/95 border-slate-200 backdrop-blur"}`}>
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBackToSession}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              isDarkMode ? "border-[#00A0E3]/30 text-[#00A0E3] hover:bg-[#00A0E3]/10" : "border-[#00A0E3]/30 text-[#00A0E3] hover:bg-[#00A0E3]/5"
            }`}
          >
            <Route size={16} />
            Day Overview
          </button>

          <button
            onClick={handleBackToDashboard}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              isDarkMode ? "border-[#00A0E3]/30 text-[#00A0E3] hover:bg-[#00A0E3]/10" : "border-[#00A0E3]/30 text-[#00A0E3] hover:bg-[#00A0E3]/5"
            }`}
          >
            <Home size={16} />
            Dashboard
          </button>
        </div>

        <button
          onClick={handleNextQuestion}
          disabled={currentQuestionIndex >= allDayQuestions.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#00A0E3] hover:bg-[#0080B8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next Question
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default LearningPathResult;
