// src/components/SolveQuestion.jsx
import React, { useState, useContext, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { BookOpenCheck, ChevronDown, HelpCircle, Camera, Upload, Loader2, ClipboardList, Hash, CheckCircle2 } from "lucide-react";
import QuestionListModal from "./QuestionListModal";
import { ProgressContext } from "../contexts/ProgressContext";
import { NotificationContext } from "../contexts/NotificationContext";
import { QuestContext } from "../contexts/QuestContext";
import { QUEST_TYPES } from "../models/QuestSystem";
import { useSoundFeedback } from "../hooks/useSoundFeedback";
import { useTimer } from "../contexts/TimerContext";
import StudyTimer from "./StudyTimer";
import { useCurrentQuestion } from "../contexts/CurrentQuestionContext";
import MarkdownWithMath from "./MarkdownWithMath";
import CameraCapture from "./CameraCapture";
import Tutorial from "./Tutorial";
import { useTutorial } from "../contexts/TutorialContext";
import { getImageSrc, prepareImageForApi } from "../utils/imageUtils";
import AnimatedBackground from "./AnimatedBackground";
import { useMascot, MASCOT_ANIMATIONS } from "../contexts/MascotContext";
import { FloatingMascot, useSpeechBubble } from "./Mascot3D";



function SolveQuestion() {
  const location = useLocation();
  const navigate = useNavigate();

  // Progress and Notification Contexts
  const { updateStudySession } = useContext(ProgressContext);
  const { addProgressNotification } = useContext(NotificationContext);
  const { updateQuestProgress } = useContext(QuestContext);

  // Timer context
  const {
    startTimer,
    stopTimer
  } = useTimer();

  // Sound feedback hook
  const { playQuestionSolvedSound, playAchievementSound } = useSoundFeedback();

  // Tutorial context
  const {
    shouldShowTutorialForPage,
    continueTutorialFlow,
    startTutorialFromToggle,
    startTutorialForPage,
    tutorialFlow,
    completedPages,
  } = useTutorial();

  // Mascot context
  const { setThinking, setIdle, setExplaining, playAnimation, ANIMATIONS } = useMascot();

  // Speech bubble for contextual mascot tips
  const {
    currentBubble,
    showBubble: isBubbleVisible,
    showMessage: showMascotMessage,
    hideMessage: hideMascotMessage,
  } = useSpeechBubble();

  // State for tracking study session
  const [studyTime, setStudyTime] = useState(0);
  const [images, setImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]); // Store preview URLs separately
  const [isSolveEnabled, setIsSolveEnabled] = useState(true);
  const [showQuestionListModal, setShowQuestionListModal] = useState(false);
  const [processingButton, setProcessingButton] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [imageSourceType, setImageSourceType] = useState("upload"); // "upload" or "camera"
  const [shareWithChat, setShareWithChat] = useState(() => {
    const stored = localStorage.getItem("include_question_context");
    return stored === null ? false : stored === "true";
  });
  const [isContextExpanded, setIsContextExpanded] = useState(false);

  // JEE-specific states
const [jeeQuestionType, setJeeQuestionType] = useState(null);
const [selectedOption, setSelectedOption] = useState(null);
const [numericalAnswer, setNumericalAnswer] = useState('');
const [mcqOptions, setMcqOptions] = useState([]);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Ensure context sharing starts enabled when entering SolveQuestion
  useEffect(() => {
    setShareWithChat(true);
    localStorage.setItem("include_question_context", "true");
  }, []);

  // Set mascot to encouraging mode when solving questions
  useEffect(() => {
    playAnimation(MASCOT_ANIMATIONS.LOOK_RIGHT, { loop: true });
  }, [playAnimation]);

  // Apply dark mode on component mount and listen for changes
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(darkModeEnabled);
      document.body.classList.toggle('dark-mode', darkModeEnabled);
    };

    checkDarkMode();

    // Listen for storage events (dark mode changes in other tabs/components)
    window.addEventListener('storage', checkDarkMode);

    return () => {
      window.removeEventListener('storage', checkDarkMode);
    };
  }, []);

  // Tutorial steps for SolveQuestion
  const tutorialSteps = [
    {
      target: '.question-text-container',
      content: 'Welcome to the question solving page! This is your question. Read it carefully and try to solve it on paper or in your notebook.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.solve-question-header',
      content: 'The timer tracks how long you spend on this question. This helps you manage your time better.',
      placement: 'bottom',
    },
    {
      target: '.image-source-buttons',
      content: 'Take a photo of your solution using your camera. Make sure your handwriting is clear!',
      placement: 'top',
    },
    {
      target: '.explain-btn',
      content: 'Click "Concepts-Required" to understand what concepts you need to solve this question.',
      placement: 'top',
    },
    {
      target: '.solve-btn',
      content: 'Click "AI-Solution" to see the complete step-by-step solution from our AI tutor.',
      placement: 'top',
    },
    {
      target: '.btn-correct',
      content: 'After taking a photo of your solution, click "AI-Correct" to get feedback and corrections from AI!',
      placement: 'top',
    },
  ];

  // Handle tutorial completion for SolveQuestion
  const handleTutorialComplete = () => {
    // Tutorial will continue when user navigates to result page
  };

  // Debug logging for tutorial
  useEffect(() => {
    const shouldShow = shouldShowTutorialForPage("solveQuestion");
  }, [shouldShowTutorialForPage, tutorialFlow, completedPages]);

  // Extract data from location state
  const {
    question,
    index,
    questionList,
    class_id,
    subject_id,
    topic_ids,
    subtopic,
    selectedQuestions,
    question_id,
    context

  } = location.state || {};
  const { questionNumber } = location.state || {};
  const questionId = location.state?.questionId || `${index}${Date.now()}`;
  const question_image =
    location.state?.image || questionList?.[index]?.image || "";
  const questioniid=location.state?.question_id || questionId;
  const [currentQuestion, setCurrentQuestion] = useState({
    question: question,
    questionNumber: questionNumber || (index !== undefined ? index + 1 : 1),
    image: question_image,
    context:context,
    question_id: question_id || questionId
  });

  const { setCurrentQuestion: setContextQuestion, setQuestion } = useCurrentQuestion();

  // Use ref to track previous location state to prevent redundant updates
  const prevLocationStateRef = useRef(null);

  // Memoize cleanup function to revoke image URLs
  const revokeImageUrls = useCallback((urls) => {
    urls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.debug('URL already revoked:', url);
      }
    });
  }, []);

  // Start timer on initial mount
  useEffect(() => {
    const initialQuestionId = location.state?.question_id || `${index}${Date.now()}`;
    startTimer(initialQuestionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Stop timer when component unmounts (only run on unmount)
  useEffect(() => {
    return () => {
      const timeSpent = stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on unmount

  useEffect(() => {
    // Check if location.state has actually changed to prevent redundant updates
    if (location.state && location.state !== prevLocationStateRef.current) {
      prevLocationStateRef.current = location.state;

      const newQuestionId = location.state?.question_id || `${index}`;

      const newQuestion = {
        question: location.state.question || "",
        questionNumber:
          location.state.questionNumber ||
          (index !== undefined ? index + 1 : 1),
        image: location.state.image || "",
        id: newQuestionId,
        question_id: location.state?.question_id || newQuestionId,
        context: location.state?.context || null
      };

      const jeeType = location.state?.jeeQuestionType;
      if (jeeType) {
        setJeeQuestionType(jeeType);
        console.log("JEE Question Type:", jeeType);

        if (jeeType === 'mcq' && location.state.question) {
          const options = parseMCQOptions(location.state.question);
          setMcqOptions(options);
          console.log("Parsed options:", options);
        }
      } else {
        setJeeQuestionType(null);
        setSelectedOption(null);
        setNumericalAnswer('');
        setMcqOptions([]);
      }

      // Prepare metadata for API calls
      const metadata = {
        class_id: location.state.class_id,
        subject_id: location.state.subject_id,
        topic_ids: location.state.topic_ids,
        subtopic: location.state.subtopic,
        worksheet_id: location.state.worksheet_id,
      };

      setCurrentQuestion(newQuestion);
      setQuestion(newQuestion, index || 0, questionList || [], metadata);

      // Stop previous timer and start a new one
      stopTimer();
      startTimer(newQuestionId);

      // Reset other state
      revokeImageUrls(imagePreviewUrls);
      setImages([]);
      setImagePreviewUrls([]);
      setError(null);
      setUploadProgress(0);
      setProcessingButton(null);
      setIsContextExpanded(false);
    }
  }, [location.state, index, setQuestion, questionList, stopTimer, startTimer, revokeImageUrls, imagePreviewUrls]);

  // Persist the share-with-chat preference
  useEffect(() => {
    localStorage.setItem("include_question_context", String(shareWithChat));
  }, [shareWithChat]);

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64Data, mimeType) => {
    try {
      const dataStart = base64Data.indexOf(",");
      const actualData =
        dataStart !== -1 ? base64Data.slice(dataStart + 1) : base64Data;

      const byteCharacters = atob(actualData);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      return new Blob(byteArrays, { type: mimeType });
    } catch (error) {
      console.error("Error converting base64 to blob:", error);
      return null;
    }
  };

  // Handle image upload
  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files);

    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);

    if (oversizedFiles.length > 0) {
      setError(
        `Some files exceed the 5MB size limit. Please select smaller images.`
      );
      return;
    }

    const newPreviewUrls = files.map(file => URL.createObjectURL(file));

    setImages(prevImages => [...prevImages, ...files]);
    setImagePreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
    setIsSolveEnabled(false);
    setError(null);
  }, []);

  // Handle captured image from camera
  const handleCapturedImage = useCallback((capturedImageBlob) => {
    const file = new File([capturedImageBlob], `captured-solution-${Date.now()}.jpg`, { type: 'image/jpeg' });

    const previewUrl = URL.createObjectURL(file);

    setImages(prevImages => [...prevImages, file]);
    setImagePreviewUrls(prevUrls => [...prevUrls, previewUrl]);
    setIsSolveEnabled(false);
    setError(null);
  }, []);

  // Handle upload progress
  const handleUploadProgress = (percent) => {
    setUploadProgress(percent);
  };

  // Handlers for different actions
  const handleSubmit = () => {
    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.ceil(timeSpentMs / 60000);

    sendFormData({
      submit: true,
      study_time_seconds: Math.floor(timeSpentMs / 1000),
      study_time_minutes: timeSpentMinutes
    }, "submit");
  };

  const handleSolve = () => {
    playAnimation(ANIMATIONS.LOOK_RIGHT, { loop: true });
    showMascotMessage("Let me solve this for you!", 3000);

    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.ceil(timeSpentMs / 60000);

    sendFormData({
      solve: true,
      study_time_seconds: Math.floor(timeSpentMs / 1000),
      study_time_minutes: timeSpentMinutes
    }, "solve");
  };

  const handleExplain = () => {
    playAnimation(ANIMATIONS.LOOK_RIGHT, { loop: true });
    showMascotMessage("I'll explain the key concepts!", 3000);

    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.ceil(timeSpentMs / 60000);

    sendFormData({
      explain: true,
      study_time_seconds: Math.floor(timeSpentMs / 1000),
      study_time_minutes: timeSpentMinutes
    }, "explain");
  };

  // Enhanced handleCorrect function
  const handleCorrect = async () => {
    playAnimation(ANIMATIONS.LOOK_RIGHT, { loop: true });
    showMascotMessage("Analyzing your solution...", 3000);

    setProcessingButton("correct");
    setError(null);

    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.floor(timeSpentMs / 60000);

    const formData = new FormData();
    formData.append("class_id", class_id);
    formData.append("subject_id", subject_id);
    formData.append("topic_ids", topic_ids);

    formData.append("subtopic", subtopic);
    formData.append("correct", true);
    formData.append("study_time_seconds", Math.floor((timeSpentMs % 60000) / 1000));
    formData.append("study_time_minutes", timeSpentMinutes);
    formData.append("question_id", currentQuestion.question_id || currentQuestion.id);

    if (jeeQuestionType === 'mcq') {
      formData.append("jee_question_type", "mcq");
      formData.append("selected_option", selectedOption);
      console.log("MCQ - Selected:", selectedOption);
    } else if (jeeQuestionType === 'nvtq') {
      formData.append("jee_question_type", "nvtq");
      formData.append("numerical_answer", numericalAnswer);
      console.log("NVTQ - Answer:", numericalAnswer);
    } else if (jeeQuestionType === 'theorem') {
      formData.append("jee_question_type", "theorem");
      console.log("THEOREM - Image required");
    }

    // Helper: finalize and send the form after appending everything
    const finalizeAndSendForm = async () => {
      if (images.length > 0) {
        images.forEach((image) => {
          formData.append("ans_img", image);
        });
      }

      try {
        setUploadProgress(0);
        const response = await axiosInstance.uploadFile(
          "/anssubmit/",
          formData,
          handleUploadProgress
        );

        updateStudySession(
          new Date().toISOString().split("T")[0],
          timeSpentMinutes,
          1,
          100
        );

        updateQuestProgress("daily_solve_questions", 1, QUEST_TYPES.DAILY);

        navigate("/resultpage", {
          state: {
            ...response.data,
            actionType: "correct",
            questionList,
            class_id,
            subject_id,
            topic_ids,
            subtopic,
            questionImage: currentQuestion.image,
            questionNumber: currentQuestion.questionNumber,
            question_id: currentQuestion.question_id || currentQuestion.id,
            context: currentQuestion.context,
            studentImages: images.map(img => URL.createObjectURL(img)),
          },
        });

        playQuestionSolvedSound(true, 100);
      } catch (error) {
        console.error("API Error:", error);
        if (error.code === "ECONNABORTED") {
          setError(
            "Request timed out. Please try with a smaller image or check your connection."
          );
        } else if (error.friendlyMessage) {
          setError(error.friendlyMessage);
        } else {
          setError("Failed to correct the solution. Please try again.");
        }
        setProcessingButton(null);
        setUploadProgress(0);

        startTimer(currentQuestion.id);
      }
    };

    // Process question image as base64
    if (currentQuestion.image) {
      if (currentQuestion.image.startsWith("data:image")) {
        formData.append("ques_img", currentQuestion.image);
        finalizeAndSendForm();
      } else if (currentQuestion.image.startsWith("http")) {
        try {
          const imageResponse = await fetch(currentQuestion.image);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
          }

          const blob = await imageResponse.blob();
          const reader = new FileReader();

          reader.onloadend = async () => {
            const base64String = reader.result;
            formData.append("question_img_base64", base64String);
            finalizeAndSendForm();
          };

          reader.readAsDataURL(blob);
      } catch (fetchError) {
        console.error(
            "Error fetching or converting image to base64:",
            fetchError
        );
          setError(`Error fetching image: ${fetchError.message}`);
          finalizeAndSendForm();
        }
      } else {
        console.warn(
          "Unsupported image format:",
          currentQuestion.image.substring(0, 30)
        );
        finalizeAndSendForm();
      }
    } else {
      finalizeAndSendForm();
    }
  };

  // New handler for Gap Analysis
  const handleGapAnalysis = () => {
    stopTimer();

    navigate("/gap-analysis", {
      state: {
        question: currentQuestion.question,
        questionImage: currentQuestion.image,
        class_id,
        subject_id,
        topic_ids,
      },
    });
  };

  // Send form data with progress tracking
  const sendFormData = async (flags = {}, actionType) => {
    setProcessingButton(actionType);
    setError(null);

    const formData = new FormData();
    formData.append("class_id", class_id);
    formData.append("subject_id", subject_id);
    formData.append("topic_ids", topic_ids);
    formData.append("subtopic", subtopic);
    formData.append("question_id", currentQuestion.question_id || currentQuestion.id);
    Object.entries(flags).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (flags.submit) {
      images.forEach((image) => {
        formData.append("ans_img", image);
      });
    }
    try {
      let response;

      if (flags.submit) {
        response = await axiosInstance.uploadFile(
          "/anssubmit/",
          formData,
          handleUploadProgress
        );
      } else {
        response = await axiosInstance.post("/anssubmit/", formData);
      }

      if (flags.study_time_minutes) {
        updateStudySession(
          new Date().toISOString().split("T")[0],
          flags.study_time_minutes,
          1,
          0
        );
      }

      navigate("/resultpage", {
        state: {
          ...response.data,
          actionType,
          questionList,
          class_id,
          subject_id,
          topic_ids,
          subtopic,
          questionImage: currentQuestion.image,
          questionNumber: currentQuestion.questionNumber,
          question_id: currentQuestion.question_id || currentQuestion.id,
          context: currentQuestion.context,
        },
      });
    } catch (error) {
      console.error("API Error:", error);

      if (error.code === "ECONNABORTED") {
        setError(
          "Request timed out. Please try with a smaller image or check your connection."
        );
      } else if (error.friendlyMessage) {
        setError(error.friendlyMessage);
      } else {
        setError("Failed to perform the action. Please try again.");
      }

      setProcessingButton(null);
      setUploadProgress(0);

      startTimer(currentQuestion.id);
    }
  };

  // Cancel image upload
  const handleCancelImage = useCallback((index) => {
    setImagePreviewUrls(prevUrls => {
      if (prevUrls[index]) {
        revokeImageUrls([prevUrls[index]]);
      }
      return prevUrls.filter((_, i) => i !== index);
    });

    setImages(prevImages => {
      const updatedImages = prevImages.filter((_, i) => i !== index);
      setIsSolveEnabled(updatedImages.length === 0);
      return updatedImages;
    });
  }, [revokeImageUrls]);

  // Select question from list
  const handleQuestionSelect = useCallback((
    selectedQuestion,
    selectedIndex,
    selectedImage,
    question_id,
    questionContext = null

  ) => {
    stopTimer();

    const newQuestionId = `${question_id}`;
    setCurrentQuestion({
      question: selectedQuestion,
      questionNumber: selectedIndex + 1,
      image: selectedImage,
      id: newQuestionId,
      question_id: selectedQuestion.question_id || newQuestionId,
      context: questionContext
    });

    startTimer(newQuestionId);

    setImagePreviewUrls(prevUrls => {
      revokeImageUrls(prevUrls);
      return [];
    });
    setImages([]);
    setIsSolveEnabled(true);
    setError(null);
    setUploadProgress(0);

    setIsContextExpanded(false);

    setShowQuestionListModal(false);
  }, [stopTimer, startTimer, revokeImageUrls]);

  // Handle back button click
  const handleBackClick = () => {
    stopTimer();
    navigate("/student-dash");
  };

  // Determine if a specific button is processing
  const isButtonProcessing = (buttonType) => {
    return processingButton === buttonType;
  };

  // Determine if any button is processing (to disable all buttons)
  const isAnyButtonProcessing = () => {
    return processingButton !== null;
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      revokeImageUrls(imagePreviewUrls);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

    const parseMCQOptions = (questionText) => {
      const options = [];
      const optionRegex = /\(([a-d])\)\s*([^\(]+?)(?=\([a-d]\)|$)/gi;

      let match;
      while ((match = optionRegex.exec(questionText)) !== null) {
        let cleanText = match[2]
          .replace(/\\/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        options.push({
          key: match[1].toLowerCase(),
          text: cleanText
        });
      }

      return options;
    };

    // Remove MCQ options from question text so they don't appear twice
    const removeOptionsFromQuestion = (questionText) => {
      const optionStartIndex = questionText.search(/\(a\)\s*/i);

      if (optionStartIndex > 0) {
        let cleanText = questionText.substring(0, optionStartIndex);
        cleanText = cleanText.replace(/\\/g, '').trim();
        return cleanText;
      }

      return questionText.replace(/\\/g, '').trim();
    };

  return (
    <div className={`relative min-h-screen overflow-y-auto ${isDarkMode ? 'bg-[#0B1120] text-white' : 'bg-[#F8FAFC]'}`}>
      {/* Animated Background with floating math/science symbols */}
      {/* <AnimatedBackground isDarkMode={isDarkMode} symbolCount={35} showOrbs={true} /> */}

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Header section with timer */}
        <div className="solve-question-header flex justify-between items-center mb-4">
          {/* Study Timer */}
          <StudyTimer className={processingButton ? "stopped" : ""} />
          {/* Tutorial Toggle Button */}
          <button
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg text-sm font-medium transition-transform hover:scale-105"
            onClick={() => startTutorialForPage("solveQuestion")}
            title="Start Tutorial"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Tutorial</span>
          </button>
        </div>

        {/* Context Section - Only show if context exists */}
        {currentQuestion.context && (
          <div className={`rounded-xl mb-5 overflow-hidden border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div
              className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
              onClick={() => setIsContextExpanded(!isContextExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="text-[#00A0E3]">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-[#0B1120]'}`}>
                  Reading Context
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isContextExpanded ? 'rotate-180' : ''}`}
              />
            </div>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: isContextExpanded ? '400px' : '0' }}
            >
              <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
                <div className={`px-5 py-4 text-[15px] leading-relaxed ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-[#0B1120]'}`}>
                  <MarkdownWithMath content={currentQuestion.context} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Display Section - Full Width */}
        <div className="question-display-section mb-6">
          <div className="question-text-container bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <span className="question-title inline-block text-sm font-bold text-[#00A0E3] bg-blue-50 px-3 py-1 rounded-full mb-3">
              Question {currentQuestion.questionNumber}
            </span>
            {currentQuestion.image && (
              <img
                src={getImageSrc(currentQuestion.image)}
                alt="Question"
                className="max-w-full rounded-lg my-3 border border-gray-200"
              />
            )}
            <div className="text-[#0B1120] text-base leading-relaxed">
              <MarkdownWithMath
                content={
                  jeeQuestionType === 'mcq'
                    ? removeOptionsFromQuestion(currentQuestion.question)
                    : currentQuestion.question
                }
              />
            </div>
            {/* MCQ OPTIONS */}
            {jeeQuestionType === 'mcq' && mcqOptions.length > 0 && (
              <div className={`mt-6 mb-6 p-5 rounded-xl border-2 shadow-sm ${
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
              }`}>
                <div className={`flex items-center mb-4 pb-3 border-b-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <ClipboardList className={`w-5 h-5 mr-2.5 ${isDarkMode ? 'text-[#00A0E3]' : 'text-[#00A0E3]'}`} />
                  <h6 className={`text-lg font-bold m-0 tracking-wide ${isDarkMode ? 'text-gray-100' : 'text-[#0B1120]'}`}>
                    Select Your Answer
                  </h6>
                </div>

                <div className="flex flex-col gap-2.5">
                  {mcqOptions.map((option) => (
                    <label
                      key={option.key}
                      className={`flex items-center px-4 py-3.5 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedOption === option.key
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white border-violet-400 shadow-lg shadow-violet-600/40 translate-x-1'
                            : 'bg-gradient-to-r from-[#00A0E3] to-[#0080B8] text-white border-[#00A0E3] shadow-lg shadow-blue-400/30 translate-x-1'
                          : isDarkMode
                            ? 'bg-gray-800 text-gray-100 border-gray-600 hover:border-[#00A0E3] hover:translate-x-0.5'
                            : 'bg-white text-[#0B1120] border-gray-300 hover:border-[#00A0E3] hover:translate-x-0.5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mcq-option"
                        value={option.key}
                        checked={selectedOption === option.key}
                        onChange={() => {
                          setSelectedOption(option.key);
                          console.log("Selected:", option.key);
                        }}
                        className="w-5 h-5 mr-3 cursor-pointer accent-[#00A0E3]"
                      />
                    <div className="text-base flex-1 flex items-center gap-2" style={{ fontWeight: selectedOption === option.key ? '600' : '400' }}>
                      <span className="font-bold min-w-[30px]">({option.key})</span>
                      <MarkdownWithMath content={option.text} />
                    </div>
                    </label>
                  ))}
                </div>

                {selectedOption && (
                  <div className={`mt-4 px-4 py-3 border-l-4 rounded-lg text-[15px] font-semibold flex items-center gap-2 ${
                    isDarkMode
                      ? 'bg-green-500/10 border-green-500 text-green-300'
                      : 'bg-green-50 border-green-500 text-green-600'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selected: Option ({selectedOption.toUpperCase()})</span>
                  </div>
                )}
              </div>
            )}

            {/* NVTQ INPUT */}
            {jeeQuestionType === 'nvtq' && (
              <div className={`mt-5 mb-5 p-4 rounded-lg border-2 ${
                isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h6 className={`text-base font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : 'text-[#0B1120]'}`}>
                  <Hash className="w-5 h-5 text-[#00A0E3]" />
                  Enter Your Numerical Answer
                </h6>

                <div className="flex items-center gap-3">
                  <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Answer:
                  </span>

                  <input
                    type="text"
                    value={numericalAnswer}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                        setNumericalAnswer(value);
                        console.log("Answer:", value);
                      }
                    }}
                    placeholder="Write Your Answer Here"
                    className={`flex-1 px-5 py-3 text-lg font-semibold rounded-md border-2 outline-none text-center transition-colors ${
                      isDarkMode
                        ? `bg-gray-700 text-gray-100 ${numericalAnswer ? 'border-[#00A0E3]' : 'border-gray-600'}`
                        : `bg-white text-[#0B1120] ${numericalAnswer ? 'border-[#00A0E3]' : 'border-gray-200'}`
                    }`}
                  />
                </div>

                {numericalAnswer && (
                  <div className={`mt-2.5 p-2.5 rounded-md text-sm text-center ${
                    isDarkMode ? 'bg-green-500/10 text-green-300' : 'bg-green-50 text-green-600'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 inline mr-1" /> Your answer: {numericalAnswer}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3">
              <label className="inline-flex items-center cursor-pointer gap-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="share-with-chat-toggle"
                    className="sr-only peer"
                    checked={shareWithChat}
                    onChange={(e) => setShareWithChat(e.target.checked)}
                    disabled={isAnyButtonProcessing()}
                  />
                  <div className="w-10 h-5 bg-gray-300 peer-checked:bg-[#00A0E3] rounded-full transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Share this question with Chat
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="my-3 border-l-4 border-[#ef4444] bg-red-50 text-[#ef4444] px-4 py-3 rounded-r-lg text-sm">
            {error}
          </div>
        )}

        {/* Image Upload Section */}
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-[#0B1120]'}`}>
              Add Solution Images
            </label>

            {/* Image Source Selection Buttons */}
            <div className="image-source-buttons mb-3 flex gap-2">
              <button
                type="button"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  imageSourceType === "camera"
                    ? 'bg-[#00A0E3] text-white'
                    : 'border border-[#00A0E3] text-[#00A0E3] hover:bg-blue-50'
                }`}
                onClick={() => setImageSourceType("camera")}
                disabled={isAnyButtonProcessing()}
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
            </div>

            {/* Conditional rendering based on image source type */}
            {imageSourceType === "upload" ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={isAnyButtonProcessing()}
                  className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#00A0E3] file:text-white hover:file:bg-[#0080B8] ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum file size: 5MB per image. You can select multiple images.
                </p>
              </>
            ) : (
              <div className={`border-2 border-dashed rounded-lg p-5 mt-2.5 ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>

              <CameraCapture
                onImageCapture={handleCapturedImage}
                videoConstraints={{
                  facingMode: { ideal: "environment" },
                  width: { ideal: 4096 },
                  height: { ideal: 3072 },
                  focusMode: { ideal: "continuous" },
                  exposureMode: { ideal: "continuous" }
                }}
              />
                <p className="text-gray-400 mt-2 text-center text-sm">
                  Click "Capture" to take a photo of your solution
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Upload Progress Bar */}
        {isAnyButtonProcessing() && uploadProgress > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-[#00A0E3] rounded-full transition-all duration-300 flex items-center justify-center text-[10px] text-white font-semibold"
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress}%
              </div>
            </div>
            <p className="text-center mt-1 text-sm text-gray-500">
              Uploading... Please don't close this page.
            </p>
          </div>
        )}

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="mt-4">
            <h6 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-[#0B1120]'}`}>
              Solution Images ({images.length})
            </h6>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 mt-3">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imagePreviewUrls[index]}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-[150px] object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 w-6 h-6 bg-[#ef4444] text-white rounded-full text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCancelImage(index)}
                    disabled={isAnyButtonProcessing()}
                    aria-label="Remove image"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            {images.length > 0 && (
              <button
                type="button"
                className="mt-2 px-3 py-1.5 text-sm border border-[#ef4444] text-[#ef4444] rounded-lg hover:bg-red-50 transition-colors"
                onClick={() => {
                  setImagePreviewUrls(prevUrls => {
                    revokeImageUrls(prevUrls);
                    return [];
                  });
                  setImages([]);
                  setIsSolveEnabled(true);
                }}
                disabled={isAnyButtonProcessing()}
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Button Layout */}
        <div className="mt-6 space-y-3">
          {/* Top Row with Navigation and Submit */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={handleBackClick}
              className="btn-back w-full px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              disabled={isAnyButtonProcessing()}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setShowQuestionListModal(true)}
              className="btn-question-list w-full px-4 py-2.5 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              disabled={isAnyButtonProcessing()}
            >
              Question List
            </button>
          </div>

          {/* Bottom Row with Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleExplain}
              className="explain-btn w-full px-4 py-2.5 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              disabled={isAnyButtonProcessing()}
            >
              {isButtonProcessing("explain") ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Concepts-Required"
              )}
            </button>
            <button
              type="button"
              onClick={handleSolve}
              className={`solve-btn w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                isSolveEnabled
                  ? 'bg-[#00A0E3] hover:bg-[#0080B8] text-white'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
              disabled={!isSolveEnabled || isAnyButtonProcessing()}
            >
              {isButtonProcessing("solve") ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "AI-Solution"
              )}
            </button>

            <button
              type="button"
              onClick={handleCorrect}
              className="btn-correct w-full px-4 py-2.5 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              disabled={
                (jeeQuestionType === 'mcq' && !selectedOption) ||
                (jeeQuestionType === 'nvtq' && !numericalAnswer.trim()) ||
                (jeeQuestionType === 'theorem' && images.length === 0) ||
                (!jeeQuestionType && images.length === 0) ||
                isAnyButtonProcessing()
              }
            >
              {isButtonProcessing("correct") ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "AI-Correct"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Question List Modal */}
      <QuestionListModal
        show={showQuestionListModal}
        onHide={() => setShowQuestionListModal(false)}
        questionList={Array.isArray(selectedQuestions) && selectedQuestions.length > 0 ? selectedQuestions : questionList}
        onQuestionClick={handleQuestionSelect}
        isMultipleSelect={false}
        onMultipleSelectSubmit={null}
      />

      {/* Tutorial Component */}
      {shouldShowTutorialForPage("solveQuestion") && (
        <Tutorial
          steps={tutorialSteps}
          onComplete={handleTutorialComplete}
        />
      )}

      {/* Floating Mascot - Non-intrusive corner placement */}
      {/* <FloatingMascot
        position="bottom-right"
        size="medium"
        bottomOffset={80}
        speechBubble={currentBubble}
        showBubble={isBubbleVisible}
        onBubbleDismiss={hideMascotMessage}
      /> */}
    </div>
  );
}

export default SolveQuestion;
