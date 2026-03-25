// src/components/ChatBox.jsx
import React, {
  useEffect,
  useContext,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import defaultGif from "../assets/1080x1080.gif";
import neloGif from "../assets/nelo_dog.gif";
import { motion } from "framer-motion";
import {
  faCommentDots,
  faPaperPlane,
  faTimes,
  faUpload,
  faTrash,
  faLanguage,
  faMicrophone,
  faStop,
  faChartLine,
  faExclamationTriangle,
  faBook,
  faGraduationCap,
  faRobot,
  faLightbulb,
  faCheckCircle,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import "katex/dist/katex.min.css";

import axios from "axios";
import MarkdownWithMath from "./MarkdownWithMath";
import "./ChatBox.css";
import { useAlert } from "./AlertBox";
import { AuthContext } from "./AuthContext";
import axiosInstance from "../api/axiosInstance";

import { useCurrentQuestion } from "../contexts/CurrentQuestionContext";
import { useTutorial } from "../contexts/TutorialContext";
import { ChatContext } from "../contexts/ChatContext";
import { getImageSrc } from "../utils/imageUtils";
import { useGetStudentResultsQuery } from "../store/api/studentResultsApi";
// import { useMascot } from "../contexts/MascotContext";

const chatbotGif = window.location.hostname === "mynelo.in" ? neloGif : defaultGif;

// ====== API BASE ======
const API_URL = "https://chatbot.smartlearners.ai";

// Axios client (no login cookies; pure session-based)
const api = axios.create({
  baseURL: API_URL,
  timeout: 300000,
});

// ====== Helpers for formatting ======
const formatMessage = (text) => {
  if (!text) return null;
  if (Array.isArray(text)) {
    return (
      <div className="paragraph-solution">
        {text.map((p, i) => (
          <p key={i} className="solution-paragraph">
            <MarkdownWithMath content={p} />
          </p>
        ))}
      </div>
    );
  }
  return <MarkdownWithMath content={text} />;
};

// ====== Video List Component ======
const VideoListComponent = ({ videos }) => {
  if (!videos || videos.length === 0) return null;

  const openYouTubeVideo = (url) => {
    try {
      // For web app, simply open the YouTube URL directly in a new tab
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening video:", error);
      // Fallback: try opening without the third parameter
      window.open(url, "_blank");
    }
  };

  return (
    <div className="chat-video-list-container">
      {videos.map((videoGroup, groupIndex) => (
        <div key={groupIndex} className="video-group">
          {videoGroup.concept_name && (
            <h6 className="video-concept-title">{videoGroup.concept_name}</h6>
          )}

          {videoGroup.videos &&
            videoGroup.videos.map((video, videoIndex) => (
              <div
                key={`${groupIndex}-${videoIndex}`}
                className="video-card"
                onClick={() => openYouTubeVideo(video.url)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    openYouTubeVideo(video.url);
                  }
                }}
              >
                <div className="video-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#FF0000"
                    width="32"
                    height="32"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>

                <div className="video-info">
                  <div className="video-title">{video.title}</div>

                  <div className="video-meta">
                    {video.channel && (
                      <span className="video-meta-item">
                        📺 {video.channel}
                      </span>
                    )}
                    {video.duration && (
                      <span className="video-meta-item">
                        ⏱️ {video.duration}
                      </span>
                    )}
                    {video.views && (
                      <span className="video-meta-item">👁️ {video.views}</span>
                    )}
                  </div>
                </div>

                <div className="video-arrow">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    style={{ opacity: 0.6 }}
                  />
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};

// ====== Main Component ======
const ChatBox = forwardRef((props, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useContext(AuthContext);
  const { showAlert, AlertContainer } = useAlert();
  const className = localStorage.getItem("className");
  const userRole = localStorage.getItem("userRole");
  const { currentQuestion, questionMetadata } = useCurrentQuestion();
  const { resetTutorial, startTutorialForPage } = useTutorial();
  const { pendingAnalysis, clearPendingAnalysis } = useContext(ChatContext);
  // const { setTeaching, setThinking, setHappy } = useMascot();
  const includeQuestionContext = (() => {
    const stored = localStorage.getItem("include_question_context");
    return stored === null ? true : stored === "true";
  })();

  // Check if we're on the SolveQuestion page
  const isOnSolveQuestionPage = location.pathname === "/solvequestion";

  const [isOpen, setIsOpen] = useState(false);
  const toggleChat = () => setIsOpen((o) => !o);

  // Session + connection
  const [sessionId, setSessionId] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("checking");

  // Ref to track latest sessionId for async polling (avoids stale closure)
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Chat - Different initial message based on user role
  const getInitialMessage = () => {
    if (userRole === "teacher") {
      return {
        id: "hello",
        text: "👋 Hi! I'm your Teaching Assistant. You can analyze student performance, check exam results, or get class insights.",
        sender: "ai",
        timestamp: new Date(),
      };
    }
    return {
      id: "hello",
      text: "👋 Hi! I'm your Math Assistant. Ask a doubt or upload a problem image.",
      sender: "ai",
      timestamp: new Date(),
    };
  };

  const [messages, setMessages] = useState([getInitialMessage()]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState("en");

  // Files / image
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Image action modal (Solve / Correct)
  const [showImageModal, setShowImageModal] = useState(false);

  // AI-Correct image upload modal (supports multiple images)
  const [showCorrectImageModal, setShowCorrectImageModal] = useState(false);
  const [correctImageFiles, setCorrectImageFiles] = useState([]);
  const [correctImagePreviews, setCorrectImagePreviews] = useState([]);
  const correctFileInputRef = useRef(null);

  // Refs
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);

  const [inputText, setInputText] = useState("");

  // Exam dropdown state
  const [selectedExam, setSelectedExam] = useState("");
  const [showExamDropdown, setShowExamDropdown] = useState(false);

  // Remedial duration dropdown state
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const durationOptions = [
    { label: "1 Hour", value: "1 hour" },
    { label: "2 Hours", value: "2 hours" },
    { label: "5 Hours", value: "5 hours" },
    { label: "1 Day", value: "1 day" },
    { label: "3 Days", value: "3 days" },
    { label: "7 Days", value: "7 days" },
  ];
  const { data: studentResults, isLoading: isLoadingExams } =
    useGetStudentResultsQuery(undefined, {
      skip: userRole !== "student",
    });
  const examNames = (() => {
    if (!studentResults) return [];
    const results = studentResults.results || studentResults;
    if (Array.isArray(results))
      return results.map((r) => r.exam_name).filter(Boolean);
    return [];
  })();

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Listen for dark mode changes
  useEffect(() => {
    const handleDarkModeChange = (e) => {
      setIsDarkMode(e.detail.isDarkMode);
    };

    window.addEventListener("darkModeChange", handleDarkModeChange);
    return () => {
      window.removeEventListener("darkModeChange", handleDarkModeChange);
    };
  }, []);

  // ====== Suggestion Questions ======
  // Different suggestions based on whether we're on SolveQuestion page
  const getSuggestionQuestions = () => {
    if (isOnSolveQuestionPage && currentQuestion) {
      return [
        {
          text: "AI-Solution",
          icon: faRobot,
          isTutorial: false,
          isApiAction: true,
          apiFlag: "solve",
        },
        {
          text: "Concepts-Required and videos",
          icon: faLightbulb,
          isTutorial: false,
          isApiAction: true,
          apiFlag: "explain",
        },
        {
          text: "AI-Correct",
          icon: faWandMagicSparkles,
          isTutorial: false,
          isApiAction: true,
          apiFlag: "correct",
        },
        {
          text: "Start Tutorial Walkthrough",
          icon: faGraduationCap,
          isTutorial: true,
          isApiAction: false,
        },
      ];
    }

    // Teacher-specific suggestions
    if (userRole === "teacher") {
      return [
        {
          text: "Show class performance overview",
          icon: faChartLine,
          isTutorial: false,
          isApiAction: false,
        },

        {
          text: "Give me exam-wise analysis in tabular format",
          icon: faLightbulb,
          isTutorial: false,
          isApiAction: false,
        },
      ];
    }

    // Student suggestions (default)
    return [
      {
        text: "What is my progress?",
        icon: faChartLine,
        isTutorial: false,
        isApiAction: false,
      },
      {
        text: "Give me question-wise analysis of exam",
        icon: faLightbulb,
        isTutorial: false,
        isApiAction: false,
        isExamDropdown: true,
      },
      {
        text: "What are my weaknesses?",
        icon: faExclamationTriangle,
        isTutorial: false,
        isApiAction: false,
      },
      {
        text: "Give remedial program as per my weaknesses",
        icon: faBook,
        isTutorial: false,
        isApiAction: false,
        isDurationDropdown: true,
      },
      {
        text: "Start Tutorial Walkthrough",
        icon: faGraduationCap,
        isTutorial: true,
        isApiAction: false,
      },
    ];
  };

  const suggestionQuestions = getSuggestionQuestions();

  // ====== Effects ======
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initial session creation - wait for username
  useEffect(() => {
    if (hasInitialized.current) return;
    if (!username) return; // Wait for username to be available

    hasInitialized.current = true;
    fetchStudentDataAndCreateSession();
  }, [username]);

  // ====== Auto-analysis from ChatContext ======
  const analysisProcessingRef = useRef(false);
  useEffect(() => {
    if (!pendingAnalysis || analysisProcessingRef.current) return;
    analysisProcessingRef.current = true;

    const processAnalysis = async () => {
      try {
        // Auto-open the chatbox
        setIsOpen(true);

        // Wait for session to be ready (poll up to 10s using ref to avoid stale closure)
        let waited = 0;
        while (!sessionIdRef.current && waited < 10000) {
          await new Promise((r) => setTimeout(r, 500));
          waited += 500;
        }
        const currentSessionId = sessionIdRef.current;

        // Add display message (hide raw prompt from UI)
        const displayId = Date.now();
        setMessages((prev) => [
          ...prev,
          {
            id: displayId,
            text:
              pendingAnalysis.displayText || "Evaluating your performance...",
            sender: "user",
            isAnalysisRequest: true,
            timestamp: new Date(),
          },
        ]);
        setIsTyping(true);

        // Guard: if prompt is empty or signals all-correct, skip API call
        const prompt = pendingAnalysis.prompt || "";
        if (!prompt || prompt === JSON.stringify({ questions: [] })) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: "🎉 **Perfect score!** You answered all questions correctly. Great work!",
              sender: "ai",
              timestamp: new Date(),
            },
          ]);
          setIsTyping(false);
          clearPendingAnalysis();
          analysisProcessingRef.current = false;
          return;
        }

        // // Send the full prompt to /test-prep-analysis endpoint
        // if (!prompt || prompt === JSON.stringify({ questions: [] })) {
        //   setMessages((prev) => [
        //     ...prev,
        //     {
        //       id: Date.now(),
        //       text: "🎉 **Perfect score!** You answered all questions correctly. Great work!",
        //       sender: "ai",
        //       timestamp: new Date(),
        //     },
        //   ]);
        //   setIsTyping(false);
        //   clearPendingAnalysis();
        //   analysisProcessingRef.current = false;
        //   return;
        // }

        // If session never became available, show fallback
        if (!currentSessionId) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: "⚠️ Could not connect to AI analysis. Please try again.",
              sender: "ai",
              timestamp: new Date(),
            },
          ]);
          setIsTyping(false);
          clearPendingAnalysis();
          analysisProcessingRef.current = false;
          return;
        }

        const res = await api.post(
          "/test-prep-analysis",
          {
            session_id: currentSessionId,
            query: prompt,
            language: "en",
          },
          {
            headers: { session_token: currentSessionId },
          },
        );

        const rawReply = res?.data?.response || res?.data?.reply || "";

        let reply;
        try {
          const parsed = JSON.parse(rawReply);
          const questionCards = parsed?.questions || [];

          if (questionCards.length === 0) {
            reply =
              "🎉 **Perfect score!** You answered all questions correctly. Great work!";
          } else {
            reply = questionCards
              .map((card) => {
                const cc = card.conceptCard || {};
                const mcq1 = card.mcq1 || {};
                const mcq2 = card.mcq2 || {};

                const mcqBlock = (mcq, label) => {
                  if (!mcq.question) return "";
                  const opts = (mcq.options || [])
                    .map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`)
                    .join("  \n");
                  return `**${label}:** ${mcq.question}\n${opts}\n*Correct: ${mcq.correct}*`;
                };

                return [
                  `### ${card.questionId}: ${cc.title || ""}`,
                  `**Concept:** ${cc.concept || ""}`,
                  `**Where You Went Wrong:** ${cc.whereYouWentWrong || ""}`,
                  "",
                  mcqBlock(mcq1, "Practice Q1"),
                  mcqBlock(mcq2, "Practice Q2"),
                ]
                  .filter(Boolean)
                  .join("\n\n");
              })
              .join("\n\n---\n\n");
          }
        } catch {
          reply = rawReply || "Analysis complete.";
        }
        setMessages((prev) => [
          ...prev,
          {
            id: displayId + 1,
            text: reply,
            sender: "ai",
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        console.error("Auto-analysis error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: "Sorry, I couldn't generate the analysis right now. Please try again.",
            sender: "ai",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
        clearPendingAnalysis();
        analysisProcessingRef.current = false;
      }
    };

    processAnalysis();
  }, [pendingAnalysis, sessionId, clearPendingAnalysis]);

  // ====== Session handling ======
  const fetchStudentData = async () => {
    try {
      // console.log("Fetching student data for:", username)
      const response = await axiosInstance.post("dummy/", {
        homework: "true",
        agentic_data: "true",
      });

      // console.log("✅ Student Data Response:", response.data)

      if (response.data && response.data[username]) {
        // console.log("📦 Student data found for", username)
        return response.data[username];
      } else {
        console.warn("⚠ No student data found for", username);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching student data:", error);
      return null;
    }
  };

  const fetchExamData = async () => {
    try {
      // console.log("Fetching student data for:", username)
      const response = await axiosInstance.get("questions-evaluated/");

      // console.log("✅ Student Data Response:", response.data)

      if (response.data) {
        console.log("📦 Student data found for", username);
        return response.data;
      } else {
        console.warn("⚠ No student data found for", username);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching student data:", error);
      return null;
    }
  };

  const fetchSelfData = async () => {
    try {
      // console.log("Fetching student data for:", username)
      const response = await axiosInstance.get("list-submissions/");

      // console.log("✅ Student Data Response:", response.data)

      if (response.data) {
        console.log("📦 Student self data found for", username);
        return response.data;
      } else {
        console.warn("⚠ No student self data found for", username);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching student self data:", error);
      return null;
    }
  };

  // Fetch exam details for teachers
  const fetchTeacherExamDetails = async () => {
    try {
      console.log("📚 Fetching exam details for teacher...");
      const response = await axiosInstance.get("exam-details/");

      if (response.data) {
        console.log("📦 Exam details fetched successfully:", response.data);
        return response.data;
      } else {
        console.warn("⚠ No exam details found");
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching exam details:", error);
      return null;
    }
  };

  const fetchStudentDataAndCreateSession = async () => {
    setConnectionStatus("checking");
    // console.log("Fetching student data and creating session for:", username)

    try {
      // For teachers, fetch exam details instead of student-specific data
      if (userRole === "teacher") {
        const teacherExamDetails = await fetchTeacherExamDetails();
        console.log("📚 Teacher exam details:", teacherExamDetails);
        await createSessionWithData(null, null, null, teacherExamDetails);
        return;
      }

      // For students, fetch student-specific data
      const data = await fetchStudentData();
      const examdata = await fetchExamData();
      const selfdata = await fetchSelfData();
      // console.log("Fetched exam data:", examdata)

      let filteredData = null;
      if (data) {
        filteredData = data;
        setStudentInfo(filteredData);
        // console.log("✅ Student data fetched:", filteredData)
      } else {
        console.warn("⚠️ No student data found for", username);
      }

      await createSessionWithData(filteredData, examdata, selfdata, null);
    } catch (err) {
      console.error("❌ Failed to fetch student data or create session:", err);
      setConnectionStatus("disconnected");
      setMessages([
        {
          id: "conn_fail",
          text: "⚠️ Unable to connect to AI service right now. Please refresh the page or try again later.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const createSessionWithData = async (
    studentData,
    examData,
    selfdata,
    teacherExamDetails = null,
  ) => {
    try {
      const filteredStudentInfo = {
        data: studentData || {},
      };

      //  console.log("Creating session with student info:", filteredStudentInfo);
      // console.log("Student ID:", localStorage.getItem("fullName") || username || "guest_user");
      // console.log("Exam data:", examData);
      // console.log("Class name:", className || "default_class");

      // Create FormData object
      const formData = new FormData();
      if (userRole === "student") {
        formData.append(
          "student_name",
          localStorage.getItem("fullName") || username || "guest_user",
        );
        formData.append("json_data", JSON.stringify(filteredStudentInfo)); // serialize JSON
        formData.append("exam_data", JSON.stringify(examData || {})); // serialize JSON
        formData.append("class_name", className || "default_class");
        formData.append("user_type", userRole || "student");
        formData.append("self_data", JSON.stringify(selfdata || {}));
      } else if (userRole === "teacher") {
        formData.append("user_type", "teacher");
        formData.append(
          "student_name",
          localStorage.getItem("fullName") || username || "guest_user",
        );
        formData.append("class_name", className || "default_class");
        formData.append("exam_data", JSON.stringify(teacherExamDetails || {}));
        formData.append(
          "detailed_exam_data",
          JSON.stringify(teacherExamDetails || {}),
        );
        // Teacher exam details
        // console.log("📤 Sending teacher session with exam_details:", teacherExamDetails);
      } else {
        formData.append("user_role", userRole || "student");
        formData.append(
          "student_name",
          localStorage.getItem("fullName") || username || "guest_user",
        );
        formData.append("class_name", className || "default_class");
      }
      // Log formData entries for debugging
      for (let [key, value] of formData.entries()) {
        // console.log(`${key}:`, value);
      }

      // Send the request using FormData
      const res = await api.post("/create_session", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // console.log("create_session response:", res.data)

      if (!res.data?.session_id) throw new Error("No session_id");

      setSessionId(res.data.session_id);
      setConnectionStatus("connected");
      // console.log("Session created successfully:", res.data.session_id)
    } catch (e) {
      console.error("create_session error:", e);
      setConnectionStatus("disconnected");
      setMessages((prev) => [
        ...prev,
        {
          id: "conn_fail",
          text: "⚠️ Unable to connect to AI service right now. Please refresh the page or try again later.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const clearChat = async () => {
    if (!sessionId) return;
    try {
      await api.delete(`/clear-session/${sessionId}`);
    } catch (e) {
      console.error("Failed to clear session:", e);
    } finally {
      setMessages([
        {
          id: "cleared",
          text:
            userRole === "teacher"
              ? "🧹 Chat cleared. Starting a fresh session… Ask about class performance or student analytics!"
              : "🧹 Chat cleared. Starting a fresh session… Ask your next question!",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      setSessionId(null);
      setConnectionStatus("checking");
      // Re-fetch data and create new session
      await fetchStudentDataAndCreateSession();
    }
  };

  // ====== File handlers ======
  const handleFileButtonClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => handleFile(e.target.files?.[0]);

  const handleText = (e) => {
    setInputText(e.target.value); // store user input in state
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.match("image.*")) {
      showAlert("Please upload an image file", "warning");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showAlert("Image must be ≤ 12MB", "warning");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowImageModal(true);
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowImageModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle correct image file selection (multiple files)
  const handleCorrectFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    const newPreviewUrls = [];

    for (const file of files) {
      if (!file.type.match("image.*")) {
        showAlert("Please upload only image files", "warning");
        continue;
      }
      if (file.size > 12 * 1024 * 1024) {
        showAlert(`${file.name} exceeds 12MB limit`, "warning");
        continue;
      }
      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setCorrectImageFiles((prev) => [...prev, ...validFiles]);
      setCorrectImagePreviews((prev) => [...prev, ...newPreviewUrls]);
    }

    // Reset file input to allow selecting same files again
    if (correctFileInputRef.current) correctFileInputRef.current.value = "";
  };

  // Remove a single image from the correct images list
  const removeCorrectImage = (index) => {
    setCorrectImagePreviews((prev) => {
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setCorrectImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCorrectImages = () => {
    correctImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setCorrectImageFiles([]);
    setCorrectImagePreviews([]);
    setShowCorrectImageModal(false);
    if (correctFileInputRef.current) correctFileInputRef.current.value = "";
  };

  // ====== Audio handlers ======
  const startRecording = async () => {
    if (isRecording || connectionStatus !== "connected" || !sessionId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      recordedChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        await processAudioBlob(audioBlob);
        // stop all tracks
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    try {
      mediaRecorderRef.current.stop();
    } catch (err) {
      console.error("Failed to stop recording:", err);
    } finally {
      setIsRecording(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) stopRecording();
    else await startRecording();
  };

  const processAudioBlob = async (audioBlob) => {
    if (!sessionId) return;
    const id = Date.now();
    setIsTyping(true);
    // Show processing placeholder
    setMessages((prev) => [
      ...prev,
      {
        id,
        text: "🎙️ Processing audio...",
        sender: "user",
        timestamp: new Date(),
      },
    ]);

    try {
      const fd = new FormData();
      fd.append("session_id", sessionId);
      fd.append("language", language);
      fd.append("audio", audioBlob, `recording_${id}.webm`);

      const res = await api.post("/process-audio", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const transcription = res?.data?.transcription || "(no transcription)";
      const aiText = res?.data?.response || res?.data?.content || "";
      const audioBase64 = res?.data?.audio_base64 || res?.data?.audio_bytes;
      const aiAudioUrl = audioBase64
        ? `data:audio/mp3;base64,${audioBase64}`
        : null;

      // Replace placeholder with actual transcription
      setMessages((prev) => {
        const withoutPlaceholder = prev.filter((m) => m.id !== id);
        return [
          ...withoutPlaceholder,
          {
            id,
            text: transcription,
            sender: "user",
            timestamp: new Date(),
          },
          {
            id: id + 1,
            text: aiText,
            sender: "ai",
            timestamp: new Date(),
            audioUrl: aiAudioUrl,
          },
        ];
      });
    } catch (e) {
      console.error("processAudio error:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: id + 1,
          text: "❌ Sorry, I couldn't process the audio. Please try again.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ====== Handler for calling anssubmit API ======
  const handleApiAction = async (apiFlag, actionName, imageFiles = null) => {
    if (!currentQuestion || !questionMetadata) {
      showAlert("Missing question data. Please refresh the page.", "error");
      return;
    }

    // For "correct" action, we need images - show modal to upload
    if (apiFlag === "correct" && (!imageFiles || imageFiles.length === 0)) {
      setShowCorrectImageModal(true);
      return;
    }

    // Set mascot to thinking mode while processing
    // setThinking();

    const id = Date.now();

    // Show user's action in chat
    setMessages((prev) => [
      ...prev,
      {
        id,
        text: `Requesting ${actionName}...`,
        sender: "user",
        timestamp: new Date(),
      },
    ]);

    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append("class_id", questionMetadata.class_id);
      formData.append("subject_id", questionMetadata.subject_id);
      formData.append("topic_ids", questionMetadata.topic_ids);
      formData.append("subtopic", questionMetadata.subtopic || "");
      formData.append(
        "question_id",
        currentQuestion.question_id || currentQuestion.id,
      );
      formData.append(apiFlag, true); // solve, explain, or correct

      // Add images for correct action (multiple images)
      if (apiFlag === "correct" && imageFiles && imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append("ans_img", file);
        });
      }

      console.log(`📤 Calling anssubmit/ API with ${apiFlag}:`, {
        class_id: questionMetadata.class_id,
        subject_id: questionMetadata.subject_id,
        topic_ids: questionMetadata.topic_ids,
        question_id: currentQuestion.question_id || currentQuestion.id,
        apiFlag,
        imageCount: imageFiles ? imageFiles.length : 0,
      });

      const response = await axiosInstance.post("/anssubmit/", formData);

      console.log("📥 anssubmit/ API response:", response.data);

      // Extract and format the response based on the action type
      let responseText = "";

      // Check if data is nested in ai_data object
      const apiData = response.data.ai_data || response.data;

      if (apiFlag === "solve") {
        // Handle AI Solution response
        if (apiData.ai_explaination && Array.isArray(apiData.ai_explaination)) {
          // Format each step with step numbers
          const formattedSteps = apiData.ai_explaination
            .map((step, index) => {
              return `**Step ${index + 1}:**\n\n${step}`;
            })
            .join("\n\n---\n\n");

          responseText = `##### AI Solution\n\n${formattedSteps}`;
          console.log(
            "✅ Solve response formatted:",
            responseText.substring(0, 100) + "...",
          );
        } else {
          responseText =
            apiData.solution ||
            apiData.answer ||
            "Solution generated successfully!";
          console.log("⚠️ No ai_explaination found, using fallback");
        }
        // Set mascot to happy mode after providing solution
        // setHappy("Here's the solution! Let me know if you need more help!");
      } else if (apiFlag === "explain") {
        // Handle Concepts-Required response - check both locations
        const conceptsData = apiData.concepts || response.data.concepts;
        const videosData = apiData.videos || response.data.videos;

        if (conceptsData && Array.isArray(conceptsData)) {
          // Format concepts with proper structure
          const conceptsFormatted = conceptsData
            .map((concept, index) => {
              let formatted = `###### ${index + 1}. ${concept.concept}\n\n`;

              if (concept.explanation) {
                formatted += `**Explanation:**\n${concept.explanation}\n\n`;
              }

              if (concept.example) {
                formatted += `**Example:**\n${concept.example}\n\n`;
              }

              if (concept.application) {
                formatted += `**Application:**\n${concept.application}\n\n`;
              }

              return formatted;
            })
            .join("\n---\n\n");

          responseText = `#### Key Concepts Required\n\n${conceptsFormatted}\n`;

          // Add note about videos if available
          if (
            videosData &&
            Array.isArray(videosData) &&
            videosData.length > 0
          ) {
            responseText += `\n\n#### Recommended Videos\n\nClick any video below to watch it on YouTube:`;
          }
        } else {
          responseText = "Concepts explained successfully!";
          console.log("⚠️ No concepts found in response");
        }

        // Set mascot to teaching mode after explaining concepts
        // setTeaching("Let me explain these concepts to help you understand better!");

        // Display AI response in chat with videos as separate property
        setMessages((prev) => [
          ...prev,
          {
            id: id + 1,
            text: responseText,
            sender: "ai",
            timestamp: new Date(),
            videos: videosData && videosData.length > 0 ? videosData : null,
          },
        ]);
        return; // Exit early to avoid duplicate message addition below
      } else if (apiFlag === "correct") {
        // Build comprehensive correction response
        let correctionParts = [];

        // Add marks info if available
        if (
          apiData.total_marks !== undefined &&
          apiData.obtained_marks !== undefined
        ) {
          correctionParts.push(
            `#### Score: ${apiData.obtained_marks}/${apiData.total_marks}`,
          );
        }

        // Add student's answer analysis if available
        if (apiData.student_answer) {
          correctionParts.push(
            `\n\n##### Your Answer:\n${apiData.student_answer}`,
          );
        }

        // Add AI explanation (step-by-step solution)
        if (apiData.ai_explaination && Array.isArray(apiData.ai_explaination)) {
          const formattedSteps = apiData.ai_explaination
            .map((step, index) => {
              return `**Step ${index + 1}:**\n\n${step}`;
            })
            .join("\n\n---\n\n");
          correctionParts.push(
            `\n\n##### Correct Solution:\n\n${formattedSteps}`,
          );
        }

        // Add gap analysis if available
        if (apiData.gap_analysis) {
          correctionParts.push(
            `\n\n##### Gap Analysis:\n${apiData.gap_analysis}`,
          );
        }

        // Add error type if available
        if (apiData.error_type) {
          correctionParts.push(`\n\n**Error Type:** ${apiData.error_type}`);
        }

        // Add concepts used if available
        if (
          apiData.concepts_used &&
          Array.isArray(apiData.concepts_used) &&
          apiData.concepts_used.length > 0
        ) {
          const conceptsList = apiData.concepts_used
            .map((c) => `- ${c}`)
            .join("\n");
          correctionParts.push(`\n\n##### Concepts Tested:\n${conceptsList}`);
        }

        // Add time analysis if available
        if (apiData.time_analysis) {
          correctionParts.push(
            `\n\n**Time Analysis:** ${apiData.time_analysis}`,
          );
        }

        responseText =
          correctionParts.length > 0
            ? correctionParts.join("")
            : apiData.correction || apiData.feedback || "Correction completed!";

        console.log(
          "✅ Correct response formatted:",
          responseText.substring(0, 100) + "...",
        );
        // Set mascot to happy mode after correction
        // setHappy("I've reviewed your answer! Keep practicing!");
      }

      // Display AI response in chat (for non-explain actions)
      setMessages((prev) => [
        ...prev,
        {
          id: id + 1,
          text: responseText,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);

      // showAlert(`${actionName} completed successfully!`, "success");
    } catch (error) {
      console.error(`❌ Error calling anssubmit/ API with ${apiFlag}:`, error);

      setMessages((prev) => [
        ...prev,
        {
          id: id + 1,
          text: `❌ Sorry, I couldn't process your ${actionName} request. Please try again.`,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);

      showAlert(`Failed to get ${actionName}. Please try again.`, "error");
    } finally {
      setIsTyping(false);
    }
  };

  // ====== Message senders ======
  const handleSuggestionClick = async (suggestion) => {
    // Handle tutorial button click
    if (suggestion.isTutorial) {
      // Show confirmation message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text:
            userRole === "teacher"
              ? "🎓 Tutorial started! I'll guide you through the teacher dashboard. Navigating..."
              : "🎓 Tutorial started! I'll guide you through the platform. Navigating to dashboard...",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);

      // Close the chatbot and start tutorial
      setTimeout(() => {
        setIsOpen(false);
        // Reset any previous tutorial state
        resetTutorial();
        // Navigate to appropriate dashboard based on role
        if (userRole === "teacher") {
          navigate("/teacher-dash");
          setTimeout(() => {
            startTutorialForPage("teacherDash");
          }, 300);
        } else {
          navigate("/student-dash");
          setTimeout(() => {
            startTutorialForPage("studentDash");
          }, 300);
        }
      }, 500);
      return;
    }

    // Handle API actions (AI-Solution, Concepts-Required, etc.)
    if (suggestion.isApiAction) {
      await handleApiAction(suggestion.apiFlag, suggestion.text);
      return;
    }

    // Handle exam dropdown suggestion - toggle dropdown instead of sending
    if (suggestion.isExamDropdown) {
      setShowExamDropdown((prev) => !prev);
      setShowDurationDropdown(false);
      return;
    }

    // Handle duration dropdown suggestion - toggle dropdown instead of sending
    if (suggestion.isDurationDropdown) {
      setShowDurationDropdown((prev) => !prev);
      setShowExamDropdown(false);
      return;
    }

    // Handle regular suggestions - populate input box for user to edit before sending
    if (!sessionId || connectionStatus !== "connected" || isTyping) return;
    setNewMessage(suggestion.text);
  };

  const handleExamSelect = (examName) => {
    setSelectedExam(examName);
    setShowExamDropdown(false);
    const query = `Give me question-wise analysis of exam name ${examName} with exact errors made in tabular format`;
    setNewMessage(query);
  };

  const handleDurationSelect = (duration) => {
    setShowDurationDropdown(false);
    const query = `Give remedial program for ${duration} as per my weaknesses`;
    setNewMessage(query);
  };

  const sendImageWithCommand = async (command) => {
    setShowImageModal(false);
    await sendMessageBase(command, selectedFile);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
    await sendMessageBase(newMessage.trim(), selectedFile);
  };

  const sendMessageBase = async (text, imageFile) => {
    if (!sessionId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Connecting… please try again in a moment.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const id = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id,
        text,
        sender: "user",
        timestamp: new Date(),
        image: imageFile ? previewUrl : null,
      },
    ]);
    setNewMessage("");
    setIsTyping(true);

    try {
      // Build combined query with optional context
      let combinedQuery = `${text || ""}`.trim();
      if (
        includeQuestionContext &&
        currentQuestion &&
        (currentQuestion.question || currentQuestion.image)
      ) {
        const contextParts = [];
        if (currentQuestion.question) {
          contextParts.push(`Question: ${currentQuestion.question}`);
        }
        if (currentQuestion.image) {
          // Convert image URL to base64 if needed for better LLM understanding
          try {
            const imageBase64 = await getImageSrc(currentQuestion.image);
            contextParts.push(`Question Image: ${imageBase64}`);
          } catch (error) {
            console.error("Error preparing question image for context:", error);
            // Fallback to original image data
            contextParts.push(`Question Image: ${currentQuestion.image}`);
          }
        }
        const contextStr = contextParts.join("\n");
        combinedQuery = [combinedQuery, contextStr]
          .filter(Boolean)
          .join("\n\nContext:\n");
      }

      if (imageFile) {
        // Image upload with message
        const fd = new FormData();
        fd.append("session_id", sessionId);
        fd.append("query", combinedQuery || "");
        fd.append("language", language);
        fd.append(
          "image",
          imageFile,
          imageFile.name || `image_${Date.now()}.jpg`,
        );

        // Add student context if available
        if (studentInfo) {
          // fd.append("student_context", JSON.stringify(studentInfo));
        }

        const res = await api.post("/chat", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const audioBase64 = res?.data?.audio_base64;
        const aiAudioUrl = audioBase64
          ? `data:audio/mp3;base64,${audioBase64}`
          : null;

        setMessages((prev) => [
          ...prev,
          {
            id: id + 1,
            text: res?.data?.response || "I've analyzed your image!",
            sender: "ai",
            timestamp: new Date(),
            audioUrl: aiAudioUrl,
          },
        ]);
      } else {
        // Text-only message
        const requestBody = {
          session_id: sessionId,
          query: combinedQuery || "",
          language: language,
        };

        // Add student context if available
        // if (studentInfo) {
        //   requestBody.student_context = studentInfo;
        // }

        const res = await api.post("/chat-simple", requestBody, {
          headers: { session_token: sessionId },
        });
        const audioBase64 = res?.data?.aiAudioUrl;
        const aiAudioUrl = audioBase64
          ? `data:audio/mp3;base64,${audioBase64}`
          : null;

        setMessages((prev) => [
          ...prev,
          {
            id: id + 1,
            text: res?.data?.response || "I received your message!",
            sender: "ai",
            timestamp: new Date(),
            audioUrl: aiAudioUrl,
          },
        ]);
      }
    } catch (e) {
      console.error("sendMessage error:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: id + 1,
          text: "❌ Sorry, I couldn't process that right now. Please try again.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      clearSelectedFile();
    }
  };

  // ====== Render ======
  return (
    <>
      <AlertContainer />
      <div className="chat-box-container">
        {/* Floating Toggle */}
        <button
          className={`chat-toggle-btn ${isOpen ? "open" : ""}`}
          onClick={toggleChat}
          title={isOpen ? "Close chat" : "Ask a question"}
        >
          {!isOpen && (
            <div className="chatbot-thinking-indicator">
              <span className="thinking-dot"></span>
              <span className="thinking-dot"></span>
              <span className="thinking-dot"></span>
            </div>
          )}
          <motion.img
            style={{
              width: "clamp(48px, 12vw, 80px)",
              height: "clamp(48px, 12vw, 80px)",
              borderRadius: "50%",
              objectFit: "cover",
              maxWidth: "none",
            }}
            src={chatbotGif}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* <FontAwesomeIcon icon={isOpen ? faTimes : faCommentDots} /> */}
          {!isOpen && (
            <strong className="chat-label">
              {userRole === "teacher" ? "Class Analytics" : "Need help, champ?"}
            </strong>
          )}
        </button>

        {/* Chat Window */}
        <div className={`chat-box ${isOpen ? "open" : ""}`}>
          {/* Header */}
          <div className="chat-header-v2">
            {/* Top row: avatar + title + actions */}
            <div className="chat-header-top">
              <div className="chat-header-identity">
                <div className="chat-header-avatar">
                  <img
                    src={chatbotGif}
                    alt="AI"
                    className="chat-header-avatar-img"
                  />
                  <span
                    className={`chat-header-status-dot ${
                      connectionStatus === "connected"
                        ? "online"
                        : connectionStatus === "checking"
                          ? "connecting"
                          : "offline"
                    }`}
                  />
                </div>
                <div className="chat-header-info">
                  <span className="chat-header-name">
                    {userRole === "teacher"
                      ? "Analytics Assistant"
                      : "Math Assistant"}
                  </span>
                  <span className="chat-header-subtitle">
                    {connectionStatus === "connected"
                      ? `${className} Class · Online`
                      : connectionStatus === "checking"
                        ? "Connecting..."
                        : "Offline"}
                  </span>
                </div>
              </div>

              <div className="chat-header-actions">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="chat-header-lang-select"
                  title="Language"
                >
                  <option value="en">EN</option>
                  <option value="hi">HI</option>
                  <option value="te">TE</option>
                </select>

                <button
                  className="chat-header-icon-btn"
                  onClick={clearChat}
                  disabled={connectionStatus !== "connected" || !sessionId}
                  title="Clear chat"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>

                <button
                  className="chat-header-icon-btn chat-header-close-btn"
                  onClick={toggleChat}
                  title="Close"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`message ${
                  m.sender === "user" ? "user-message" : "ai-message"
                }`}
              >
                <div className="message-bubble">
                  {formatMessage(m.text)}

                  {/* Render videos if available */}
                  {m.videos && m.sender === "ai" && (
                    <VideoListComponent videos={m.videos} />
                  )}

                  {m.audioUrl && (
                    <div
                      className="message-audio-container"
                      style={{ marginTop: 8 }}
                    >
                      <audio controls src={m.audioUrl} />
                    </div>
                  )}
                  {m.image && (
                    <div className="message-image-container">
                      <img
                        src={m.image}
                        alt="User uploaded"
                        className="message-image"
                      />
                    </div>
                  )}
                </div>

                {/* Message footer */}
                <div
                  className="message-time"
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  {m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message ai-message">
                <div className="message-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips - Above Input */}
          {!isTyping && (
            <>
              {/* Exam selector row - shown when dropdown is toggled */}
              {showExamDropdown && (
                <div className="exam-selector-row">
                  <span className="exam-selector-label">Select exam:</span>
                  {isLoadingExams ? (
                    <span className="exam-selector-loading">Loading...</span>
                  ) : examNames.length === 0 ? (
                    <span className="exam-selector-loading">
                      No exams found
                    </span>
                  ) : (
                    examNames.map((name, i) => (
                      <button
                        key={i}
                        className="exam-name-chip"
                        onClick={() => handleExamSelect(name)}
                      >
                        {name}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Duration selector row - shown when remedial dropdown is toggled */}
              {showDurationDropdown && (
                <div className="exam-selector-row">
                  <span className="exam-selector-label">Duration:</span>
                  {durationOptions.map((opt, i) => (
                    <button
                      key={i}
                      className="exam-name-chip"
                      onClick={() => handleDurationSelect(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="suggestion-container">
                {suggestionQuestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className={`suggestion-chip ${
                      (suggestion.isExamDropdown && showExamDropdown) ||
                      (suggestion.isDurationDropdown && showDurationDropdown)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={
                      suggestion.isApiAction
                        ? isTyping
                        : !suggestion.isTutorial &&
                          !suggestion.isExamDropdown &&
                          !suggestion.isDurationDropdown &&
                          (connectionStatus !== "connected" || isTyping)
                    }
                    title={
                      suggestion.isTutorial
                        ? "Start guided tutorial"
                        : suggestion.isApiAction
                          ? `Get ${suggestion.text} from AI`
                          : suggestion.isExamDropdown
                            ? "Select an exam to analyze"
                            : suggestion.isDurationDropdown
                              ? "Select duration for remedial program"
                              : `Ask: ${suggestion.text}`
                    }
                    style={
                      suggestion.isTutorial
                        ? {
                            background:
                              "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            color: "white",
                            fontWeight: "600",
                          }
                        : suggestion.isApiAction
                          ? {
                              background:
                                "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                              color: "white",
                              fontWeight: "600",
                              borderColor: "#3b82f6",
                            }
                          : {}
                    }
                  >
                    <FontAwesomeIcon
                      icon={suggestion.icon}
                      className="suggestion-icon"
                    />
                    <span>{suggestion.text}</span>
                    {suggestion.isExamDropdown && (
                      <span style={{ marginLeft: 4, fontSize: "0.7em" }}>
                        {showExamDropdown ? "▲" : "▼"}
                      </span>
                    )}
                    {suggestion.isDurationDropdown && (
                      <span style={{ marginLeft: 4, fontSize: "0.7em" }}>
                        {showDurationDropdown ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Input Area */}
          <Form onSubmit={sendMessage} className="chat-input">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder={
                  connectionStatus === "connected"
                    ? userRole === "teacher"
                      ? "Ask about student performance, exams..."
                      : "Type your question..."
                    : "Connecting to AI service..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={connectionStatus !== "connected" || isTyping}
              />

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
                disabled={connectionStatus !== "connected" || isTyping}
              />

              {/* Action buttons */}
              <div className="chat-input-actions">
                {/* Image thumbnail or Upload button */}
                {previewUrl ? (
                  <div className="input-thumbnail-container">
                    <div className="input-thumbnail">
                      <img
                        src={previewUrl}
                        alt="Thumbnail"
                        className="thumbnail-image"
                      />
                      <button
                        className="remove-thumbnail-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          clearSelectedFile();
                        }}
                        aria-label="Remove image"
                        type="button"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="chat-input-action-btn"
                    type="button"
                    onClick={handleFileButtonClick}
                    title="Upload image"
                    disabled={connectionStatus !== "connected" || isTyping}
                  >
                    <FontAwesomeIcon icon={faUpload} />
                  </button>
                )}

                {/* Audio record button */}
                <button
                  className={`chat-input-action-btn ${isRecording ? "chat-input-action-btn--recording" : ""}`}
                  type="button"
                  onClick={toggleRecording}
                  title={isRecording ? "Stop recording" : "Record audio"}
                  disabled={connectionStatus !== "connected" || isTyping}
                >
                  <FontAwesomeIcon icon={isRecording ? faStop : faMicrophone} />
                </button>

                {/* Send button */}
                <button
                  className="chat-input-action-btn chat-input-action-btn--send"
                  type="submit"
                  disabled={
                    connectionStatus !== "connected" ||
                    isTyping ||
                    (!newMessage.trim() && !selectedFile)
                  }
                  title="Send message"
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </InputGroup>
          </Form>
        </div>

        {/* Image Action Modal */}
        <Modal show={showImageModal} onHide={clearSelectedFile} centered>
          <Modal.Header closeButton>
            <Modal.Title>📸 Choose Analysis</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {previewUrl && (
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 240,
                    borderRadius: 8,
                    objectFit: "contain",
                  }}
                />
              </div>
            )}
            <div className="upload d-grid gap-2">
              <Button
                variant="primary"
                onClick={() => sendImageWithCommand("solve it")}
                disabled={connectionStatus !== "connected"}
              >
                🧮 Solve It
              </Button>
              <Button
                variant="success"
                onClick={() => sendImageWithCommand("correct it")}
                disabled={connectionStatus !== "connected"}
              >
                ✅ Correct It
              </Button>
              <div className="input-container">
                <input
                  type="text"
                  className="custom-input"
                  onChange={handleText}
                  accept="image/*"
                  placeholder="Type your message..."
                  disabled={connectionStatus !== "connected" || isTyping}
                />
                <Button
                  className="send-btn"
                  onClick={() => sendImageWithCommand(inputText)}
                  disabled={connectionStatus !== "connected"}
                >
                  Send Input
                </Button>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={clearSelectedFile}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        {/* AI-Correct Image Upload Modal (Multiple Images) */}
        <Modal
          show={showCorrectImageModal}
          onHide={clearCorrectImages}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>📝 Upload Your Solution for AI-Correct</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted mb-3">
              Upload images of your handwritten solution. You can add multiple
              images.
            </p>

            {/* Hidden file input - multiple */}
            <input
              type="file"
              ref={correctFileInputRef}
              onChange={handleCorrectFileChange}
              accept="image/*"
              multiple
              style={{ display: "none" }}
            />

            {/* Image previews grid */}
            {correctImagePreviews.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span className="text-muted">
                    {correctImagePreviews.length} image
                    {correctImagePreviews.length > 1 ? "s" : ""} selected
                  </span>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      correctImagePreviews.forEach((url) =>
                        URL.revokeObjectURL(url),
                      );
                      setCorrectImageFiles([]);
                      setCorrectImagePreviews([]);
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} className="me-1" />
                    Clear All
                  </Button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "12px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    padding: "8px",
                    border: "1px solid #dee2e6",
                    borderRadius: "8px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  {correctImagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "2px solid #dee2e6",
                        backgroundColor: "#fff",
                      }}
                    >
                      <img
                        src={preview}
                        alt={`Solution ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeCorrectImage(index)}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          border: "none",
                          backgroundColor: "rgba(220, 53, 69, 0.9)",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        ×
                      </button>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "4px",
                          left: "4px",
                          backgroundColor: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                        }}
                      >
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload area */}
            <div
              style={{
                border: "2px dashed #dee2e6",
                borderRadius: 8,
                padding: correctImagePreviews.length > 0 ? "20px" : "40px 20px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#f8f9fa",
                transition: "background-color 0.2s",
              }}
              onClick={() => correctFileInputRef.current?.click()}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#e9ecef")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#f8f9fa")
              }
            >
              <FontAwesomeIcon
                icon={faUpload}
                size={correctImagePreviews.length > 0 ? "lg" : "2x"}
                style={{ color: "#6c757d", marginBottom: 8 }}
              />
              <p className="mb-0" style={{ color: "#6c757d" }}>
                {correctImagePreviews.length > 0
                  ? "Click to add more images"
                  : "Click to upload your solution images"}
              </p>
              <small className="text-muted">
                Max 12MB per image. You can select multiple files.
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={clearCorrectImages}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={correctImageFiles.length === 0 || isTyping}
              onClick={async () => {
                const imagesToSend = [...correctImageFiles];
                clearCorrectImages();
                await handleApiAction("correct", "AI-Correct", imagesToSend);
              }}
            >
              <FontAwesomeIcon icon={faWandMagicSparkles} className="me-1" />
              Submit{" "}
              {correctImageFiles.length > 0
                ? `(${correctImageFiles.length})`
                : ""}{" "}
              for AI-Correct
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
});

ChatBox.displayName = "ChatBox";

export default ChatBox;
