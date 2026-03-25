// ExamMode.jsx - Exam creation and setup component
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  ClipboardList,
  School,
  BookOpen,
  List,
  Rocket,
  Clock,
  FileText,
  AlertTriangle,
  History,
  CheckCircle,
  XCircle,
  Trophy,
  ArrowRight,
  Play,
  Loader2,
} from "lucide-react";
import { AuthContext } from "./AuthContext";
import { useAlert } from "./AlertBox";
import axiosInstance from "../api/axiosInstance";

// API endpoints
const API_ENDPOINTS = {
  CLASSES: "/classes/",
  SUBJECTS: "/subjects/",
  CHAPTERS: "/chapters/",
  GENERATE_EXAM: "/generate-exam/",
  LEARNING_PATH_LIST: "/learning-plan-list/",
  LEARNING_PATH_NEXT_DAY: "/learning-path-next-day/",
};

function ExamMode() {
  const navigate = useNavigate();
  const { username, fullName } = useContext(AuthContext);
  const { showAlert, AlertContainer } = useAlert();

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // State for dropdown selections
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);

  // Selected values
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapters, setSelectedChapters] = useState([]);

  // Exam settings - duration in minutes (30 to 60)
  const [examDurationMinutes, setExamDurationMinutes] = useState(30);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Learning path history
  const [learningPathList, setLearningPathList] = useState([]);
  const [isLoadingLearningPath, setIsLoadingLearningPath] = useState(false);
  const [loadingJourneyId, setLoadingJourneyId] = useState(null);

  // Extract class from username (e.g., 10HPS24 -> 10, 12ABC24 -> 12)
  const extractClassFromUsername = (username) => {
    if (!username) return "";
    const firstTwo = username.substring(0, 2);
    if (!isNaN(firstTwo)) {
      return firstTwo;
    }
    const firstOne = username.charAt(0);
    if (!isNaN(firstOne)) {
      return firstOne;
    }
    return "";
  };

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

  // Fetch classes from API on mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        setIsLoadingData(true);
        const response = await axiosInstance.get(API_ENDPOINTS.CLASSES);
        const classesData = response.data.data || [];
        setClasses(classesData);

        // Set default class based on username
        const defaultClass = extractClassFromUsername(username);
        if (defaultClass) {
          const matchingClass = classesData.find(
            (cls) => cls.class_name.includes(defaultClass) || cls.class_code === defaultClass
          );
          if (matchingClass) {
            setSelectedClass(matchingClass.class_code);
          }
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        showAlert("Failed to load classes. Please refresh the page.", "error");
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchClasses();
  }, [username]);

  // Fetch subjects from API when class changes
  useEffect(() => {
    async function fetchSubjects() {
      if (!selectedClass) {
        setSubjects([]);
        setSelectedSubject("");
        setChapters([]);
        setSelectedChapters([]);
        return;
      }

      try {
        setIsLoadingData(true);
        const response = await axiosInstance.post(API_ENDPOINTS.SUBJECTS, {
          class_id: selectedClass,
        });
        const subjectsData = response.data.data || [];
        setSubjects(subjectsData);

        // Reset dependent fields
        setSelectedSubject("");
        setSelectedChapters([]);
        setChapters([]);

        // Auto-select Math if available
        const mathSubject = subjectsData.find((s) =>
          s.subject_name.toLowerCase().includes("math")
        );
        if (mathSubject) {
          setSelectedSubject(mathSubject.subject_code);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setSubjects([]);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchSubjects();
  }, [selectedClass]);

  // Fetch chapters from API when subject changes
  useEffect(() => {
    async function fetchChapters() {
      if (!selectedSubject || !selectedClass) {
        setChapters([]);
        setSelectedChapters([]);
        return;
      }

      try {
        setIsLoadingData(true);
        const response = await axiosInstance.post(API_ENDPOINTS.CHAPTERS, {
          subject_id: selectedSubject,
          class_id: selectedClass,
        });

        const chaptersData = response.data.data || [];
        setChapters(chaptersData);
        setSelectedChapters([]);
      } catch (error) {
        console.error("Error fetching chapters:", error);
        setChapters([]);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchChapters();
  }, [selectedSubject, selectedClass]);

  // Fetch learning path list on mount
  useEffect(() => {
    async function fetchLearningPathList() {
      try {
        setIsLoadingLearningPath(true);
        const response = await axiosInstance.get(API_ENDPOINTS.LEARNING_PATH_LIST);
        const exams = response.data?.exams || [];
        setLearningPathList(exams);
      } catch (error) {
        console.error("Error fetching learning path list:", error);
      } finally {
        setIsLoadingLearningPath(false);
      }
    }
    fetchLearningPathList();
  }, []);

  // Format date for display
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Calculate score percentage
  const calculateScorePercentage = useCallback((obtained, total) => {
    if (total === 0) return 0;
    return Math.round((obtained / total) * 100);
  }, []);

  // Handle journey item click - fetch next day and navigate to learning path session
  const handleJourneyClick = useCallback(async (exam) => {
    if (!exam.plan_created || !exam.plan_id) {
      showAlert("No learning plan exists for this exam. Complete an exam and generate a learning path first.", "warning");
      return;
    }

    setLoadingJourneyId(exam.exam_id);

    try {
      const formData = new FormData();
      formData.append("plan_id", exam.plan_id);

      const response = await axiosInstance.post(API_ENDPOINTS.LEARNING_PATH_NEXT_DAY, formData);

      if (response.data) {
        navigate("/learning-path-session", {
          state: {
            learningPathData: {
              daily_plans: [{
                day_number: response.data.next_day,
                topic: response.data.topic,
                what_to_study: response.data.what_to_study,
                expected_time: response.data.expected_time,
                checklist: response.data.checklist,
                questions: response.data.questions,
              }],
            },
            planId: response.data.plan_id,
            examId: exam.exam_id,
            class_id: exam.class_code,
            subject_id: exam.subject_code,
            topic_ids: exam.topic_ids,
            currentDay: response.data.next_day,
            nextDayData: response.data,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching learning path next day:", error);
      showAlert(
        error.response?.data?.error || "Failed to load learning path. Please try again.",
        "error"
      );
    } finally {
      setLoadingJourneyId(null);
    }
  }, [navigate, showAlert]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return selectedClass && selectedSubject && selectedChapters.length > 0;
  }, [selectedClass, selectedSubject, selectedChapters]);

  // Transform API response to match expected question format
  const transformApiQuestions = useCallback((apiQuestions) => {
    if (!apiQuestions || !Array.isArray(apiQuestions)) {
      return [];
    }

    return apiQuestions.map((q, index) => ({
      id: q.id,
      question_id: `${String(q.id)}`,
      question: q.question,
      question_level: q.question_level || "Medium",
      question_image: q.question_image || null,
      context: null,
      options: [],
      correct_answer: null,
      marks: q.question_level === "Hard" ? 3 : q.question_level === "Medium" ? 2 : 1,
      topic: q.topic,
      isSubjective: true,
    }));
  }, []);

  // Generate exam questions via API
  const generateExamQuestionsAPI = useCallback(async () => {
    const formData = new FormData();
    formData.append("class_id", selectedClass);
    formData.append("subject_id", selectedSubject);

    selectedChapters.forEach((ch) => {
      formData.append("chapters", ch);
    });

    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.GENERATE_EXAM,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data?.exam_questions) {
        return {
          success: true,
          questions: transformApiQuestions(response.data.exam_questions),
        };
      }

      return {
        success: false,
        error: "Invalid response format from server",
      };
    } catch (error) {
      console.error("Error generating exam questions:", error);
      return {
        success: false,
        error: error.message || "Failed to generate exam questions. Please try again.",
      };
    }
  }, [selectedClass, selectedSubject, selectedChapters, transformApiQuestions]);

  // Get metadata for exam
  const getExamMetadata = useCallback(() => {
    const chapterNames = selectedChapters.map((chapterId) => {
      const chapter = chapters.find((ch) => ch.topic_code === chapterId);
      return chapter ? chapter.name : "Unknown Chapter";
    });

    const subjectName =
      subjects.find((s) => s.subject_code === selectedSubject)?.subject_name || "Unknown Subject";

    const className =
      classes.find((c) => c.class_code === selectedClass)?.class_name || "Unknown Class";

    return {
      classId: selectedClass,
      className,
      subjectId: selectedSubject,
      subjectName,
      chapterIds: selectedChapters,
      chapterNames,
      class_id: selectedClass,
      subject_id: selectedSubject,
      chapters: selectedChapters,
    };
  }, [selectedClass, selectedSubject, selectedChapters, chapters, subjects, classes]);

  // Handle exam start
  const handleStartExam = async () => {
    if (!isFormValid()) {
      showAlert("Please fill in all required fields", "error");
      return;
    }

    setApiError(null);
    setIsLoading(true);

    try {
      const result = await generateExamQuestionsAPI();

      if (!result.success) {
        setApiError(result.error);
        showAlert(result.error, "error");
        return;
      }

      if (!result.questions || result.questions.length === 0) {
        const errorMsg = "No questions available for the selected chapters. Please try different chapters.";
        setApiError(errorMsg);
        showAlert(errorMsg, "error");
        return;
      }

      const metadata = getExamMetadata();

      navigate("/exam-question", {
        state: {
          questions: result.questions,
          examSettings: {
            examDurationMinutes: examDurationMinutes,
            totalDurationSeconds: examDurationMinutes * 60,
          },
          metadata,
          startTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Unexpected error starting exam:", error);
      const errorMsg = "An unexpected error occurred. Please try again.";
      setApiError(errorMsg);
      showAlert(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Select styles for dark mode
  const selectStyles = useMemo(
    () => ({
      control: (provided, state) => ({
        ...provided,
        backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
        borderColor: state.isFocused
          ? isDarkMode ? "#7c3aed" : "#00A0E3"
          : isDarkMode ? "#475569" : "#e2e8f0",
        color: isDarkMode ? "#f1f5f9" : "#0B1120",
        minHeight: "56px",
        border: `2px solid ${
          state.isFocused
            ? isDarkMode ? "#7c3aed" : "#00A0E3"
            : isDarkMode ? "#475569" : "#e2e8f0"
        }`,
        borderRadius: "12px",
        boxShadow: state.isFocused
          ? `0 0 0 4px ${isDarkMode ? "rgba(124, 58, 237, 0.1)" : "rgba(0, 160, 227, 0.1)"}`
          : "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: isDarkMode ? "#6366f1" : "#0080B8",
        },
      }),
      menuPortal: (provided) => ({ ...provided, zIndex: 10000 }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
        zIndex: 10000,
        borderRadius: "12px",
        border: `2px solid ${isDarkMode ? "#7c3aed" : "#00A0E3"}`,
        boxShadow: isDarkMode
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.9)"
          : "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      }),
      menuList: (provided) => ({ ...provided, maxHeight: "300px", padding: "8px" }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused
          ? isDarkMode ? "#7c3aed" : "#00A0E3"
          : state.isSelected
          ? isDarkMode ? "#6366f1" : "#0080B8"
          : isDarkMode ? "#1e293b" : "#ffffff",
        color: state.isFocused || state.isSelected ? "#ffffff" : isDarkMode ? "#f1f5f9" : "#0B1120",
        padding: "12px 16px",
        cursor: "pointer",
        borderRadius: "8px",
        margin: "2px 0",
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: isDarkMode ? "#6366f1" : "#00A0E3",
        borderRadius: "8px",
      }),
      multiValueLabel: (provided) => ({
        ...provided, color: "#ffffff", fontWeight: "600", padding: "4px 8px",
      }),
      multiValueRemove: (provided) => ({
        ...provided, color: "#ffffff",
        "&:hover": { backgroundColor: "#ef4444", color: "#ffffff" },
      }),
      placeholder: (provided) => ({
        ...provided, color: isDarkMode ? "#94a3b8" : "#6b7280",
      }),
      singleValue: (provided) => ({
        ...provided, color: isDarkMode ? "#f1f5f9" : "#0B1120",
      }),
    }),
    [isDarkMode]
  );

  return (
    <>
      <AlertContainer />
      <div className={`min-h-screen ${isDarkMode ? "bg-[#0B1120] text-white" : "bg-[#F8FAFC] text-[#0B1120]"}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
              <ClipboardList size={32} className="text-[#00A0E3]" />
              Create Exam
            </h1>
            <p className={`mt-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Select your class, subject, and chapters to generate an exam
            </p>
          </div>

          {/* Exam Setup Card */}
          <div className={`rounded-2xl shadow-lg p-6 mb-6 ${isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"}`}>
            <form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Class Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <School size={16} className="text-[#00A0E3]" />
                    Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    disabled={isLoadingData && classes.length === 0}
                    className={`w-full h-14 px-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/20 focus:border-[#00A0E3] ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-slate-200 text-[#0B1120]"
                    }`}
                  >
                    <option value="">{isLoadingData && classes.length === 0 ? "Loading..." : "Select Class"}</option>
                    {classes.map((cls) => (
                      <option key={cls.class_code} value={cls.class_code}>{cls.class_name}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <BookOpen size={16} className="text-[#00A0E3]" />
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!selectedClass || (isLoadingData && subjects.length === 0)}
                    className={`w-full h-14 px-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/20 focus:border-[#00A0E3] ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-slate-200 text-[#0B1120]"
                    }`}
                  >
                    <option value="">{isLoadingData && subjects.length === 0 && selectedClass ? "Loading..." : "Select Subject"}</option>
                    {subjects.map((subject) => (
                      <option key={subject.subject_code} value={subject.subject_code}>{subject.subject_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chapter Selection */}
              <div className="mt-6 mx-2">
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <List size={16} className="text-[#00A0E3]" />
                  Chapters (Select Multiple) {chapters.length > 0 && `- ${chapters.length} Available`}
                </label>
                <Select
                  isMulti
                  value={selectedChapters.map((chapterCode) => {
                    const chapter = chapters.find((ch) => ch.topic_code === chapterCode);
                    return chapter ? { value: chapter.topic_code, label: chapter.name } : null;
                  }).filter(Boolean)}
                  onChange={(selectedOptions) => {
                    const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
                    setSelectedChapters(values);
                  }}
                  options={chapters.map((chapter) => ({ value: chapter.topic_code, label: chapter.name }))}
                  placeholder={isLoadingData && chapters.length === 0 && selectedSubject ? "Loading chapters..." : "Select chapters..."}
                  isDisabled={!selectedSubject || (isLoadingData && chapters.length === 0)}
                  isLoading={isLoadingData && chapters.length === 0 && selectedSubject}
                  closeMenuOnSelect={false}
                  isSearchable={true}
                  isClearable={true}
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
                {selectedChapters.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedChapters([])}
                      className={`text-xs px-3 py-1 rounded-md border transition-colors ${
                        isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Clear ({selectedChapters.length})
                    </button>
                  </div>
                )}
              </div>

              {/* Exam Duration Slider */}
              <div className="mt-6 px-3">
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Clock size={16} className="text-[#00A0E3]" />
                  Exam Duration: <strong>{examDurationMinutes} minutes</strong>
                </label>
                <div className="mt-2">
                  <input
                    type="range"
                    value={examDurationMinutes}
                    onChange={(e) => setExamDurationMinutes(parseInt(e.target.value))}
                    min={30}
                    max={60}
                    step={5}
                    className="w-full accent-[#00A0E3]"
                  />
                  <div className="flex justify-between text-xs mt-1 text-slate-400">
                    <span>30 min</span><span>35 min</span><span>40 min</span><span>45 min</span><span>50 min</span><span>55 min</span><span>60 min</span>
                  </div>
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  Slide to select exam duration (30 - 60 minutes)
                </p>
              </div>

              {/* Exam Info Summary */}
              {isFormValid() && (
                <div className={`mt-6 p-4 rounded-xl ${isDarkMode ? "bg-slate-700/50 border border-slate-600" : "bg-[#F8FAFC] border border-slate-200"}`}>
                  <h5 className="flex items-center gap-2 font-semibold mb-3">
                    <FileText size={18} className="text-[#00A0E3]" />
                    Exam Summary
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Total Duration</span>
                      <span className="block font-bold text-lg">{examDurationMinutes} min</span>
                    </div>
                    <div>
                      <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Chapters Selected</span>
                      <span className="block font-bold text-lg">{selectedChapters.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {apiError && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle size={16} />
                  {apiError}
                </div>
              )}

              {/* Start Exam Button */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleStartExam}
                  disabled={!isFormValid() || isLoading}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white bg-[#00A0E3] hover:bg-[#0080B8] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Rocket size={18} />
                      Start Exam
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Previous Learning Journeys Section */}
          <div className={`rounded-2xl shadow-lg p-6 ${isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"}`}>
            <h4 className="flex items-center gap-2 font-bold text-lg mb-4">
              <History size={20} className="text-[#00A0E3]" />
              Previous Learning Journeys
            </h4>

            {isLoadingLearningPath ? (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin text-[#00A0E3] mx-auto" />
                <p className={`mt-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Loading your learning history...</p>
              </div>
            ) : learningPathList.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList size={48} className={`mx-auto mb-3 ${isDarkMode ? "text-slate-600" : "text-slate-300"}`} />
                <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>No previous exams found. Start your first exam above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {learningPathList.map((exam) => {
                  const scorePercentage = calculateScorePercentage(exam.obtained_marks, exam.total_marks);
                  const isItemLoading = loadingJourneyId === exam.exam_id;
                  const hasLearningPath = exam.plan_created && exam.plan_id;
                  return (
                    <div
                      key={exam.exam_id}
                      className={`relative rounded-xl p-4 border-2 transition-all ${
                        hasLearningPath
                          ? `cursor-pointer hover:shadow-md ${isDarkMode ? "border-slate-600 hover:border-[#00A0E3]" : "border-slate-200 hover:border-[#00A0E3]"}`
                          : `opacity-60 ${isDarkMode ? "border-slate-700" : "border-slate-200"}`
                      } ${isDarkMode ? "bg-slate-700/50" : "bg-[#F8FAFC]"} ${isItemLoading ? "opacity-50" : ""}`}
                      onClick={() => !isItemLoading && handleJourneyClick(exam)}
                      role={hasLearningPath ? "button" : undefined}
                      tabIndex={hasLearningPath ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (hasLearningPath && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handleJourneyClick(exam);
                        }
                      }}
                    >
                      {isItemLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl z-10">
                          <Loader2 size={24} className="animate-spin text-[#00A0E3]" />
                          <span className="ml-2 font-medium">Loading learning path...</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold">Exam #{exam.exam_id}</span>
                          <span className={`flex items-center gap-1 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            <Clock size={12} />
                            {formatDate(exam.submitted_at)}
                          </span>
                        </div>
                        <div>
                          {exam.plan_created ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle size={12} />
                              Plan Created
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle size={12} />
                              No Plan
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <span className={`block text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Class</span>
                          <span className="font-semibold">{exam.class_code}</span>
                        </div>
                        <div>
                          <span className={`block text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Subject</span>
                          <span className="font-semibold">{exam.subject_code}</span>
                        </div>
                        <div>
                          <span className={`block text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Questions</span>
                          <span className="font-semibold">{exam.total_questions}</span>
                        </div>
                        <div>
                          <span className={`block text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Score</span>
                          <span className={`font-semibold flex items-center gap-1 ${
                            scorePercentage >= 70 ? "text-green-500" : scorePercentage >= 40 ? "text-amber-500" : "text-red-500"
                          }`}>
                            <Trophy size={14} />
                            {exam.obtained_marks}/{exam.total_marks} ({scorePercentage}%)
                          </span>
                        </div>
                      </div>

                      <div className={`mt-2 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        <span className="font-medium">Topics: </span>
                        {exam.topic_ids.join(", ")}
                      </div>

                      {hasLearningPath && (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            disabled={isItemLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJourneyClick(exam);
                            }}
                          >
                            {isItemLoading ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Play size={14} />
                                Continue Learning
                                <ArrowRight size={14} />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ExamMode;
