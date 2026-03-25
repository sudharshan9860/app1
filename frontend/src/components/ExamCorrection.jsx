// ExamCorrection.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import AlertBox from "./AlertBox";
import {
  FileText,
  FilePlus,
  FileCheck,
  ChevronDown,
  ArrowLeft,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Info,
  Upload,
  Plus,
  X,
  Loader2,
  Rocket,
  Users,
  User,
  Lightbulb,
} from "lucide-react";

const ExamCorrection = () => {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);

  // STEP 1: Correction mode selection
  const [correctionMode, setCorrectionMode] = useState(null);

  const HARDCODED_SUBJECTS = ["MATHEMATICS", "SCIENCE", "PHYSICS", "CHEMISTRY", "ENGLISH"];

  // STEP 2A: For existing correction - exam selection
  const [existingExams, setExistingExams] = useState([]);
  const [selectedExistingExam, setSelectedExistingExam] = useState(null);
  const [loadingExams, setLoadingExams] = useState(false);

  // Upload mode selection
  const [uploadMode, setUploadMode] = useState("individual");

  // Pending section for existing exam
  const [pendingSection, setPendingSection] = useState("");

  // Classes and Sections from API
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);

  // Form state
  const [examName, setExamName] = useState("");
  const [examType, setExamType] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [rollNumberPattern, setRollNumberPattern] = useState(".*");
  const [maxWorkers, setMaxWorkers] = useState(5);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [answerSheets, setAnswerSheets] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Ready to process");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Existing exam names for validation
  const [existingExamNames, setExistingExamNames] = useState([]);

  // Alert
  const [alertMsg, setAlertMsg] = useState("");

  // Teacher info
  const [teacherName, setTeacherName] = useState("");

  // Helper: renames a File object with a "Student_" prefix
  const prefixStudentName = (file) => {
    const prefixedName = `Student_${file.name}`;
    return new File([file], prefixedName, { type: file.type });
  };

  useEffect(() => {
    const fullName = localStorage.getItem("fullName");
    const username = localStorage.getItem("username");
    setTeacherName(fullName || username || "");
    fetchAvailableClasses();
    fetchExistingExamNames();
  }, []);

  useEffect(() => {
    if (className) {
      fetchAvailableSections(className);
    } else {
      setAvailableSections([]);
      if (correctionMode !== "existing") {
        setSection("");
      }
    }
  }, [className, correctionMode]);

  useEffect(() => {
    if (correctionMode === "existing") {
      fetchExistingExams();
    }
  }, [correctionMode]);

  useEffect(() => {
    if (pendingSection && availableSections.length > 0 && !loadingSections) {
      const match = availableSections.find(
        (s) =>
          s.section_name?.trim().toLowerCase() === pendingSection.toLowerCase(),
      );
      if (match) {
        setSection(match.section_name);
      } else {
        setSection(pendingSection);
      }
      setPendingSection("");
    }
  }, [pendingSection, availableSections, loadingSections]);

  useEffect(() => {
    let redirectTimeout;
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await axiosInstance.get("/api/teacher-classes/");
      const classesData = response.data.classes || [];
      setAvailableClasses(classesData);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchAvailableSections = async (selectedClass) => {
    try {
      setLoadingSections(true);
      if (correctionMode !== "existing") {
        setSection("");
      }
      const formData = new FormData();
      formData.append("class_name", selectedClass);

      const response = await axiosInstance.post(
        "/api/teacher-sections/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const sectionsData = response.data.sections || [];
      setAvailableSections(sectionsData);
    } catch (error) {
      console.error("Error fetching sections:", error);
    } finally {
      setLoadingSections(false);
    }
  };

  const fetchExistingExamNames = async () => {
    try {
      const response = await axiosInstance.get("/api/teacher-exam-names/");
      const names = response.data || [];
      setExistingExamNames(names.map((name) => name.toLowerCase().trim()));
    } catch (error) {
      console.error("Error fetching exam names:", error);
    }
  };

  const isExamNameDuplicate =
    correctionMode === "new" &&
    examName.trim() !== "" &&
    existingExamNames.includes(examName.trim().toLowerCase());

  const fetchExistingExams = async () => {
    try {
      setLoadingExams(true);
      setError(null);
      const response = await axiosInstance.get("/exam-details/");
      const examsData = response.data.exams || [];
      setExistingExams(examsData);
      if (examsData.length === 0) {
        setError("No existing exams found. Please create a new exam instead.");
      }
    } catch (error) {
      console.error("Error fetching existing exams:", error);
      setError("Failed to fetch existing exams. Please try again.");
    } finally {
      setLoadingExams(false);
    }
  };

  const handleExistingExamSelect = (exam) => {
    setSelectedExistingExam(exam);
    setExamName(exam.name);
    setExamType(exam.exam_type);
    const parsedClass = exam.class_section || "";
    const parsedSection = exam.section || "";
    setClassName(parsedClass);
    setPendingSection(parsedSection);
    setSubject(exam.subject || "");
    setError(null);
  };

  const handleQuestionPaperChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Question paper must be a PDF file");
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        setError("Question paper file size must be less than 100MB");
        return;
      }
      setQuestionPaper(file);
      setError(null);
    }
  };

  const handleAnswerSheetsChange = (e) => {
    const files = Array.from(e.target.files);
    const invalidFiles = files.filter((file) => {
      return file.type !== "application/pdf" || file.size > 100 * 1024 * 1024;
    });

    if (invalidFiles.length > 0) {
      setError("All answer sheets must be PDF files under 100MB each");
      return;
    }

    setAnswerSheets((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const newFiles = files
        .map((f) => prefixStudentName(f))
        .filter((f) => !existingNames.has(f.name));
      return [...prev, ...newFiles];
    });
    setError(null);
    e.target.value = "";
  };

  const handleRemoveQuestionPaper = () => {
    setQuestionPaper(null);
  };

  const handleRemoveAnswerSheet = (index) => {
    setAnswerSheets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllAnswerSheets = () => {
    setAnswerSheets([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!examName.trim()) {
      setError("Please enter exam name");
      return;
    }
    if (uploadMode === "individual" && !subject) {
      setError("Please select a subject");
      return;
    }
    if (!className.trim()) {
      setError("Please enter class name");
      return;
    }
    if (correctionMode === "new" && !questionPaper) {
      setError("Please upload question paper");
      return;
    }
    if (answerSheets.length === 0) {
      setError("Please upload at least one answer sheet");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setProcessingStatus("Uploading files...");
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("exam_name", examName.trim());
      formData.append("exam_type", examType);
      formData.append("teacher_name", teacherName);
      formData.append("class_name", className.trim());
      formData.append("section", section.trim());
      formData.append("subject", subject);
      formData.append("roll_number_pattern", rollNumberPattern);
      formData.append("max_workers", maxWorkers.toString());
      formData.append("upload_mode", uploadMode);

      if (correctionMode === "existing" && selectedExistingExam) {
        formData.append("exam_id", selectedExistingExam.id.toString());
        formData.append("is_additional_correction", "true");
      }

      if (questionPaper) {
        formData.append("question_paper", questionPaper);
      }

      answerSheets.forEach((sheet) => {
        formData.append("answer_sheets", sheet);
      });

      const apiEndpoint =
        uploadMode === "group"
          ? "api/exam-correction-group/"
          : "api/exam-correction/";

      const response = await axiosInstance.post(apiEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      });

      setSuccess(true);
      setAlertMsg(
        correctionMode === "existing"
          ? "Additional students uploaded successfully! Processing in background..."
          : "Exam uploaded successfully! Processing in background...",
      );

      if (correctionMode === "existing") {
        setProcessingStatus("Adding additional students to existing exam...");
      } else {
        setProcessingStatus("Processing exam in background...");
      }

      setExamName("");
      setExamType("");
      setClassName("");
      setSection("");
      setRollNumberPattern(".*");
      setMaxWorkers(5);
      setQuestionPaper(null);
      setAnswerSheets([]);
      setUploadMode("individual");
    } catch (error) {
      console.error("Error submitting exam correction:", error);
      setError(
        error.response?.data?.detail ||
          error.message ||
          "Failed to submit exam correction. Please try again.",
      );
      setProcessingStatus("Ready to process");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    setExamName("");
    setExamType("");
    setClassName("");
    setSection("");
    setSubject("");
    setRollNumberPattern(".*");
    setMaxWorkers(5);
    setQuestionPaper(null);
    setAnswerSheets([]);
    setError(null);
    setSuccess(false);
    setProcessingStatus("Ready to process");
    setSelectedExistingExam(null);
    setUploadMode("individual");
    setPendingSection("");
  };

  const handleBackToModeSelection = () => {
    setCorrectionMode(null);
    handleReset();
  };

  const renderAlert = () =>
    alertMsg ? (
      <div className="fixed top-4 right-4 z-50">
        <AlertBox
          message={alertMsg}
          type="success"
          onClose={() => setAlertMsg("")}
          duration={5000}
        />
      </div>
    ) : null;

  // ==========================================
  // STEP 1: MODE SELECTION VIEW
  // ==========================================
  if (correctionMode === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-10">
        {renderAlert()}
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-[#00A0E3]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0B1120]">Exam Correction Hub</h1>
              <p className="text-sm text-gray-500">Choose correction mode to get started</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#00A0E3] text-[#00A0E3] hover:bg-blue-50 text-sm font-medium transition-colors"
            onClick={() => {
              if (window.handleExamAnalyticsView) {
                window.handleExamAnalyticsView();
              }
            }}
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-8">
          {/* Mode Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* NEW CORRECTION CARD */}
            <button
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-left hover:border-[#00A0E3] hover:shadow-md transition-all group"
              onClick={() => setCorrectionMode("new")}
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-[#00A0E3]/10 transition-colors">
                <FilePlus className="w-8 h-8 text-[#00A0E3]" />
              </div>
              <h2 className="text-xl font-bold text-[#0B1120] mb-2">New Correction</h2>
              <p className="text-sm text-gray-500 mb-4">
                Start a brand new exam correction with question paper and answer sheets
              </p>
              <ul className="space-y-2 mb-5">
                {["Upload new question paper", "Upload all student answer sheets", "Create new exam entry", "Full automated grading"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                    {item}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-1 text-[#00A0E3] font-medium text-sm">
                Select New Correction
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </span>
            </button>

            {/* EXISTING CORRECTION CARD */}
            <button
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-left hover:border-[#00A0E3] hover:shadow-md transition-all group"
              onClick={() => setCorrectionMode("existing")}
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-[#00A0E3]/10 transition-colors">
                <FileCheck className="w-8 h-8 text-[#00A0E3]" />
              </div>
              <h2 className="text-xl font-bold text-[#0B1120] mb-2">Add to Existing Exam</h2>
              <p className="text-sm text-gray-500 mb-4">
                Add more students to an existing exam (batch processing)
              </p>
              <ul className="space-y-2 mb-5">
                {["Select existing exam", "Reuse question paper (optional)", "Upload additional answer sheets", "Merge with existing results"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                    {item}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-1 text-[#00A0E3] font-medium text-sm">
                Select Existing Exam
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </span>
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="flex items-center gap-2 text-base font-bold text-[#0B1120] mb-4">
              <Lightbulb className="w-5 h-5 text-[#00A0E3]" />
              When to use each mode?
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <strong className="text-sm text-[#0B1120]">New Correction:</strong>
                <p className="text-sm text-gray-600 mt-1">
                  Use when starting a completely new exam with all students at once
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <strong className="text-sm text-[#0B1120]">Existing Exam:</strong>
                <p className="text-sm text-gray-600 mt-1">
                  Use when you want to add more students to an already created exam (e.g., 20 students now + 20 later)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP 2A: EXISTING EXAM SELECTION VIEW
  // ==========================================
  if (correctionMode === "existing" && !selectedExistingExam) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-10">
        {renderAlert()}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#00A0E3] transition-colors"
              onClick={handleBackToModeSelection}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#0B1120]">Select Existing Exam</h1>
              <p className="text-sm text-gray-500">Choose an exam to add more students</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#00A0E3] text-[#00A0E3] hover:bg-blue-50 text-sm font-medium transition-colors"
            onClick={() => {
              if (window.handleExamAnalyticsView) {
                window.handleExamAnalyticsView();
              }
            }}
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-xl p-4 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loadingExams ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#00A0E3] animate-spin mb-3" />
              <p className="text-gray-500">Loading existing exams...</p>
            </div>
          ) : existingExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-bold text-[#0B1120] mb-1">No Existing Exams Found</h3>
              <p className="text-sm text-gray-500 mb-4">
                You don't have any exams yet. Please create a new exam instead.
              </p>
              <button
                className="px-4 py-2 rounded-lg bg-[#00A0E3] hover:bg-[#0080B8] text-white font-medium text-sm transition-colors"
                onClick={handleBackToModeSelection}
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingExams.map((exam) => (
                <button
                  key={exam.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:border-[#00A0E3] hover:shadow-md transition-all"
                  onClick={() => handleExistingExamSelect(exam)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#0B1120] truncate">{exam.name}</h3>
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#00A0E3] text-xs font-medium flex-shrink-0">
                      {exam.exam_type}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Class:</span>
                      <span className="text-[#0B1120] font-medium">{exam.class_section}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Students:</span>
                      <span className="text-[#0B1120] font-medium">{exam.total_students}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Score:</span>
                      <span className="text-[#0B1120] font-medium">
                        {exam.average_score ? `${exam.average_score.toFixed(1)}%` : "N/A"}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[#00A0E3] font-medium text-sm">
                    Select This Exam
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP 2B/3: UPLOAD FORM VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      {renderAlert()}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#00A0E3] transition-colors"
            onClick={() => {
              if (correctionMode === "existing") {
                setSelectedExistingExam(null);
              } else {
                handleBackToModeSelection();
              }
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-[#00A0E3]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B1120]">
              {correctionMode === "existing"
                ? `Add Students to: ${examName}`
                : "New Exam Correction"}
            </h1>
            <p className="text-sm text-gray-500">
              {correctionMode === "existing"
                ? "Upload additional answer sheets for this exam"
                : "Upload question papers and answer sheets for automated grading"}
            </p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#00A0E3] text-[#00A0E3] hover:bg-blue-50 text-sm font-medium transition-colors"
          onClick={() => {
            if (window.handleExamAnalyticsView) {
              window.handleExamAnalyticsView();
            }
          }}
        >
          <BarChart3 className="w-4 h-4" />
          View Analytics
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-xl p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-[#22c55e] text-sm rounded-xl p-4">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                {correctionMode === "existing"
                  ? "Additional students uploaded successfully!"
                  : "Exam submitted successfully!"}{" "}
                Processing in background...
              </span>
            </div>
          )}

          {/* Mode Indicator */}
          {correctionMode === "existing" && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-[#00A0E3] text-sm rounded-xl p-4">
              <Info className="w-5 h-5 flex-shrink-0" />
              <span>
                You're adding students to an existing exam. Current students:{" "}
                {selectedExistingExam?.total_students || 0}
              </span>
            </div>
          )}

          {/* Upload Mode Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#0B1120] mb-4">
              <Upload className="w-4 h-4 text-[#00A0E3]" />
              Upload Mode
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  uploadMode === "group"
                    ? "border-[#00A0E3] bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="uploadMode"
                  value="group"
                  checked={uploadMode === "group"}
                  onChange={(e) => {
                    setUploadMode(e.target.value);
                    if (e.target.value === "group") setSubject("");
                  }}
                  disabled={loading}
                  className="hidden"
                />
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${uploadMode === "group" ? "bg-[#00A0E3] text-white" : "bg-gray-100 text-gray-400"}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-[#0B1120]">Group of Students</span>
                  <span className="block text-xs text-gray-500">Multiple students per PDF (batch upload)</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  uploadMode === "individual"
                    ? "border-[#00A0E3] bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="uploadMode"
                  value="individual"
                  checked={uploadMode === "individual"}
                  onChange={(e) => {
                    setUploadMode(e.target.value);
                    if (e.target.value === "group") setSubject("");
                  }}
                  disabled={loading}
                  className="hidden"
                />
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${uploadMode === "individual" ? "bg-[#00A0E3] text-white" : "bg-gray-100 text-gray-400"}`}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-[#0B1120]">Individual Student</span>
                  <span className="block text-xs text-gray-500">One student per PDF (standard upload)</span>
                </div>
              </label>
            </div>
          </div>

          {/* Exam Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-[#0B1120] mb-5">Exam Details</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="examName" className="block text-sm font-medium text-[#0B1120] mb-1.5">
                  Exam Name <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  id="examName"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/20 focus:border-[#00A0E3] disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="e.g., Mathematics Midterm Exam"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  disabled={loading || correctionMode === "existing"}
                />
                {correctionMode === "existing" && (
                  <p className="text-xs text-gray-400 mt-1">Pre-filled from existing exam</p>
                )}
                {isExamNameDuplicate && (
                  <p className="text-xs text-[#ef4444] font-medium mt-1">
                    This exam name already exists. Please use a different name.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="examType" className="block text-sm font-medium text-[#0B1120] mb-1.5">
                  Exam Type <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  id="examType"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/20 focus:border-[#00A0E3] disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="e.g., Midterm, Final, Unit Test"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  disabled={loading || correctionMode === "existing" || isExamNameDuplicate}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="className" className="block text-sm font-medium text-[#0B1120] mb-1.5">
                  Class <span className="text-[#ef4444]">*</span>
                </label>
                <div className="relative">
                  <select
                    id="className"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/20 focus:border-[#00A0E3] appearance-none disabled:bg-gray-50 disabled:text-gray-400"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    disabled={loading || loadingClasses || correctionMode === "existing"}
                  >
                    <option value="">
                      {loadingClasses ? "Loading classes..." : "Select Class"}
                    </option>
                    {availableClasses.map((cls, index) => (
                      <option key={cls.class_name || index} value={cls.class_name}>
                        Class {cls.class_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {correctionMode === "existing" && (
                  <p className="text-xs text-gray-400 mt-1">Pre-filled from existing exam</p>
                )}
              </div>

              <div>
                <label htmlFor="section" className="block text-sm font-medium text-[#0B1120] mb-1.5">
                  Section <span className="text-[#ef4444]">*</span>
                </label>
                <div className="relative">
                  <select
                    id="section"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/20 focus:border-[#00A0E3] appearance-none disabled:bg-gray-50 disabled:text-gray-400"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    disabled={loading || loadingSections || !className || correctionMode === "existing"}
                  >
                    <option value="">
                      {!className
                        ? "Select class first"
                        : loadingSections
                          ? "Loading sections..."
                          : "Select Section"}
                    </option>
                    {availableSections.map((sec, index) => (
                      <option key={sec.section_name || index} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {correctionMode === "existing" && (
                  <p className="text-xs text-gray-400 mt-1">Pre-filled from existing exam</p>
                )}
              </div>

              {/* Subject Dropdown - Only for Individual mode */}
              {uploadMode === "individual" && (
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[#0B1120] mb-1.5">
                    Subject <span className="text-[#ef4444]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="subject"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/20 focus:border-[#00A0E3] appearance-none disabled:bg-gray-50 disabled:text-gray-400"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={loading || correctionMode === "existing"}
                    >
                      <option value="">Select Subject</option>
                      {HARDCODED_SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {correctionMode === "existing" && (
                    <p className="text-xs text-gray-400 mt-1">Pre-filled from existing exam</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#0B1120] mb-5">
              <FileText className="w-4 h-4 text-[#00A0E3]" />
              Upload Files
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Question Paper Upload */}
              <div>
                <label className="block text-sm font-medium text-[#0B1120] mb-2">
                  Question Paper
                  {correctionMode === "new" && <span className="text-[#ef4444] ml-1">*</span>}
                  {correctionMode === "existing" && <span className="text-gray-400 text-xs ml-2">(Optional)</span>}
                </label>

                {!questionPaper ? (
                  <label
                    htmlFor="questionPaperInput"
                    className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#00A0E3] hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#00A0E3]" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#0B1120]">Choose PDF</span>
                      <span className="block text-xs text-gray-400">Max 100MB</span>
                    </div>
                    <input
                      type="file"
                      id="questionPaperInput"
                      accept=".pdf"
                      onChange={handleQuestionPaperChange}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-gray-200 rounded-xl">
                    <FileText className="w-5 h-5 text-[#00A0E3] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0B1120] truncate">{questionPaper.name}</p>
                      <p className="text-xs text-gray-400">
                        {(questionPaper.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-red-50 text-[#ef4444] flex items-center justify-center hover:bg-red-100 transition-colors"
                      onClick={handleRemoveQuestionPaper}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Answer Sheets Upload */}
              <div>
                <label className="block text-sm font-medium text-[#0B1120] mb-2">
                  Answer Sheets <span className="text-[#ef4444]">*</span>
                  {answerSheets.length > 0 && (
                    <span className="text-[#00A0E3] text-xs ml-2">({answerSheets.length} files)</span>
                  )}
                </label>

                {answerSheets.length === 0 && (
                  <label
                    htmlFor="answerSheetsInput"
                    className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#00A0E3] hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#00A0E3]" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#0B1120]">
                        {uploadMode === "group" ? "Choose PDFs (Batch)" : "Choose PDFs"}
                      </span>
                      <span className="block text-xs text-gray-400">
                        {uploadMode === "group" ? "Multiple students per file" : "One per student"} - Select multiple
                      </span>
                    </div>
                    <input
                      type="file"
                      id="answerSheetsInput"
                      accept=".pdf"
                      multiple
                      onChange={handleAnswerSheetsChange}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                )}

                {answerSheets.length > 0 && (
                  <div className="space-y-2">
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {answerSheets.map((sheet, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg">
                          <FileText className="w-4 h-4 text-[#00A0E3] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#0B1120] truncate">{sheet.name}</p>
                            <p className="text-xs text-gray-400">
                              {(sheet.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            className="w-6 h-6 rounded-full bg-red-50 text-[#ef4444] flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                            onClick={() => handleRemoveAnswerSheet(index)}
                            disabled={loading}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="answerSheetsInputMore"
                        className="flex items-center gap-1 text-sm text-[#00A0E3] font-medium cursor-pointer hover:text-[#0080B8]"
                      >
                        <Plus className="w-4 h-4" />
                        Add More PDFs
                        <input
                          type="file"
                          id="answerSheetsInputMore"
                          accept=".pdf"
                          multiple
                          onChange={handleAnswerSheetsChange}
                          disabled={loading}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        className="text-sm text-[#ef4444] hover:text-red-600"
                        onClick={handleClearAllAnswerSheets}
                        disabled={loading}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#0B1120] font-medium">Uploading...</span>
                <span className="text-[#00A0E3] font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-[#00A0E3] transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submission Summary */}
          {correctionMode === "existing" &&
            selectedExistingExam &&
            answerSheets.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-[#0B1120] mb-3">Submission Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <span className="block text-xs text-gray-500 mb-1">Existing Students</span>
                  <span className="text-lg font-bold text-[#0B1120]">{selectedExistingExam.total_students}</span>
                </div>
                <div className="text-center">
                  <span className="block text-xs text-gray-500 mb-1">New Students</span>
                  <span className="text-lg font-bold text-[#00A0E3]">{answerSheets.length}</span>
                </div>
                <div className="text-center">
                  <span className="block text-xs text-gray-500 mb-1">Total After Upload</span>
                  <span className="text-lg font-bold text-[#22c55e]">
                    {selectedExistingExam.total_students + answerSheets.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors"
              onClick={handleReset}
              disabled={loading}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#00A0E3] hover:bg-[#0080B8] text-white font-medium text-sm transition-colors disabled:opacity-50"
              disabled={loading || answerSheets.length === 0 || isExamNameDuplicate}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  {correctionMode === "existing" ? "Add Students" : "Start Correction"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamCorrection;
