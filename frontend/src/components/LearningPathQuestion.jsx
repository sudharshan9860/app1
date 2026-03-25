// LearningPathQuestion.jsx - Component for solving learning path questions
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Check,
  Clock,
  Route,
  ChevronLeft,
  ChevronRight,
  Home,
  ChevronDown,
  BookOpenCheck,
  Star,
  Upload,
  ImageIcon,
  Trash2,
  Loader2,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import MarkdownWithMath from "./MarkdownWithMath";
import CameraCapture from "./CameraCapture";
import { useTimer } from "../contexts/TimerContext";
import StudyTimer from "./StudyTimer";
import { getImageSrc } from "../utils/imageUtils";

function LearningPathQuestion() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract data from location state
  const {
    question,
    questionId,
    questionImage,
    questionLevel,
    topic,
    dayNumber,
    dayTopic,
    planId,
    examId,
    class_id,
    subject_id,
    topic_ids,
    totalQuestionsInDay,
    currentQuestionIndex,
    allDayQuestions,
    learningPathData,
    learningPathForm,
    completedQuestions: initialCompletedQuestions,
    activeDayIndex,
    nextDayData,
  } = location.state || {};

  // Timer context
  const { startTimer, stopTimer } = useTimer();

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // State
  const [images, setImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [processingButton, setProcessingButton] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [imageSourceType, setImageSourceType] = useState("file");
  const [currentIndex, setCurrentIndex] = useState(currentQuestionIndex || 0);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: question,
    questionId: questionId || allDayQuestions?.[currentQuestionIndex]?.question_id || allDayQuestions?.[currentQuestionIndex]?.id,
    image: questionImage,
    level: questionLevel,
    topic: topic,
  });
  const [completedQuestions, setCompletedQuestions] = useState(initialCompletedQuestions || {});

  // Ref to prevent duplicate navigation and timer operations
  const prevLocationStateRef = useRef(null);
  const timerStartedRef = useRef(false);
  const currentQuestionIdRef = useRef(null);

  // Cleanup function for image URLs
  const revokeImageUrls = useCallback((urls) => {
    urls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.debug("URL already revoked:", url);
      }
    });
  }, []);

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

  // Start timer only on mount and when question actually changes
  useEffect(() => {
    const newQuestionId = currentQuestion.questionId;

    // Only start timer if question ID exists
    if (newQuestionId) {
      // Check if it's a new question
      if (newQuestionId !== currentQuestionIdRef.current) {
        currentQuestionIdRef.current = newQuestionId;
      }
      // Always start the timer when this effect runs
      startTimer(`lp-${newQuestionId}`);
      timerStartedRef.current = true;
    }

    // Cleanup only on unmount
    return () => {
      if (timerStartedRef.current) {
        stopTimer();
        timerStartedRef.current = false;
      }
    };
  }, [currentQuestion.questionId, startTimer, stopTimer]);

  // Handle question navigation
  const navigateToQuestion = useCallback(
    (index) => {
      if (!allDayQuestions || index < 0 || index >= allDayQuestions.length) return;

      const newQuestion = allDayQuestions[index];

      // Reset states - use functional update to get current preview URLs
      setImagePreviewUrls((prevUrls) => {
        prevUrls.forEach((url) => {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            // Ignore
          }
        });
        return [];
      });
      setImages([]);
      setError(null);
      setUploadProgress(0);
      setProcessingButton(null);

      // Update current question
      setCurrentIndex(index);
      setCurrentQuestion({
        question: newQuestion.question || newQuestion.question_text || "",
        questionId: newQuestion.question_id,
        image: newQuestion.question_image || "",
        level: newQuestion.question_level || "medium",
        topic: newQuestion.topic || dayTopic,
      });

      // Update ref and restart timer
      const qId =  newQuestion.question_id;
      currentQuestionIdRef.current = qId;
      stopTimer();
      startTimer(`lp-${qId}`);
    },
    [allDayQuestions, dayTopic, startTimer, stopTimer]
  );

  // Handle image upload
  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);

    if (oversizedFiles.length > 0) {
      setError("Some files exceed the 5MB size limit. Please select smaller images.");
      return;
    }

    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setImages((prevImages) => [...prevImages, ...files]);
    setImagePreviewUrls((prevUrls) => [...prevUrls, ...newPreviewUrls]);
    setError(null);
  }, []);

  // Handle captured image from camera
  const handleCapturedImage = useCallback((capturedImageBlob) => {
    const file = new File([capturedImageBlob], `captured-solution-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    const previewUrl = URL.createObjectURL(file);

    setImages((prevImages) => [...prevImages, file]);
    setImagePreviewUrls((prevUrls) => [...prevUrls, previewUrl]);
    setError(null);
  }, []);

  // Handle upload progress
  const handleUploadProgress = (percent) => {
    setUploadProgress(percent);
  };

  // Cancel image upload
  const handleCancelImage = useCallback((index) => {
    setImagePreviewUrls((prevUrls) => {
      if (prevUrls[index]) {
        try {
          URL.revokeObjectURL(prevUrls[index]);
        } catch (e) {
          // Ignore
        }
      }
      return prevUrls.filter((_, i) => i !== index);
    });

    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  }, []);

  // Get difficulty color
  const getDifficultyColor = (level) => {
    const normalizedLevel = level?.toLowerCase() || "";
    if (normalizedLevel === "easy") return "bg-green-100 text-green-800";
    if (normalizedLevel === "medium") return "bg-yellow-100 text-yellow-800";
    if (normalizedLevel === "hard") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  // Is question completed
  const isQuestionCompleted = (questionId) => {
    const key = `${activeDayIndex}-${questionId}`;
    return completedQuestions[key] === true;
  };

  // Get the resolved question ID with fallback
  const getResolvedQuestionId = () => {
    return currentQuestion.questionId
      || allDayQuestions?.[currentIndex]?.question_id
      || allDayQuestions?.[currentIndex]?.id;
  };

  // Handle Explain (Concepts) button
  const handleExplain = async () => {
    const resolvedQuestionId = getResolvedQuestionId();
    if (!resolvedQuestionId) {
      setError("Could not identify the question. Please go back and try again.");
      return;
    }

    setProcessingButton("explain");
    setError(null);

    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.floor(timeSpentMs / 60000);
    const timeSpentSeconds = Math.floor((timeSpentMs % 60000) / 1000);

    const formData = new FormData();
    formData.append("plan_id", planId);
    formData.append("day_number", dayNumber);
    formData.append("question_id", resolvedQuestionId);
    formData.append("answer_type", "explain");

    try {
      const response = await axiosInstance.post("/learning-path-submit-answer/", formData);

      // Navigate to result page
      navigate("/learning-path-result", {
        state: {
          ...response.data,
          actionType: "explain",
          question: currentQuestion.question,
          questionImage: currentQuestion.image,
          questionId: resolvedQuestionId,
          dayNumber,
          dayTopic,
          planId,
          examId,
          class_id,
          subject_id,
          topic_ids,
          currentQuestionIndex: currentIndex,
          allDayQuestions,
          learningPathData,
          learningPathForm,
          completedQuestions,
          activeDayIndex,
          totalQuestionsInDay,
          nextDayData,
        },
      });
    } catch (error) {
      console.error("API Error:", error);
      setError(error.response?.data?.error || error.message || "Failed to get concepts. Please try again.");
      setProcessingButton(null);
      startTimer(`lp-${resolvedQuestionId}`);
    }
  };

  // Handle Solve (AI Solution) button
  const handleSolve = async () => {
    const resolvedQuestionId = getResolvedQuestionId();
    if (!resolvedQuestionId) {
      setError("Could not identify the question. Please go back and try again.");
      return;
    }

    setProcessingButton("solve");
    setError(null);

    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.floor(timeSpentMs / 60000);
    const timeSpentSeconds = Math.floor((timeSpentMs % 60000) / 1000);

    const formData = new FormData();
    formData.append("plan_id", planId);
    formData.append("day_number", dayNumber);
    formData.append("question_id", resolvedQuestionId);
    formData.append("answer_type", "solve");

    try {
      const response = await axiosInstance.post("/learning-path-submit-answer/", formData);

      navigate("/learning-path-result", {
        state: {
          ...response.data,
          actionType: "solve",
          question: currentQuestion.question,
          questionImage: currentQuestion.image,
          questionId: resolvedQuestionId,
          dayNumber,
          dayTopic,
          planId,
          examId,
          class_id,
          subject_id,
          topic_ids,
          currentQuestionIndex: currentIndex,
          allDayQuestions,
          learningPathData,
          learningPathForm,
          completedQuestions,
          activeDayIndex,
          totalQuestionsInDay,
          nextDayData,
        },
      });
    } catch (error) {
      console.error("API Error:", error);
      setError(error.response?.data?.error || error.message || "Failed to get solution. Please try again.");
      setProcessingButton(null);
      startTimer(`lp-${resolvedQuestionId}`);
    }
  };

  // Handle Correct (AI Correct) button
  const handleCorrect = async () => {
    if (images.length === 0) {
      setError("Please capture or upload your solution image first.");
      return;
    }

    const resolvedQuestionId = getResolvedQuestionId();
    if (!resolvedQuestionId) {
      setError("Could not identify the question. Please go back and try again.");
      return;
    }

    setProcessingButton("correct");
    setError(null);

    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.floor(timeSpentMs / 60000);
    const timeSpentSeconds = Math.floor((timeSpentMs % 60000) / 1000);

    const formData = new FormData();
    formData.append("plan_id", planId);
    formData.append("day_number", dayNumber);
    formData.append("question_id", resolvedQuestionId);
    formData.append("answer_type", "correct");
    formData.append("study_time_minutes", timeSpentMinutes);
    formData.append("study_time_seconds", timeSpentSeconds);

    // Add images
    images.forEach((image) => {
      formData.append("ans_img", image);
    });

    try {
      setUploadProgress(0);
      const response = await axiosInstance.uploadFile(
        "/learning-path-submit-answer/",
        formData,
        handleUploadProgress
      );

      // Mark question as completed
      const key = `${activeDayIndex}-${resolvedQuestionId}`;
      const updatedCompletedQuestions = {
        ...completedQuestions,
        [key]: true,
      };
      setCompletedQuestions(updatedCompletedQuestions);

      // Update localStorage
      if (planId) {
        localStorage.setItem(`lp_completed_${planId}`, JSON.stringify(updatedCompletedQuestions));
        const currentPoints = parseInt(localStorage.getItem(`lp_points_${planId}`) || "0", 10);
        localStorage.setItem(`lp_points_${planId}`, (currentPoints + (response.data.points || 0)).toString());
      }

      navigate("/learning-path-result", {
        state: {
          ...response.data,
          actionType: "correct",
          question: currentQuestion.question,
          questionImage: currentQuestion.image,
          questionId: resolvedQuestionId,
          dayNumber,
          dayTopic,
          planId,
          examId,
          class_id,
          subject_id,
          topic_ids,
          currentQuestionIndex: currentIndex,
          allDayQuestions,
          learningPathData,
          learningPathForm,
          completedQuestions: updatedCompletedQuestions,
          activeDayIndex,
          totalQuestionsInDay,
          studentImages: images.map((img) => URL.createObjectURL(img)),
          nextDayData,
        },
      });
    } catch (error) {
      console.error("API Error:", error);
      if (error.code === "ECONNABORTED") {
        setError("Request timed out. Please try with a smaller image or check your connection.");
      } else {
        setError(error.response?.data?.error || error.message || "Failed to correct the solution. Please try again.");
      }
      setProcessingButton(null);
      setUploadProgress(0);
      startTimer(`lp-${resolvedQuestionId}`);
    }
  };

  // Handle back to learning path session
  const handleBackToSession = () => {
    navigate("/learning-path-session", {
      state: {
        learningPathData,
        planId,
        examId,
        class_id,
        subject_id,
        topic_ids,
        learningPathForm,
        nextDayData,
      },
      replace: true,
    });
  };

  // Determine if any button is processing
  const isAnyButtonProcessing = () => processingButton !== null;

  // Determine if a specific button is processing
  const isButtonProcessing = (buttonType) => processingButton === buttonType;

  // Cleanup on unmount - use ref to avoid stale closure
  const imagePreviewUrlsRef = useRef(imagePreviewUrls);
  imagePreviewUrlsRef.current = imagePreviewUrls;

  useEffect(() => {
    return () => {
      // Revoke all image URLs on unmount
      imagePreviewUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignore
        }
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBackToSession}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Day {dayNumber}
            </button>

            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#00A0E3] text-white rounded-full">
              <Route className="w-3.5 h-3.5" />
              Day {dayNumber}: {dayTopic}
            </span>

            <StudyTimer className={processingButton ? "stopped" : ""} />
          </div>

          {/* Question Navigation */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigateToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0 || isAnyButtonProcessing()}
              className="p-1.5 border border-[#00A0E3] text-[#00A0E3] rounded-lg hover:bg-[#00A0E3]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1.5 overflow-x-auto py-1">
              {allDayQuestions.map((q, idx) => {
                const isCompleted = isQuestionCompleted(q.question_id);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.question_id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all flex-shrink-0 ${
                      isCurrent
                        ? 'bg-[#00A0E3] text-white shadow-md'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-500 hover:border-[#00A0E3]'
                    }`}
                    onClick={() => navigateToQuestion(idx)}
                    disabled={isAnyButtonProcessing()}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => navigateToQuestion(currentIndex + 1)}
              disabled={currentIndex === allDayQuestions.length - 1 || isAnyButtonProcessing()}
              className="p-1.5 border border-[#00A0E3] text-[#00A0E3] rounded-lg hover:bg-[#00A0E3]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-bold text-[#0B1120]">Question {currentIndex + 1}</span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(currentQuestion.level)}`}>
                {currentQuestion.level || "Medium"}
              </span>
              {currentQuestion.topic && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {currentQuestion.topic}
                </span>
              )}
              {isQuestionCompleted(currentQuestion.questionId) && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  <Check className="w-3 h-3" />
                  Completed
                </span>
              )}
            </div>
          </div>

          {currentQuestion.image && (
            <img
              src={getImageSrc(currentQuestion.image)}
              alt="Question"
              className="max-w-full rounded-lg border border-gray-100 mb-4"
            />
          )}

          <div className="text-sm text-gray-800 leading-relaxed">
            <MarkdownWithMath content={currentQuestion.question} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0">
              &times;
            </button>
          </div>
        )}

        {/* Image Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <h6 className="text-sm font-semibold text-[#0B1120] flex items-center gap-2 mb-2">
            <ImageIcon className="w-4 h-4 text-[#00A0E3]" />
            Upload Your Solution
          </h6>
          <p className="text-xs text-gray-400 mb-4">
            Upload images of your handwritten solution to get AI feedback. You can upload multiple images.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* File Upload */}
            <div className="flex-1">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={isAnyButtonProcessing()}
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className={`flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#00A0E3] hover:bg-[#00A0E3]/5 transition-all ${
                  isAnyButtonProcessing() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Choose Files</span>
                <span className="text-xs text-gray-400">or drag and drop</span>
              </label>
            </div>

            {/* Camera Capture Option */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setImageSourceType(imageSourceType === "camera" ? "file" : "camera")}
                disabled={isAnyButtonProcessing()}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center ${
                  imageSourceType === "camera"
                    ? 'bg-[#00A0E3] text-white'
                    : 'border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3]/10'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Camera className="w-4 h-4" />
                {imageSourceType === "camera" ? "Hide Camera" : "Use Camera"}
              </button>
            </div>
          </div>

          {/* Camera Capture */}
          {imageSourceType === "camera" && (
            <div className="mt-4">
              <CameraCapture
                onImageCapture={handleCapturedImage}
                videoConstraints={{
                  facingMode: { ideal: "environment" },
                  width: { ideal: 4096 },
                  height: { ideal: 3072 },
                  focusMode: { ideal: "continuous" },
                  exposureMode: { ideal: "continuous" },
                }}
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                Click "Capture" to take a photo of your solution
              </p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isAnyButtonProcessing() && uploadProgress > 0 && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-[#00A0E3] rounded-full transition-all duration-300 animate-pulse"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-1.5">Uploading... Please don't close this page.</p>
          </div>
        )}

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h6 className="text-sm font-semibold text-[#0B1120] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#00A0E3]" />
                Solution Images ({images.length})
              </h6>
              <button
                onClick={() => {
                  revokeImageUrls(imagePreviewUrls);
                  setImages([]);
                  setImagePreviewUrls([]);
                }}
                disabled={isAnyButtonProcessing()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imagePreviewUrls[index]}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleCancelImage(index)}
                    disabled={isAnyButtonProcessing()}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                    aria-label="Remove image"
                  >
                    &times;
                  </button>
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={handleExplain}
              disabled={isAnyButtonProcessing()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isButtonProcessing("explain") ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4" />
                  Concepts Required
                </>
              )}
            </button>

            <button
              onClick={handleSolve}
              disabled={images.length > 0 || isAnyButtonProcessing()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                images.length > 0 ? 'relative' : ''
              }`}
              title={images.length > 0 ? "Remove uploaded images to use AI Solution" : "Get AI-generated solution"}
            >
              {isButtonProcessing("solve") ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  AI Solution
                  {images.length > 0 && <span className="block text-[10px] mt-0.5">(Clear images first)</span>}
                </>
              )}
            </button>

            <button
              onClick={handleCorrect}
              disabled={images.length === 0 || isAnyButtonProcessing()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                images.length > 0
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-green-500 text-white'
              }`}
              title={images.length === 0 ? "Upload images of your solution first" : "Submit your solution for AI correction"}
            >
              {isButtonProcessing("correct") ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  AI Correct
                  {images.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">{images.length}</span>
                  )}
                </>
              )}
            </button>
          </div>

          {/* Helper text based on state */}
          <div className="mt-3 text-center">
            {images.length === 0 ? (
              <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Upload className="w-3 h-3" />
                Upload your solution images above to enable AI Correct
              </span>
            ) : (
              <span className="text-xs text-green-600 flex items-center justify-center gap-1">
                <Check className="w-3 h-3" />
                {images.length} image{images.length > 1 ? 's' : ''} ready for AI Correct
              </span>
            )}
          </div>
        </div>

        {/* Points Info */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span>Earn points by completing questions! AI Correct gives you the most points.</span>
        </div>
      </div>
    </div>
  );
}

export default LearningPathQuestion;
