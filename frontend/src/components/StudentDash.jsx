import React, { useState, useEffect, useContext, useMemo } from "react";
import "katex/dist/katex.min.css";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import QuestionListModal from "./QuestionListModal";
import Select from "react-select";
import { AuthContext } from "./AuthContext";
import { useAlert } from "./AlertBox";
import StudentWizard from "./StudentWizard";
import { useJeeMode } from "../contexts/JeeModeContext";
import {
  BookOpen,
  List,
  ClipboardList,
  HelpCircle,
  Rocket,
  Sun,
  Moon,
  Calendar,
  Flame,
} from "lucide-react";
import UnifiedSessions from "./UnifiedSessions";
import Tutorial from "./Tutorial";
import { useTutorial } from "../contexts/TutorialContext";
import FeedbackBox from "./FeedbackBox";
// import QuizScoreGraph from "./QuizScoreGraph";

function StudentDash({ jeeMode = false }) {
  const navigate = useNavigate();
  const { username, fullName, role } = useContext(AuthContext);
  const { showAlert, AlertContainer } = useAlert();

  const location = useLocation();
  const prefillData = location.state?.prefill || null;
  const autoFetch = location.state?.autoFetch || false; // ← ADD THIS LINE

  // Tutorial context
  const {
    shouldShowTutorialForPage,
    continueTutorialFlow,
    completeTutorialFlow,
    startTutorialFromToggle,
    startTutorialForPage,
    tutorialFlow,
    completedPages,
  } = useTutorial();

  // Dark mode state with improved persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Inline streak state — reads same localStorage key as StreakTracker
  const [inlineStreak, setInlineStreak] = useState(() => {
    try {
      const stored = localStorage.getItem(`streak_${username}`);
      return stored ? JSON.parse(stored).currentStreak || 0 : 0;
    } catch {
      return 0;
    }
  });

  // State for dropdown data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [jeeSubtopics, setJeeSubtopics] = useState([]);

  // State for selections with smart defaults
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [questionType, setQuestionType] = useState("");
  const [questionLevel, setQuestionLevel] = useState("");
  const [selectedWorksheet, setSelectedWorksheet] = useState("");
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [questionList, setQuestionList] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination state for JEE questions
  const [paginationInfo, setPaginationInfo] = useState({
    next: null,
    previous: null,
    count: 0,
    currentPage: 1,
    totalPages: 0,
    isLoading: false,
  });

  const [scienceSubtopics, setScienceSubtopics] = useState([]);

  // Resume Learning state
  const [lastSession, setLastSession] = useState(null);
  const [canResume, setCanResume] = useState(false);

  // Feedback Modal state (auto-show after 3 mins of app usage, only once)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Extract class from username (e.g., 10HPS24 -> 10, 12ABC24 -> 12)
  const extractClassFromUsername = (username) => {
    if (!username) return "";
    const firstTwo = username.substring(0, 2);
    if (!isNaN(firstTwo)) return firstTwo;
    const firstOne = username.charAt(0);
    if (!isNaN(firstOne)) return firstOne;
    return "";
  };

  // Enhanced time-based greeting
  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 6) return "Good Night";
    else if (currentHour >= 6 && currentHour < 12) return "Good Morning";
    else if (currentHour >= 12 && currentHour < 17) return "Good Afternoon";
    else if (currentHour >= 17 && currentHour < 21) return "Good Evening";
    else return "Good Night";
  };

  // Get motivational message based on time
  const getMotivationalMessage = () => {
    const messages = [
      "Ready to sharpen your skills? Pick a chapter and start solving.",
      "Every problem solved is a step closer to mastery.",
      "Consistency beats intensity. Keep the streak going.",
      "Small progress is still progress. Let's get started.",
      "Your future self will thank you for today's effort.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Toggle dark mode - dispatches custom event
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    document.body.classList.toggle("dark-mode", newMode);
    window.dispatchEvent(
      new CustomEvent("darkModeChange", { detail: { isDarkMode: newMode } }),
    );
  };

  const tutorialSteps = [
    {
      target: ".greeting-content",
      content:
        "Welcome to your Student Dashboard! Let me guide you through how to get started with solving questions.",
      disableBeacon: true,
    },
    {
      target: "#formClass",
      content:
        "First, select your class from this dropdown. Your class should be pre-selected based on your username.",
    },
    {
      target: "#formSubject",
      content:
        "Next, choose the subject you want to study. Mathematics is usually selected by default.",
    },
    {
      target: ".chapters-select-final",
      content:
        "Select one or more chapters you want to practice. You can select multiple chapters at once!",
    },
    {
      target: "#formQuestionType",
      content:
        "Choose the type of questions: Solved Examples (to learn), Exercises (to practice), or Worksheets (for tests).",
    },
    {
      target: ".button--mimas",
      content:
        "Finally, click this button to generate questions based on your selections. You'll see a list of available questions!",
    },
  ];

  const handleTutorialComplete = () => {
    // Don't mark as complete yet - will continue to next page when user clicks generate
  };

  // JEE Mode Context
  const { isJeeMode, setIsJeeMode } = useJeeMode();

  // Set JEE mode based on prop
  useEffect(() => {
    setIsJeeMode(jeeMode);
    console.log(`🎯 Dashboard Mode: ${jeeMode ? "JEE" : "Board"}`);
  }, [jeeMode, setIsJeeMode]);

  // Apply dark mode on component mount
  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDarkMode);
  }, [isDarkMode]);

  // Feedback Modal - Auto-show after 3 minutes of app usage (only once ever)
  useEffect(() => {
    if (role === "student" && username) {
      const feedbackShownKey = `feedback_auto_shown_${username}`;
      const alreadyShown = localStorage.getItem(feedbackShownKey);
      if (alreadyShown === "true") {
        console.log("📝 Feedback already shown before, skipping auto-show");
        return;
      }
      console.log("⏱️ Starting 3-minute timer for feedback modal...");
      const timer = setTimeout(
        () => {
          console.log("✅ 3 minutes passed, showing feedback modal");
          setShowFeedbackModal(true);
          localStorage.setItem(feedbackShownKey, "true");
        },
        3 * 60 * 1000,
      );
      return () => {
        clearTimeout(timer);
        console.log("🧹 Feedback timer cleared");
      };
    }
  }, [role, username]);

  // Load last session on component mount
  useEffect(() => {
    const loadLastSession = () => {
      try {
        const savedSession = localStorage.getItem(`lastSession_${username}`);
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          const sessionDate = new Date(sessionData.timestamp);
          const daysSinceSession =
            (new Date() - sessionDate) / (1000 * 60 * 60 * 24);
          if (
            daysSinceSession <= 7 &&
            sessionData.questionList &&
            sessionData.questionList.length > 0
          ) {
            setLastSession(sessionData);
            setCanResume(true);
            console.log("✅ Last session loaded:", sessionData);
          } else {
            localStorage.removeItem(`lastSession_${username}`);
          }
        }
      } catch (error) {
        console.error("Error loading last session:", error);
      }
    };
    if (username) loadLastSession();
  }, [username]);

  // Helper function to check if selected subject is Science
  const isScienceSubject = () => {
    if (!selectedSubject || !subjects.length) return false;
    const subject = subjects.find((s) => s.subject_code === selectedSubject);
    return subject && subject.subject_name.toLowerCase().includes("science");
  };

  // Check if the selected subject is a JEE subject
  const isJEESubject = () => {
    if (!selectedSubject) return false;
    const subject = subjects.find((s) => s.subject_code === selectedSubject);
    const subjectName = subject?.subject_name?.toLowerCase() || "";
    return (
      subjectName.includes("jee") ||
      subjectName.includes("mathematics_mains") ||
      subjectName.includes("mathematics_advanced") ||
      subjectName.includes("physics_mains") ||
      subjectName.includes("chemistry_mains")
    );
  };

  // Complete mapping of question types with IDs
  const QUESTION_TYPE_MAPPING = [
    {
      id: "1",
      value: "activity_based_questions",
      label: "Activity Based Questions",
    },
    { id: "2", value: "conceptual_questions", label: "Conceptual Questions" },
    {
      id: "3",
      value: "diagram_based_questions",
      label: "Diagram Based Questions",
    },
    { id: "4", value: "fill_in_the_blanks", label: "Fill in the Blanks" },
    { id: "5", value: "matching_questions", label: "Matching Questions" },
    { id: "6", value: "t_f_questions", label: "True/False Questions" },
  ];

  // JEE Mathematics Subtopic Mapping
  const JEE_SUBTOPIC_MAPPING = [
    { id: "1", value: "mcq", label: "Multiple Choice Questions (MCQ)" },
    { id: "2", value: "nvtq", label: "Numerical Value Type Questions (NVTQ)" },
    { id: "3", value: "theorem", label: "Theorem Based Questions" },
  ];

  const getQuestionTypeOptions = () => {
    if (isScienceSubject()) {
      if (scienceSubtopics.length > 0) {
        return QUESTION_TYPE_MAPPING.filter((type) =>
          scienceSubtopics.includes(type.id),
        );
      }
      return QUESTION_TYPE_MAPPING;
    }
    if (isJEEMainsAdvancedSubject()) {
      console.log(
        "🎯 JEE Mains/Advanced Subject detected! Showing MCQ/NVTQ/Theorem options",
      );
      return JEE_SUBTOPIC_MAPPING;
    }
    if (isJEETraditionalSubject()) {
      console.log(
        "📚 JEE Traditional Subject detected! Showing Solved/Exercise/Worksheet options",
      );
      return [
        { value: "solved", label: "Solved Examples" },
        { value: "external", label: "Book Exercises" },
        { value: "worksheets", label: "Take it to next level with Worksheets" },
      ];
    }
    return [
      { value: "solved", label: "Solved Examples" },
      { value: "external", label: "Book Exercises" },
      { value: "worksheets", label: "Take it to next level with Worksheets" },
    ];
  };

  // Helper function to check if selected subject is JEE Mains/Advanced
  const isJEEMainsAdvancedSubject = () => {
    if (!selectedSubject || !subjects.length) return false;
    const subject = subjects.find((s) => s.subject_code === selectedSubject);
    const subjectName = subject?.subject_name?.toLowerCase() || "";
    return (
      subjectName.includes("mathematics_mains") ||
      subjectName.includes("mathematics_advanced") ||
      subjectName.includes("jee_mathematics_mains") ||
      subjectName.includes("jee_mathematics_advanced")
    );
  };

  // Helper function to check if subject is JEE but uses traditional flow
  const isJEETraditionalSubject = () => {
    if (!selectedSubject || !subjects.length) return false;
    const subject = subjects.find((s) => s.subject_code === selectedSubject);
    const subjectName = subject?.subject_name?.toLowerCase() || "";
    return (
      (subjectName.includes("jee") &&
        !subjectName.includes("mathematics_mains") &&
        !subjectName.includes("mathematics_advanced")) ||
      subjectName === "jee_physics" ||
      subjectName === "jee_mathematics" ||
      subjectName === "jee_mathematics_1"
    );
  };

  // Reset question type when subject changes
  useEffect(() => {
    if (selectedSubject) {
      setQuestionType("");
      setQuestionLevel("");
      setSelectedWorksheet("");
      setScienceSubtopics([]);
      setJeeSubtopics([]);
    }
  }, [selectedSubject]);

  // Fetch available subtopics for Science OR JEE subjects when selected with chapters
  useEffect(() => {
    async function fetchSubtopics() {
      if (
        isScienceSubject() &&
        selectedClass &&
        selectedSubject &&
        selectedChapters.length > 0
      ) {
        try {
          console.log("🔬 Fetching Science subtopics...");
          const response = await axiosInstance.post(
            "/question-images-paginator/",
            {
              classid: selectedClass,
              subjectid: selectedSubject,
              topicid: selectedChapters,
              external: true,
            },
          );
          if (response.data && response.data.subtopics) {
            setScienceSubtopics(response.data.subtopics);
            console.log(
              "✅ Available Science subtopics:",
              response.data.subtopics,
            );
          } else {
            setScienceSubtopics([]);
          }
        } catch (error) {
          console.error("❌ Error fetching Science subtopics:", error);
          setScienceSubtopics([]);
        }
      } else if (
        isJEEMainsAdvancedSubject() &&
        selectedClass &&
        selectedSubject &&
        selectedChapters.length > 0
      ) {
        try {
          console.log("📐 Fetching JEE Mains/Advanced subtopics...");
          const response = await axiosInstance.post(
            "/question-images-paginator/",
            {
              classid: selectedClass,
              subjectid: selectedSubject,
              topicid: selectedChapters,
              external: true,
            },
          );
          if (response.data && response.data.subtopics) {
            setJeeSubtopics(response.data.subtopics);
            console.log("✅ Available JEE subtopics:", response.data.subtopics);
          } else {
            setJeeSubtopics([]);
          }
        } catch (error) {
          console.error("❌ Error fetching JEE subtopics:", error);
          setJeeSubtopics([]);
        }
      } else if (
        isJEETraditionalSubject() &&
        questionType === "external" &&
        selectedClass &&
        selectedSubject &&
        selectedChapters.length > 0
      ) {
        try {
          console.log("📚 Fetching JEE Traditional subtopics...");
          const response = await axiosInstance.post(
            "/question-images-paginator/",
            {
              classid: selectedClass,
              subjectid: selectedSubject,
              topicid: selectedChapters[0],
              external: true,
            },
          );
          setSubTopics(response.data.subtopics || []);
        } catch (error) {
          console.error("❌ Error fetching subtopics:", error);
          setSubTopics([]);
        }
      } else {
        setScienceSubtopics([]);
        setJeeSubtopics([]);
      }
    }
    fetchSubtopics();
  }, [selectedClass, selectedSubject, selectedChapters, questionType]);

  const isGenerateButtonEnabled = () => {
    if (
      !selectedClass ||
      !selectedSubject ||
      selectedChapters.length === 0 ||
      !questionType
    ) {
      return false;
    }
    if (isJEEMainsAdvancedSubject()) {
      const validTypes = ["mcq", "nvtq", "theorem"];
      return validTypes.includes(questionType) && jeeSubtopics.length > 0;
    }
    if (questionType === "external") return !!questionLevel;
    if (questionType === "worksheets") return !!selectedWorksheet;
    return true;
  };

  // Fetch classes and set defaults
  useEffect(() => {
    async function fetchData() {
      try {
        const classResponse = await axiosInstance.get("/classes/");
        const classesData = classResponse.data.data;
        let filteredClasses = classesData;
        if (isJeeMode) {
          filteredClasses = classesData.filter((cls) => {
            const className = cls.class_name.toLowerCase();
            return className.includes("11") || className.includes("12");
          });
          console.log(
            "📐 JEE Mode - Classes:",
            filteredClasses.map((c) => c.class_name),
          );
        } else {
          console.log(
            "📚 Board Mode - Classes:",
            filteredClasses.map((c) => c.class_name),
          );
        }
        setClasses(filteredClasses);
        const defaultClass = extractClassFromUsername(username);
        if (defaultClass) {
          const matchingClass = classesData.find(
            (cls) =>
              cls.class_name.includes(defaultClass) ||
              cls.class_code === defaultClass,
          );
          if (matchingClass) {
            setSelectedClass(matchingClass.class_code);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching classes", error);
      }
    }
    fetchData();
  }, [username, isJeeMode]);

  // Fetch subjects and set default
  useEffect(() => {
    async function fetchSubjects() {
      if (selectedClass) {
        try {
          const subjectResponse = await axiosInstance.post("/subjects/", {
            class_id: selectedClass,
          });
          const subjectsData = subjectResponse.data.data;
          let filteredSubjects = subjectsData;
          const isFoundationClass = ["8", "9", "10"].some((cls) =>
            selectedClass.toString().includes(cls),
          );
          if (isJeeMode) {
            filteredSubjects = subjectsData.filter((subject) => {
              const sn = subject.subject_name.toLowerCase();
              return (
                sn.includes("jee") ||
                sn.includes("mathematics_mains") ||
                sn.includes("mathematics_advanced") ||
                sn.includes("physics_mains") ||
                sn.includes("chemistry_mains")
              );
            });
            console.log(
              "📐 JEE Subjects:",
              filteredSubjects.map((s) => s.subject_name),
            );
          } else {
            filteredSubjects = subjectsData.filter((subject) => {
              const sn = subject.subject_name.toLowerCase();
              if (
                isFoundationClass &&
                (sn.includes("jee_foundation") || sn.includes("jee foundation"))
              ) {
                return true;
              }
              return !(
                sn.includes("jee") ||
                sn.includes("mathematics_mains") ||
                sn.includes("mathematics_advanced") ||
                sn.includes("physics_mains") ||
                sn.includes("chemistry_mains")
              );
            });
            console.log(
              "📚 Board Subjects:",
              filteredSubjects.map((s) => s.subject_name),
            );
            if (isFoundationClass) {
              console.log(
                "🎯 JEE Foundation enabled for class:",
                selectedClass,
              );
            }
          }
          setSubjects(filteredSubjects);
          if (filteredSubjects.length > 0) {
            const mathSubject = filteredSubjects.find((subject) =>
              subject.subject_name.toLowerCase().includes("math"),
            );
            if (mathSubject) {
              setSelectedSubject(mathSubject.subject_code);
              setSelectedChapters([]);
              setQuestionType("");
              setQuestionLevel("");
              setSelectedWorksheet("");
            } else {
              setSelectedSubject(filteredSubjects[0].subject_code);
              setSelectedChapters([]);
              setQuestionType("");
              setQuestionLevel("");
              setSelectedWorksheet("");
            }
          }
          setSelectedChapters([]);
          setQuestionType("");
          setQuestionLevel("");
          setSelectedWorksheet("");
        } catch (error) {
          console.error("❌ Error fetching subjects:", error);
          console.error("📄 Error details:", error.response?.data);
          setSubjects([]);
        }
      }
    }
    fetchSubjects();
  }, [selectedClass, isJeeMode]);

  // Fetch chapters

  // ── AUTO-FETCH: "Go to Self Study" from QuizResult skips wizard ──────────────
  useEffect(() => {
    if (!autoFetch || !prefillData) return;

    const {
      classCode,
      subjectCode,
      chapterCode,
      subtopics, // string[] of subtopic NAMES (e.g. ["Basic Proportionality Theorem"])
    } = prefillData;

    if (!classCode || !subjectCode || !chapterCode) return;

    // Clear location state so back-navigation doesn't re-trigger
    window.history.replaceState({}, document.title);

    const hasSubtopics = Array.isArray(subtopics) && subtopics.length > 0;

    setIsLoading(true);

    if (hasSubtopics) {
      // ── Step 1: resolve subtopic NAMES → subtopic CODES ──────────────────────
      // The API needs sub_topic_code (numeric array), but boardSelection only
      // stores human-readable sub_topic_names. We call with sub_topic_names: true
      // first to get the full list, then match by name to extract the codes.
      axiosInstance
        .post("/backend/api/updated-subtopic-questions/", {
          classid: classCode,
          subjectid: subjectCode,
          topicid: [chapterCode],
          sub_topic_names: true,
        })
        .then((res) => {
          const allSubtopics = res.data.subtopics || [];
          // allSubtopics: [{ updated_sub_topic_code, updated_sub_topic_name }, ...]

          // Match the stored name strings against the returned list
          const subtopicNameSet = new Set(
            subtopics.map((n) => n.toLowerCase().trim()),
          );

          const matchedCodes = allSubtopics
            .filter((st) =>
              subtopicNameSet.has(
                (st.updated_sub_topic_name || "").toLowerCase().trim(),
              ),
            )
            .map((st) => st.updated_sub_topic_code);

          // If no codes matched (name mismatch), fall back to all subtopics
          const codesToUse =
            matchedCodes.length > 0
              ? matchedCodes
              : allSubtopics.map((st) => st.updated_sub_topic_code);

          // ── Step 2: fetch actual questions with sub_topic_code ────────────────
          return axiosInstance.post(
            "/backend/api/updated-subtopic-questions/",
            {
              classid: classCode,
              subjectid: subjectCode,
              topicid: [chapterCode],
              sub_topic_code: codesToUse, // ← this is what the API expects
            },
          );
        })
        .then((res) => {
          const results = res.data.questions || res.data.results || [];
          const questionsWithImages = results.map((q, idx) => ({
            ...q,
            id: idx,
            question_id: q.id,
            question: q.question,
            context: q.context || null,
            image: q.question_image ? `${q.question_image}` : null,
          }));

          setSelectedClass(classCode);
          setSelectedSubject(subjectCode);
          setSelectedChapters([chapterCode]);
          setQuestionType("subtopics");
          setQuestionList(questionsWithImages);
          setSelectedQuestions([]);
          setPaginationInfo({
            next: res.data.next || null,
            previous: res.data.previous || null,
            count: res.data.count || results.length,
            currentPage: 1,
            totalPages: Math.ceil((res.data.count || results.length) / 15),
            isLoading: false,
          });
          setShowQuestionList(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("autoFetch subtopic error:", err);
          setIsLoading(false);
          showAlert("Failed to load questions. Please try again.", "error");
        });
    } else {
      // ── No subtopics: fetch all questions for the chapter via question-images ──
      axiosInstance
        .post("/question-images/", {
          classid: Number(classCode),
          subjectid: Number(subjectCode),
          topicid: [chapterCode],
          exercise: true,
        })
        .then((res) => {
          const questions = (res.data?.questions || []).map((q, idx) => ({
            ...q,
            id: idx,
            question_id: q.id,
            question: q.question,
            context: q.context || null,
            image: q.question_image ? `${q.question_image}` : null,
          }));

          setSelectedClass(Number(classCode));
          setSelectedSubject(Number(subjectCode));
          setSelectedChapters([chapterCode]);
          setQuestionType("exercise");
          setQuestionList(questions);
          setSelectedQuestions([]);
          setPaginationInfo({
            next: res.data.next || null,
            previous: res.data.previous || null,
            count: res.data.count || questions.length,
            currentPage: 1,
            totalPages: Math.ceil((res.data.count || questions.length) / 15),
            isLoading: false,
          });
          setShowQuestionList(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("autoFetch question-images error:", err);
          setIsLoading(false);
          showAlert("Failed to load questions. Please try again.", "error");
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function fetchChapters() {
      if (selectedSubject && selectedClass) {
        try {
          const chapterResponse = await axiosInstance.post("/chapters/", {
            subject_id: selectedSubject,
            class_id: selectedClass,
          });
          if (chapterResponse.data && chapterResponse.data.data) {
            setChapters(chapterResponse.data.data);
          } else {
            console.warn("⚠ No chapters data found in response");
            setChapters([]);
          }
          setSelectedChapters([]);
          setQuestionType("");
          setQuestionLevel("");
          setSelectedWorksheet("");
        } catch (error) {
          console.error("❌ Error fetching chapters:", error);
          console.error("📄 Error details:", error.response?.data);
          setChapters([]);
        }
      }
    }
    fetchChapters();
  }, [selectedSubject, selectedClass]);

  // Effect for fetching subtopics when External question type is selected
  useEffect(() => {
    async function fetchSubTopics() {
      if (
        questionType === "external" &&
        selectedClass &&
        selectedSubject &&
        selectedChapters.length > 0
      ) {
        try {
          const response = await axiosInstance.post(
            "/question-images-paginator/",
            {
              classid: selectedClass,
              subjectid: selectedSubject,
              topicid: selectedChapters[0],
              external: true,
            },
          );
          setSubTopics(response.data.subtopics || []);
        } catch (error) {
          console.error("Error fetching subtopics:", error);
          setSubTopics([]);
        }
      }
    }
    fetchSubTopics();
  }, [questionType, selectedClass, selectedSubject, selectedChapters]);

  // Effect for fetching worksheets when Worksheets question type is selected
  useEffect(() => {
    async function fetchWorksheets() {
      if (
        questionType === "worksheets" &&
        selectedClass &&
        selectedSubject &&
        selectedChapters.length > 0
      ) {
        try {
          const response = await axiosInstance.post(
            "/question-images-paginator/",
            {
              classid: selectedClass,
              subjectid: selectedSubject,
              topicid: selectedChapters[0],
              worksheets: true,
            },
          );
          setWorksheets(response.data.worksheets || []);
        } catch (error) {
          console.error("Error fetching worksheets:", error);
          setWorksheets([]);
        }
      }
    }
    fetchWorksheets();
  }, [questionType, selectedClass, selectedSubject, selectedChapters]);

  // ── FULL handleWizardSubmit from File 1 (includes _useSubtopicApi path) ──
  const handleWizardSubmit = async (requestData, meta) => {
    try {
      setIsLoading(true);
      console.log("🧙 Wizard submit with:", requestData);

      // ── Class 9 Math subtopics path ──
      if (requestData._useSubtopicApi) {
        const { _useSubtopicApi, ...payload } = requestData;
        console.log("📚 Using updated-subtopic-questions API:", payload);

        const response = await axiosInstance.post(
          "/backend/api/updated-subtopic-questions/",
          payload,
        );

        const results = response.data.questions || response.data.results || [];
        const questionsWithImages = results.map((question, index) => ({
          ...question,
          id: index,
          question_id: question.id,
          question: question.question,
          context: question.context || null,
          image: question.question_image ? `${question.question_image}` : null,
        }));

        setSelectedClass(requestData.classid);
        setSelectedSubject(requestData.subjectid);
        setSelectedChapters(requestData.topicid);
        setQuestionType("subtopics");
        setQuestionLevel("");
        setSelectedWorksheet("");

        setQuestionList(questionsWithImages);
        setSelectedQuestions([]);

        setPaginationInfo({
          next: response.data.next || null,
          previous: response.data.previous || null,
          count: response.data.count || results.length,
          currentPage: 1,
          totalPages: Math.ceil((response.data.count || results.length) / 15),
          isLoading: false,
        });

        setShowQuestionList(true);
        setIsLoading(false);
        return;
      }

      const response = await axiosInstance.post(
        "/question-images/",
        requestData,
      );
      console.log("Questions response:", response.data);

      if (
        response.data &&
        response.data.questions &&
        Array.isArray(response.data.questions)
      ) {
        const questionsWithImages = response.data.questions.map(
          (question, index) => ({
            ...question,
            id: index,
            question_id: question.id,
            question: question.question,
            context: question.context || null,
            image: question.question_image
              ? `${question.question_image}`
              : null,
          }),
        );

        setSelectedClass(meta.selClass.class_code);
        setSelectedSubject(meta.selSub.subject_code);
        setSelectedChapters(meta.selChaps.map((c) => c.topic_code));
        setSubjects([meta.selSub]);
        setChapters(meta.selChaps);
        setQuestionType(meta.selQType.value);
        setQuestionLevel(meta.selLevel || "");
        setSelectedWorksheet(meta.selWS || "");

        setQuestionList(questionsWithImages);
        setSelectedQuestions([]);

        if (response.data.next || response.data.previous) {
          const totalCount = response.data.count || questionsWithImages.length;
          setPaginationInfo({
            next: response.data.next || null,
            previous: response.data.previous || null,
            count: totalCount,
            currentPage: 1,
            totalPages: Math.ceil(totalCount / 15),
            isLoading: false,
          });
        } else {
          setPaginationInfo({
            next: null,
            previous: null,
            count: questionsWithImages.length,
            currentPage: 1,
            totalPages: 1,
            isLoading: false,
          });
        }

        setShowQuestionList(true);
      } else {
        showAlert("No questions available for this selection", "warning");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      showAlert(
        error.response?.data?.message ||
          "Failed to generate questions. Please try again.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isGenerateButtonEnabled()) {
      console.error("Please select all required fields");
      return;
    }
    const requestData = {
      classid: Number(selectedClass),
      subjectid: Number(selectedSubject),
      topicid: selectedChapters,
    };
    if (isScienceSubject()) {
      const selectedQuestionType = QUESTION_TYPE_MAPPING.find(
        (type) => type.value === questionType,
      );
      if (selectedQuestionType) {
        requestData.subtopic = selectedQuestionType.id;
        console.log(
          "🔬 Sending Science request with subtopic:",
          selectedQuestionType.id,
        );
      }
    } else if (isJEEMainsAdvancedSubject()) {
      const idMap = { mcq: "1", nvtq: "2", theorem: "3" };
      if (questionType && idMap[questionType]) {
        requestData.subtopic = idMap[questionType];
        console.log(
          "📐 Sending JEE Mains/Advanced request with subtopic:",
          idMap[questionType],
        );
      }
    } else if (isJEETraditionalSubject()) {
      requestData.solved = questionType === "solved";
      requestData.exercise = questionType === "exercise";
      requestData.subtopic = questionType === "external" ? questionLevel : null;
      requestData.worksheet_name =
        questionType === "worksheets" ? selectedWorksheet : null;
      console.log("📚 Sending JEE Traditional request:", requestData);
    } else {
      requestData.solved = questionType === "solved";
      requestData.exercise = questionType === "exercise";
      requestData.subtopic = questionType === "external" ? questionLevel : null;
      requestData.worksheet_name =
        questionType === "worksheets" ? selectedWorksheet : null;
    }
    try {
      setIsLoading(true);
      console.log("Requesting questions with:", requestData);
      const response = await axiosInstance.post(
        "/question-images/",
        requestData,
      );
      console.log("Questions response:", response.data);
      if (
        response.data &&
        response.data.questions &&
        Array.isArray(response.data.questions)
      ) {
        console.log("Questions found:", response.data.questions.length);
        const questionsWithImages = response.data.questions.map(
          (question, index) => ({
            ...question,
            id: index,
            question_id: question.id,
            question: question.question,
            context: question.context || null,
            image: question.question_image
              ? `${question.question_image}`
              : null,
          }),
        );
        setQuestionList(questionsWithImages);
        setSelectedQuestions([]);
        if (response.data.next || response.data.previous) {
          const pageSize = 15;
          const totalCount = response.data.count || questionsWithImages.length;
          const totalPages = Math.ceil(totalCount / pageSize);
          setPaginationInfo({
            next: response.data.next || null,
            previous: response.data.previous || null,
            count: totalCount,
            currentPage: 1,
            totalPages: totalPages,
            isLoading: false,
          });
        } else {
          setPaginationInfo({
            next: null,
            previous: null,
            count: questionsWithImages.length,
            currentPage: 1,
            totalPages: 1,
            isLoading: false,
          });
        }
        setShowQuestionList(true);
      } else {
        console.error("No questions found in response");
        showAlert("No questions available for this selection", "warning");
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating questions:", error);
      showAlert(
        error.response?.data?.message ||
          "Failed to generate questions. Please try again.",
        "error",
      );
      setIsLoading(false);
    }
  };

  // Fetch paginated questions (for Next/Previous)
  const fetchPaginatedQuestions = async (url) => {
    if (!url) return;
    setPaginationInfo((prev) => ({ ...prev, isLoading: true }));
    try {
      const urlObj = new URL(url);
      const pageNum = parseInt(urlObj.searchParams.get("page")) || 1;
      console.log(`📄 Fetching page ${pageNum}...`);
      const response = await axiosInstance.get(url);
      const rawQuestions =
        response.data.questions || response.data.results || [];
      const questionsWithImages = rawQuestions.map((question, index) => ({
        ...question,
        id: index,
        question_id: question.id,
        question: question.question,
        context: question.context || null,
        image: question.question_image ? `${question.question_image}` : null,
      }));
      setQuestionList(questionsWithImages);
      setSelectedQuestions([]);
      const pageSize = 15;
      const totalCount = response.data.count || questionsWithImages.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      setPaginationInfo({
        next: response.data.next || null,
        previous: response.data.previous || null,
        count: totalCount,
        currentPage: pageNum,
        totalPages: totalPages,
        isLoading: false,
      });
      console.log(`✅ Page ${pageNum} loaded successfully`);
    } catch (error) {
      console.error("❌ Error fetching paginated questions:", error);
      showAlert("Failed to load questions. Please try again.", "error");
      setPaginationInfo((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleNextPage = () => {
    if (paginationInfo.next && !paginationInfo.isLoading) {
      fetchPaginatedQuestions(paginationInfo.next);
    }
  };

  const handlePrevPage = () => {
    if (paginationInfo.previous && !paginationInfo.isLoading) {
      fetchPaginatedQuestions(paginationInfo.previous);
    }
  };

  // Save session data to localStorage
  const saveSessionData = (sessionData) => {
    try {
      const dataToSave = {
        ...sessionData,
        timestamp: new Date().toISOString(),
        username: username,
      };
      localStorage.setItem(
        `lastSession_${username}`,
        JSON.stringify(dataToSave),
      );
      console.log("💾 Session saved:", dataToSave);
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  // Resume learning from last session
  const handleResumeLearning = () => {
    if (!lastSession) return;
    console.log("▶️ Resuming learning from:", lastSession);
    navigate("/solvequestion", {
      state: {
        question: lastSession.question,
        question_id: lastSession.question_id,
        questionNumber: lastSession.questionNumber,
        questionList: lastSession.questionList,
        class_id: lastSession.class_id,
        subject_id: lastSession.subject_id,
        topic_ids: lastSession.topic_ids,
        subtopic: lastSession.subtopic,
        worksheet_id: lastSession.worksheet_id,
        image: lastSession.image,
        context: lastSession.context,
        selectedQuestions: lastSession.selectedQuestions || [],
        isResuming: true,
      },
    });
  };

  // Enhanced question click handler
  const handleQuestionClick = (
    question,
    index,
    image,
    question_id,
    context,
  ) => {
    setShowQuestionList(false);
    const chapterNames = selectedChapters.map((chapterId) => {
      const chapter = chapters.find((ch) => ch.topic_code === chapterId);
      return chapter ? chapter.name : "Unknown Chapter";
    });
    const subjectName =
      subjects.find((s) => s.subject_code === selectedSubject)?.subject_name ||
      "Unknown Subject";
    const sessionData = {
      question,
      question_id: question_id,
      questionNumber: index + 1,
      questionList,
      class_id: selectedClass,
      subject_id: selectedSubject,
      subject_name: subjectName,
      topic_ids: selectedChapters,
      chapter_names: chapterNames,
      subtopic: questionType === "external" ? questionLevel : "",
      worksheet_id: questionType === "worksheets" ? selectedWorksheet : "",
      image,
      context: context || null,
      selectedQuestions: questionList,
      jeeQuestionType: isJEEMainsAdvancedSubject() ? questionType : null,
    };
    saveSessionData(sessionData);
    navigate("/solvequestion", { state: sessionData });
  };

  const handleMultipleSelectSubmit = (selectedQuestionsData) => {
    setSelectedQuestions(selectedQuestionsData);
    setShowQuestionList(false);
    const firstQuestion = selectedQuestionsData[0];
    const chapterNames = selectedChapters.map((chapterId) => {
      const chapter = chapters.find((ch) => ch.topic_code === chapterId);
      return chapter ? chapter.name : "Unknown Chapter";
    });
    const subjectName =
      subjects.find((s) => s.subject_code === selectedSubject)?.subject_name ||
      "Unknown Subject";
    const sessionData = {
      question: firstQuestion.question,
      question_id: firstQuestion.question_id,
      questionNumber: firstQuestion.index + 1,
      questionList,
      class_id: selectedClass,
      subject_id: selectedSubject,
      subject_name: subjectName,
      topic_ids: selectedChapters,
      chapter_names: chapterNames,
      subtopic: questionType === "external" ? questionLevel : "",
      worksheet_id: questionType === "worksheets" ? selectedWorksheet : "",
      image: firstQuestion.image,
      context: firstQuestion.context || null,
      selectedQuestions: selectedQuestionsData,
      jeeQuestionType: isJEEMainsAdvancedSubject() ? questionType : null,
    };
    saveSessionData(sessionData);
    navigate("/solvequestion", { state: sessionData });
  };

  // Reset dependent fields when question type changes
  useEffect(() => {
    if (questionType !== "external") setQuestionLevel("");
    if (questionType !== "worksheets") setSelectedWorksheet("");
  }, [questionType]);

  // Enhanced styles for react-select - MEMOIZED to prevent forced reflow
  const selectStyles = useMemo(
    () => ({
      control: (provided, state) => ({
        ...provided,
        backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
        borderColor: state.isFocused
          ? isDarkMode
            ? "#7c3aed"
            : "#667eea"
          : isDarkMode
            ? "#475569"
            : "#e2e8f0",
        color: isDarkMode ? "#f1f5f9" : "#2d3748",
        minHeight: "56px",
        border: `2px solid ${
          state.isFocused
            ? isDarkMode
              ? "#7c3aed"
              : "#667eea"
            : isDarkMode
              ? "#475569"
              : "#e2e8f0"
        }`,
        borderRadius: "12px",
        boxShadow: state.isFocused
          ? `0 0 0 4px ${isDarkMode ? "rgba(124, 58, 237, 0.1)" : "rgba(102, 126, 234, 0.1)"}`
          : "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: isDarkMode ? "#6366f1" : "#5a67d8",
        },
      }),
      menuPortal: (provided) => ({
        ...provided,
        zIndex: 10000,
        position: "fixed",
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
        zIndex: 10000,
        borderRadius: "12px",
        border: `2px solid ${isDarkMode ? "#7c3aed" : "#667eea"}`,
        boxShadow: isDarkMode
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.9)"
          : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        maxHeight: "500px",
        overflow: "hidden",
        position: "fixed",
        width: "auto",
        minWidth: "450px",
        maxWidth: "600px",
      }),
      menuList: (provided) => ({
        ...provided,
        maxHeight: "470px",
        padding: "12px",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "thin",
        scrollbarColor: `${isDarkMode ? "#7c3aed" : "#667eea"} ${isDarkMode ? "#334155" : "#f8fafc"}`,
        "&::-webkit-scrollbar": { width: "12px" },
        "&::-webkit-scrollbar-track": {
          background: isDarkMode ? "#334155" : "#f8fafc",
          borderRadius: "6px",
          margin: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          background: isDarkMode ? "#7c3aed" : "#667eea",
          borderRadius: "6px",
          border: `2px solid ${isDarkMode ? "#334155" : "#f8fafc"}`,
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: isDarkMode ? "#6366f1" : "#5a67d8",
        },
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused
          ? isDarkMode
            ? "#7c3aed"
            : "#667eea"
          : state.isSelected
            ? isDarkMode
              ? "#6366f1"
              : "#5a67d8"
            : isDarkMode
              ? "#1e293b"
              : "#ffffff",
        color:
          state.isFocused || state.isSelected
            ? "#ffffff"
            : isDarkMode
              ? "#f1f5f9"
              : "#2d3748",
        padding: "16px 20px",
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: state.isSelected ? "600" : "500",
        lineHeight: "1.5",
        whiteSpace: "normal",
        wordWrap: "break-word",
        minHeight: "50px",
        display: "flex",
        alignItems: "center",
        borderBottom: `1px solid ${isDarkMode ? "#475569" : "#f1f5f9"}`,
        transition: "all 0.2s ease",
        position: "relative",
        "&:hover": {
          backgroundColor: isDarkMode ? "#7c3aed" : "#667eea",
          color: "#ffffff",
          transform: "translateX(4px)",
        },
        "&:last-child": { borderBottom: "none" },
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: isDarkMode ? "#6366f1" : "#667eea",
        borderRadius: "8px",
        margin: "3px",
        padding: "2px",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: "#ffffff",
        fontWeight: "600",
        fontSize: "13px",
        padding: "6px 10px",
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: "#ffffff",
        borderRadius: "0 8px 8px 0",
        "&:hover": {
          backgroundColor: "#ef4444",
          color: "#ffffff",
          transform: "scale(1.1)",
        },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: isDarkMode ? "#94a3b8" : "#6b7280",
        fontSize: "15px",
        fontWeight: "500",
      }),
      singleValue: (provided) => ({
        ...provided,
        color: isDarkMode ? "#f1f5f9" : "#2d3748",
        fontSize: "15px",
        fontWeight: "600",
      }),
      dropdownIndicator: (provided, state) => ({
        ...provided,
        color: isDarkMode ? "#94a3b8" : "#6b7280",
        transform: state.selectProps.menuIsOpen
          ? "rotate(180deg)"
          : "rotate(0deg)",
        transition: "transform 0.3s ease",
        "&:hover": {
          color: isDarkMode ? "#7c3aed" : "#667eea",
        },
      }),
      clearIndicator: (provided) => ({
        ...provided,
        color: isDarkMode ? "#94a3b8" : "#6b7280",
        "&:hover": {
          color: isDarkMode ? "#ef4444" : "#dc2626",
        },
      }),
      indicatorSeparator: (provided) => ({
        ...provided,
        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
      }),
    }),
    [isDarkMode],
  );

  return (
    <>
      <AlertContainer />

      {/* Feedback Modal - Auto-shows after 3 mins, only once */}
      <FeedbackBox
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      <div className={isDarkMode ? "dark" : ""}>
        <div className="py-4 sm:py-6 px-3 sm:px-6 max-w-[1400px] mx-auto">
          {/* Grid: Main + Sidebar */}
          <div className="grid grid-cols-1 gap-6">
            {" "}
            {/* ── Main Content ── */}
            <div className="space-y-6">
              {/* Greeting Header */}
              <div className="greeting-content flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="greeting-text">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#0B1120] flex items-center gap-2 flex-wrap">
                    {getTimeBasedGreeting()},{" "}
                    {localStorage.getItem("fullName") || username}!
                    {/* Inline streak badge */}
                    <span className="inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {inlineStreak} day streak
                    </span>
                  </h1>
                  <p
                    className={`text-sm font-semibold mt-1.5 ${
                      isJeeMode ? "text-purple-600" : "text-[#00A0E3]"
                    }`}
                  >
                    {isJeeMode ? "JEE Preparation Mode" : "Board Exam Mode"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-center justify-center px-3 py-2 border border-gray-300 rounded-lg h-10">
                    <span className="text-xs font-semibold text-[#0B1120]">
                      {new Date().toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <button
                    className="tutorial-toggle-btn flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg h-10 hover:text-[#00A0E3] hover:border-[#00A0E3] transition-colors"
                    onClick={() => startTutorialForPage("studentDash")}
                    title="Start Tutorial"
                  >
                    <HelpCircle size={15} />
                    <span>Tutorial</span>
                  </button>
                  <button
                    className="dark-mode-toggle-btn w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#00A0E3] hover:bg-[#00A0E3]/5 transition-colors"
                    onClick={toggleDarkMode}
                    title={
                      isDarkMode
                        ? "Switch to Light Mode"
                        : "Switch to Dark Mode"
                    }
                  >
                    {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
                  </button>
                </div>
              </div>

              {/* Quiz Score Graph */}
              {/* <div className="mt-5 mb-6">
                <QuizScoreGraph />
              </div> */}

              {/* Student Wizard */}
              <div className="learning-adventure-section">
                <StudentWizard
                  username={username}
                  isDarkMode={isDarkMode}
                  isJeeMode={isJeeMode}
                  onReadyToSubmit={handleWizardSubmit}
                  prefill={prefillData}
                />
              </div>

              {/* Resume Learning Card — moved from sidebar */}
              {canResume && lastSession && (
                <div className="resume-learning-section relative overflow-hidden rounded-2xl p-5 border-2 border-[#00A0E3]/30 bg-gradient-to-br from-[#00A0E3] to-[#0070C0] shadow-lg shadow-[#00A0E3]/20 flex flex-col">
                  {/* Glow orb */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 text-white">
                      <Rocket className="w-5 h-5 animate-pulse" />
                      <span className="text-lg font-bold">
                        Continue Learning
                      </span>
                    </div>
                    <div className="text-white/90 text-sm flex flex-wrap gap-4 flex-1">
                      <span>
                        <strong>Subject:</strong>{" "}
                        {lastSession.subject_name || "Unknown"}
                      </span>
                      <span>
                        <strong>Chapter:</strong>{" "}
                        {lastSession.chapter_names?.length > 0
                          ? lastSession.chapter_names[0]
                          : "N/A"}
                      </span>
                      <span>
                        <strong>Progress:</strong> Q{lastSession.questionNumber}{" "}
                        of {lastSession.questionList?.length || 0}
                      </span>
                    </div>
                    <div className="flex gap-2.5 shrink-0">
                      <button
                        onClick={handleResumeLearning}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-[#00A0E3] font-bold text-sm rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                      >
                        <Rocket className="w-4 h-4" />
                        Resume
                      </button>
                      <button
                        onClick={() => {
                          localStorage.removeItem(`lastSession_${username}`);
                          setCanResume(false);
                          setLastSession(null);
                          showAlert("Session cleared successfully", "success");
                        }}
                        className="py-2.5 px-4 text-sm font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-200"
                      >
                        Start Fresh
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Sessions */}
              {role === "student" && <UnifiedSessions />}
            </div>
          </div>
        </div>

        {/* Enhanced Question List Modal */}
        <QuestionListModal
          show={showQuestionList}
          onHide={() => setShowQuestionList(false)}
          questionList={questionList}
          onQuestionClick={handleQuestionClick}
          isMultipleSelect={false}
          onMultipleSelectSubmit={handleMultipleSelectSubmit}
          worksheetName={questionType === "worksheets" ? selectedWorksheet : ""}
          paginationInfo={paginationInfo}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
        />

        {/* Tutorial Component */}
        {shouldShowTutorialForPage("studentDash") && (
          <Tutorial steps={tutorialSteps} onComplete={handleTutorialComplete} />
        )}
      </div>
    </>
  );
}

export default StudentDash;
