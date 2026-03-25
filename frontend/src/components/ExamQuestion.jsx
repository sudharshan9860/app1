// ExamQuestion.jsx - Component for solving exam questions with timer and navigation
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Clock,
  Timer,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ListOrdered,
  Flag,
  Send,
  Camera,
  Upload,
  Eye,
} from "lucide-react";
import CameraCapture from "./CameraCapture";
import MarkdownWithMath from "./MarkdownWithMath";
import { getImageSrc } from "../utils/imageUtils";
import axiosInstance from "../api/axiosInstance";

// Generate a unique exam session ID
const generateExamSessionId = (metadata, startTime) => {
  return `exam_${metadata.classId}_${metadata.subjectId}_${startTime}`;
};

function ExamQuestion() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract data from navigation state
  const { questions = [], examSettings = {}, metadata = {}, startTime } = location.state || {};

  // Generate unique session ID for localStorage
  const examSessionId = generateExamSessionId(metadata, startTime);

  // Load persisted state from localStorage
  const loadPersistedState = () => {
    try {
      const savedState = localStorage.getItem(examSessionId);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (e) {
      console.error("Error loading exam state:", e);
    }
    return null;
  };

  const persistedState = loadPersistedState();

  // State - initialized from localStorage if available
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    persistedState?.currentQuestionIndex || 0
  );
  const [answers, setAnswers] = useState(persistedState?.answers || {});
  const [questionTimers, setQuestionTimers] = useState(
    persistedState?.questionTimers || {}
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState(
    new Set(persistedState?.flaggedQuestions || [])
  );
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [showFullQuestionListModal, setShowFullQuestionListModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState({});
  const [imageSourceType, setImageSourceType] = useState("upload");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Total exam time tracking
  const totalExamDurationSeconds = examSettings.totalDurationSeconds || 1800;
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(
    persistedState?.totalTimeElapsed || 0
  );
  const [currentQuestionTimeElapsed, setCurrentQuestionTimeElapsed] = useState(0);

  // Refs
  const timerRef = useRef(null);
  const questionStartTimeRef = useRef(Date.now());
  const lastSaveTimeRef = useRef(Date.now());

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Redirect if no questions
  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate("/exam-mode");
    }
  }, [questions, navigate]);

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

  // Save state to localStorage
  const saveStateToLocalStorage = useCallback(() => {
    try {
      const stateToSave = {
        currentQuestionIndex,
        answers,
        questionTimers,
        flaggedQuestions: Array.from(flaggedQuestions),
        totalTimeElapsed,
        lastSaveTimestamp: Date.now(),
      };
      localStorage.setItem(examSessionId, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Error saving exam state:", e);
    }
  }, [examSessionId, currentQuestionIndex, answers, questionTimers, flaggedQuestions, totalTimeElapsed]);

  // Timer logic
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    const alreadySpentOnThisQuestion = questionTimers[currentQuestionIndex] || 0;
    setCurrentQuestionTimeElapsed(alreadySpentOnThisQuestion);

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const sessionTimeSpent = Math.floor((now - questionStartTimeRef.current) / 1000);
      setCurrentQuestionTimeElapsed(alreadySpentOnThisQuestion + sessionTimeSpent);

      setTotalTimeElapsed((prev) => {
        const newTotal = prev + 1;
        if (newTotal >= totalExamDurationSeconds) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
        }
        return newTotal;
      });

      if (now - lastSaveTimeRef.current >= 5000) {
        lastSaveTimeRef.current = now;
        const updatedQuestionTimers = {
          ...questionTimers,
          [currentQuestionIndex]: alreadySpentOnThisQuestion + sessionTimeSpent,
        };
        try {
          const stateToSave = {
            currentQuestionIndex,
            answers,
            questionTimers: updatedQuestionTimers,
            flaggedQuestions: Array.from(flaggedQuestions),
            totalTimeElapsed: totalTimeElapsed + 1,
            lastSaveTimestamp: now,
          };
          localStorage.setItem(examSessionId, JSON.stringify(stateToSave));
        } catch (e) {
          console.error("Error saving exam state:", e);
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestionIndex]);

  // Save time spent when leaving a question
  const saveTimeSpent = useCallback(() => {
    const sessionTimeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
    const previousTime = questionTimers[currentQuestionIndex] || 0;
    const newTime = previousTime + sessionTimeSpent;

    setQuestionTimers((prev) => ({
      ...prev,
      [currentQuestionIndex]: newTime,
    }));

    return newTime;
  }, [currentQuestionIndex, questionTimers]);

  // Handle auto-submit when time expires
  const handleAutoSubmit = useCallback(() => {
    saveTimeSpent();
    localStorage.removeItem(examSessionId);

    let correctAnswers = 0;
    const questionResults = questions.map((q, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correctAnswers++;

      return {
        questionId: q.question_id,
        question: q.question,
        question_image: q.question_image || null,
        userAnswer: userAnswer || "Not Attempted",
        correctAnswer: q.correct_answer,
        isCorrect,
        timeSpent: questionTimers[index] || 0,
        marks: isCorrect ? q.marks : 0,
        maxMarks: q.marks,
        topic: q.topic,
        uploadedImages: uploadedImages[index]?.map((img) => img.previewUrl) || [],
      };
    });

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const obtainedMarks = questionResults.reduce((sum, r) => sum + r.marks, 0);
    const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(1);

    navigate("/exam-result", {
      state: {
        questionResults,
        examStats: {
          totalQuestions: questions.length,
          correctAnswers,
          incorrectAnswers: questions.length - correctAnswers - (questions.length - Object.keys(answers).length),
          unanswered: questions.length - Object.keys(answers).length,
          totalMarks,
          obtainedMarks,
          percentage,
          totalTimeSpent: totalExamDurationSeconds,
          startTime,
          endTime: new Date().toISOString(),
          timeExpired: true,
        },
        metadata,
      },
    });
  }, [answers, examSessionId, metadata, navigate, questions, questionTimers, saveTimeSpent, startTime, totalExamDurationSeconds, uploadedImages]);

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timeRemaining = totalExamDurationSeconds - totalTimeElapsed;

  const getTimerColorClass = () => {
    const percentage = (timeRemaining / totalExamDurationSeconds) * 100;
    if (percentage > 50) return "text-[#22c55e]";
    if (percentage > 25) return "text-yellow-500";
    return "text-[#ef4444]";
  };

  const getTimerBarColorClass = () => {
    const percentage = (timeRemaining / totalExamDurationSeconds) * 100;
    if (percentage > 50) return "bg-[#22c55e]";
    if (percentage > 25) return "bg-yellow-500";
    return "bg-[#ef4444]";
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: "__image_uploaded__" }));
  };

  // Handle image capture
  const handleCapturedImage = (imageBlob) => {
    const file = new File(
      [imageBlob],
      `answer-${currentQuestionIndex}-${Date.now()}.jpg`,
      { type: "image/jpeg" }
    );
    const previewUrl = URL.createObjectURL(file);

    setUploadedImages((prev) => ({
      ...prev,
      [currentQuestionIndex]: [...(prev[currentQuestionIndex] || []), { file, previewUrl }],
    }));

    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: "__image_uploaded__",
    }));
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 5MB limit and was skipped`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const newImages = validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setUploadedImages((prev) => ({
      ...prev,
      [currentQuestionIndex]: [...(prev[currentQuestionIndex] || []), ...newImages],
    }));

    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: "__image_uploaded__",
    }));

    e.target.value = "";
  };

  // Remove specific uploaded image
  const handleRemoveImage = (imageIndex) => {
    setUploadedImages((prev) => {
      const currentImages = prev[currentQuestionIndex] || [];
      if (currentImages[imageIndex]?.previewUrl) {
        URL.revokeObjectURL(currentImages[imageIndex].previewUrl);
      }
      const newImages = currentImages.filter((_, idx) => idx !== imageIndex);

      if (newImages.length === 0) {
        const { [currentQuestionIndex]: _, ...rest } = prev;
        setAnswers((prevAnswers) => {
          const { [currentQuestionIndex]: __, ...restAnswers } = prevAnswers;
          return restAnswers;
        });
        return rest;
      }

      return { ...prev, [currentQuestionIndex]: newImages };
    });
  };

  // Toggle flag
  const toggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const newFlags = new Set(prev);
      if (newFlags.has(currentQuestionIndex)) {
        newFlags.delete(currentQuestionIndex);
      } else {
        newFlags.add(currentQuestionIndex);
      }
      return newFlags;
    });
  };

  const goToPrevious = () => {
    saveTimeSpent();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const goToNext = () => {
    saveTimeSpent();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToQuestion = (index) => {
    saveTimeSpent();
    setCurrentQuestionIndex(index);
    setShowNavigationModal(false);
  };

  const getQuestionStatus = (index) => {
    if (answers[index]) return "answered";
    if (flaggedQuestions.has(index)) return "flagged";
    if (index === currentQuestionIndex) return "current";
    return "unanswered";
  };

  const getExamStats = () => {
    const answered = Object.keys(answers).length;
    const flagged = flaggedQuestions.size;
    const unanswered = questions.length - answered;
    return { answered, flagged, unanswered };
  };

  // Handle exam submission
  const handleSubmitExam = async () => {
    const finalQuestionTime = saveTimeSpent();
    const finalQuestionTimers = {
      ...questionTimers,
      [currentQuestionIndex]: finalQuestionTime,
    };

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      if (metadata.class_id) {
        formData.append("class_id", metadata.class_id);
      }
      if (metadata.subject_id) {
        formData.append("subject_id", metadata.subject_id);
      }
      if (metadata.chapters && Array.isArray(metadata.chapters)) {
        metadata.chapters.forEach((chapter) => {
          formData.append("chapters", chapter);
        });
      }

      const questionsPayload = questions.map((q, index) => ({
        question_text: q.question || "",
        difficulty: q.question_level || "Medium",
        question_image: q.question_image || null,
        topic: q.topic || null,
      }));

      formData.append("questions", JSON.stringify(questionsPayload));

      questions.forEach((_, index) => {
        const questionImages = uploadedImages[index] || [];
        questionImages.forEach((imageData) => {
          if (imageData.file) {
            formData.append("answer_files", imageData.file);
          }
        });
      });

      const response = await axiosInstance.post("/exam-process/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      localStorage.removeItem(examSessionId);

      const apiResults = response.data.results || [];
      const apiTotalScore = response.data.total_score || 0;
      const apiTotalMaxMarks = response.data.total_max_marks || 0;
      const apiExamId = response.data.exam_id || null;

      const normalizeToArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === "string") return [value];
        return [];
      };

      const normalizeScoreBreakdown = (value) => {
        if (!value) return null;
        if (typeof value === "object" && !Array.isArray(value)) return value;
        if (typeof value === "string") return value;
        return null;
      };

      const questionResults = questions.map((q, index) => {
        const resultItem = apiResults[index] || {};
        const evaluation = resultItem.evaluation || {};
        const userAnswer = answers[index];

        return {
          questionId: q.question_id,
          question: q.question,
          question_image: q.question_image || null,
          questionLevel: q.question_level || resultItem.difficulty || "Medium",
          userAnswer: userAnswer || "Not Attempted",
          correctAnswer: q.correct_answer || "N/A",
          isCorrect: evaluation.score === evaluation.max_marks,
          timeSpent: finalQuestionTimers[index] || 0,
          marks: evaluation.score || 0,
          maxMarks: evaluation.max_marks || q.marks || 0,
          topic: q.topic,
          uploadedImages: uploadedImages[index]?.map((img) => img.previewUrl) || [],
          evaluation: {
            score: evaluation.score || 0,
            maxMarks: evaluation.max_marks || q.marks || 0,
            errorType: evaluation.error_type || null,
            mistakesMade: normalizeToArray(evaluation.mistakes_made),
            gapAnalysis: evaluation.gap_analysis || "",
            additionalComments: evaluation.additional_comments || "",
            conceptsRequired: normalizeToArray(evaluation.concepts_required),
            scoreBreakdown: normalizeScoreBreakdown(evaluation.score_breakdown),
          },
        };
      });

      const totalMarks = apiTotalMaxMarks || questions.reduce((sum, q) => sum + (q.marks || 0), 0);
      const obtainedMarks = apiTotalScore;
      const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : "0.0";
      const totalTimeSpent = Object.values(finalQuestionTimers).reduce((sum, t) => sum + t, 0);

      let correctAnswers = 0;
      let incorrectAnswers = 0;
      let unanswered = 0;

      questionResults.forEach((result, index) => {
        const hasAnswer = answers[index] || (uploadedImages[index]?.length > 0);
        if (!hasAnswer) {
          unanswered++;
        } else if (result.marks === result.maxMarks) {
          correctAnswers++;
        } else {
          incorrectAnswers++;
        }
      });

      navigate("/exam-result", {
        state: {
          questionResults,
          examStats: {
            totalQuestions: questions.length,
            correctAnswers,
            incorrectAnswers,
            unanswered,
            totalMarks,
            obtainedMarks,
            percentage,
            totalTimeSpent,
            examDuration: totalExamDurationSeconds,
            startTime,
            endTime: new Date().toISOString(),
            timeExpired: false,
          },
          metadata,
          apiResponse: response.data,
        },
      });
    } catch (error) {
      console.error("Error submitting exam:", error);
      setSubmitError(
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to submit exam. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <p className="text-[#0B1120] text-lg">Loading exam...</p>
      </div>
    );
  }

  const stats = getExamStats();

  const getStatusClasses = (status) => {
    switch (status) {
      case "answered": return "bg-[#22c55e] text-white";
      case "flagged": return "bg-yellow-500 text-white";
      case "current": return "bg-[#00A0E3] text-white";
      default: return "bg-gray-200 text-[#0B1120]";
    }
  };

  const getLevelClasses = (level) => {
    const l = (level || "Medium").toLowerCase();
    if (l === "easy") return "bg-green-100 text-[#22c55e]";
    if (l === "hard") return "bg-red-100 text-[#ef4444]";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-8">
      {/* Header with Timer */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-[#0B1120]">{metadata.subjectName || "Exam"}</span>
          <span className="text-sm text-gray-500">
            {metadata.chapterNames?.join(", ") || "Multiple Chapters"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Total Exam Time Remaining */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-[#00A0E3]" />
            <span className={`font-mono font-bold text-lg ${getTimerColorClass()}`}>
              {formatTime(Math.max(0, timeRemaining))}
            </span>
            <span className="text-xs text-gray-400">Left</span>
          </div>

          {/* Current Question Time */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-lg px-3 py-2">
            <Timer className="w-4 h-4 text-[#00A0E3]" />
            <span className="font-mono font-bold text-lg text-[#00A0E3]">
              {formatTime(currentQuestionTimeElapsed)}
            </span>
            <span className="text-xs text-gray-400">This Q</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white transition-colors text-sm font-medium"
            onClick={() => setShowFullQuestionListModal(true)}
          >
            <Eye className="w-4 h-4" />
            View All
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white transition-colors text-sm font-medium"
            onClick={() => setShowNavigationModal(true)}
          >
            <ListOrdered className="w-4 h-4" />
            Questions
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-3">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getTimerBarColorClass()}`}
            style={{ width: `${Math.max(0, (timeRemaining / totalExamDurationSeconds) * 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>
            <span className="font-bold text-[#0B1120]">{currentQuestionIndex + 1}</span>
            <span className="text-gray-400"> / {questions.length}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1 text-[#22c55e]">
            <CheckCircle className="w-3.5 h-3.5" />
            {stats.answered} Answered
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1 text-yellow-500">
            <Flag className="w-3.5 h-3.5" />
            {stats.flagged} Flagged
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#0B1120]">Question {currentQuestionIndex + 1}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getLevelClasses(currentQuestion.question_level)}`}>
                {currentQuestion.question_level || "Medium"}
              </span>
            </div>
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                flaggedQuestions.has(currentQuestionIndex)
                  ? "bg-yellow-500 text-white"
                  : "border border-gray-300 text-gray-500 hover:border-yellow-500 hover:text-yellow-500"
              }`}
              onClick={toggleFlag}
            >
              <Flag className="w-4 h-4" />
              {flaggedQuestions.has(currentQuestionIndex) ? "Flagged" : "Flag"}
            </button>
          </div>

          {/* Question Content */}
          <div className="mb-6">
            <div className="text-[#0B1120] text-base leading-relaxed">
              <MarkdownWithMath content={currentQuestion.question} />
            </div>
            {currentQuestion.question_image &&
              currentQuestion.question_image !== "No image for question" &&
              currentQuestion.question_image.length > 50 && (
              <div className="mt-4 text-center">
                <img
                  src={getImageSrc(currentQuestion.question_image)}
                  alt="Question"
                  className="block max-w-full h-auto object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Image Upload Section */}
          <div className="border-t border-gray-100 pt-5">
            <h6 className="text-sm font-semibold text-[#0B1120] mb-3">Upload Your Work (Optional)</h6>
            <div className="flex items-center gap-2 mb-4">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  imageSourceType === "upload"
                    ? "bg-[#00A0E3] text-white"
                    : "border border-[#00A0E3] text-[#00A0E3] hover:bg-blue-50"
                }`}
                onClick={() => setImageSourceType("upload")}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  imageSourceType === "camera"
                    ? "bg-[#00A0E3] text-white"
                    : "border border-[#00A0E3] text-[#00A0E3] hover:bg-blue-50"
                }`}
                onClick={() => setImageSourceType("camera")}
              >
                <Camera className="w-4 h-4" />
                Camera
              </button>
            </div>

            {imageSourceType === "upload" ? (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#00A0E3] hover:bg-blue-50/30 transition-colors text-gray-500 text-sm"
                >
                  <Upload className="w-5 h-5 mr-2 text-[#00A0E3]" />
                  Click to upload images (multiple allowed)
                </label>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <CameraCapture
                  onImageCapture={handleCapturedImage}
                  videoConstraints={{
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                  }}
                />
              </div>
            )}

            {/* Preview uploaded images */}
            {uploadedImages[currentQuestionIndex]?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-[#00A0E3] font-medium mb-2">
                  {uploadedImages[currentQuestionIndex].length} image(s) uploaded
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages[currentQuestionIndex].map((image, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={image.previewUrl}
                        alt={`Your work ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                      <button
                        className="absolute top-1 right-1 w-6 h-6 bg-[#ef4444] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="max-w-4xl mx-auto px-4 mt-4 flex items-center justify-between">
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {currentQuestionIndex < questions.length - 1 ? (
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00A0E3] hover:bg-[#0080B8] text-white font-medium transition-colors"
            onClick={goToNext}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#22c55e] hover:bg-green-600 text-white font-medium transition-colors"
            onClick={() => setShowSubmitModal(true)}
          >
            <Send className="w-4 h-4" />
            Submit Exam
          </button>
        )}
      </div>

      {/* Question Navigation Modal */}
      {showNavigationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNavigationModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0B1120]">Question Navigator</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowNavigationModal(false)}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2 mb-5">
              {questions.map((_, index) => (
                <button
                  key={index}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${getStatusClasses(getQuestionStatus(index))}`}
                  onClick={() => goToQuestion(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#00A0E3]"></span>Current</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#22c55e]"></span>Answered</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500"></span>Flagged</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200"></span>Unanswered</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSubmitModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-bold text-[#0B1120]">Submit Exam?</h3>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-[#22c55e] mb-1" />
                <span className="text-xl font-bold text-[#22c55e]">{stats.answered}</span>
                <span className="text-xs text-gray-500">Answered</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl">
                <Flag className="w-5 h-5 text-yellow-500 mb-1" />
                <span className="text-xl font-bold text-yellow-500">{stats.flagged}</span>
                <span className="text-xs text-gray-500">Flagged</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl">
                <XCircle className="w-5 h-5 text-[#ef4444] mb-1" />
                <span className="text-xl font-bold text-[#ef4444]">{stats.unanswered}</span>
                <span className="text-xs text-gray-500">Unanswered</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to submit the exam? This action cannot be undone.
            </p>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-lg p-3 mb-4">
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
              >
                Continue Exam
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Question List Modal */}
      {showFullQuestionListModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFullQuestionListModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#00A0E3]" />
                <h3 className="text-lg font-bold text-[#0B1120]">All Questions ({questions.length})</h3>
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowFullQuestionListModal(false)}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {questions.map((question, index) => {
                const status = getQuestionStatus(index);
                const timeSpent = questionTimers[index] || 0;
                const hasImages = uploadedImages[index]?.length > 0;

                return (
                  <div
                    key={index}
                    className={`rounded-xl border p-4 transition-colors ${
                      index === currentQuestionIndex ? "border-[#00A0E3] bg-blue-50/30" : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${getStatusClasses(status)}`}>
                          Q{index + 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getLevelClasses(question.question_level)}`}>
                          {question.question_level || "Medium"}
                        </span>
                        {flaggedQuestions.has(index) && (
                          <Flag className="w-3.5 h-3.5 text-yellow-500" />
                        )}
                        {hasImages && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Camera className="w-3.5 h-3.5" />
                            {uploadedImages[index].length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Timer className="w-3.5 h-3.5" />
                          {formatTime(timeSpent)}
                        </span>
                        <button
                          className="px-3 py-1 rounded-lg border border-[#00A0E3] text-[#00A0E3] text-xs font-medium hover:bg-[#00A0E3] hover:text-white transition-colors"
                          onClick={() => {
                            goToQuestion(index);
                            setShowFullQuestionListModal(false);
                          }}
                        >
                          Go to
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-[#0B1120] leading-relaxed line-clamp-2">
                      <MarkdownWithMath content={question.question} />
                    </div>
                    {question.question_image &&
                      question.question_image !== "No image for question" &&
                      question.question_image.length > 50 && (
                      <img
                        src={getImageSrc(question.question_image)}
                        alt={`Question ${index + 1}`}
                        className="block max-w-full h-auto object-contain mt-2 rounded-lg max-h-32"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#00A0E3]"></span>Current</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#22c55e]"></span>Answered</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500"></span>Flagged</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200"></span>Unanswered</span>
              </div>
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                onClick={() => setShowFullQuestionListModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamQuestion;
