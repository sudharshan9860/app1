import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../api/axiosInstance";
import MarkdownWithMath from "./MarkdownWithMath";
import "./QuizMode.css";
import { generateQuestions, fetchCheatsheet } from "../api/quizApi";
import QuizScoreGraph from "./QuizScoreGraph";

// Map of DB typos → correct spelling that the backend's generate-questions API expects
const CHAPTER_NAME_TYPO_MAP = {
  Stroms: "Storms", // PRESSURE_WINDS_STROMS → Storms
  Hormony: "Harmony", // HOW_NATURE_WORKS_IN_HORMONY → Harmony
  Exloring: "Exploring", // EXLORING_THE_INVESTIGATIVE → Exploring
};

const formatChapterName = (raw) => {
  if (!raw) return "";
  let name = raw
    .replace(/^CHAPTER_\d+_/, "") // Remove "CHAPTER_1_" prefix
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/:/g, " ") // Remove colons (backend uses no colons)
    .replace(/\+/g, " ") // Remove plus signs (backend uses no plus)
    .replace(/\s{2,}/g, " ") // Collapse any double spaces
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()) // Title case each word
    .replace(/\b(In|Of|And|The|To|For|A|An)\b/g, (w) => w.toLowerCase())
    .replace(/^./, (c) => c.toUpperCase());

  // Fix known DB typos so the name matches backend's expected chapter list
  Object.entries(CHAPTER_NAME_TYPO_MAP).forEach(([typo, correct]) => {
    name = name.replace(new RegExp(`\\b${typo}\\b`, "g"), correct);
  });

  return name;
};

const QuizMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRetakeFlow = location.state?.isRetakeFromResult || false;
  const retakeConfig = location.state?.retakeConfig || null;

  const [isDark] = useState(() => {
    try {
      return localStorage.getItem("darkMode") === "true";
    } catch {
      return false;
    }
  });

  // ── JEE Foundation mode ──────────────────────────────────────────────
  const [quizMode, setQuizMode] = useState("board"); // "board" | "jee_foundation"

  // JEE Foundation — flat string arrays (chapters come as strings, not objects)
  const [jeeClasses, setJeeClasses] = useState([]); // [6, 8, 9, 10]
  const [jeeSelectedClass, setJeeSelectedClass] = useState(null); // number
  // JEE subject state
  const [jeeSubjects, setJeeSubjects] = useState([]); // e.g. ["JEE_FOUNDATION_MATH", "JEE_FOUNDATION_SCIENCE"]
  const [jeeSelectedSubject, setJeeSelectedSubject] = useState(
    "JEE_FOUNDATION_MATH",
  ); // default
  const [jeeLoadingSubjects, setJeeLoadingSubjects] = useState(false);
  // Stores the quiz-API subject string (e.g. "JEE_FOUNDATION_MATH") separately
  // from jeeSelectedSubject which now holds the Board subject_code after the fix.
  const [jeeSelectedSubjectQuizCode, setJeeSelectedSubjectQuizCode] =
    useState("");
  // Board chapter objects for JEE Foundation [{topic_code, name}]
  const [jeeChapterObjects, setJeeChapterObjects] = useState([]);
  // Selected chapter objects (needed for topic_code in subtopic fetch)
  const [jeeSelectedChapterObjects, setJeeSelectedChapterObjects] = useState(
    [],
  );
  const [jeeChapters, setJeeChapters] = useState([]); // string[]
  const [jeeSelectedChapters, setJeeSelectedChapters] = useState([]); // string[]
  const [jeeSubtopics, setJeeSubtopics] = useState([]); // string[]
  const [jeeSelectedSubtopics, setJeeSelectedSubtopics] = useState([]); // string[]
  const [jeeLoadingClasses, setJeeLoadingClasses] = useState(false);
  const [jeeLoadingChapters, setJeeLoadingChapters] = useState(false);
  const [jeeLoadingSubtopics, setJeeLoadingSubtopics] = useState(false);
  const [jeeChapterFilter, setJeeChapterFilter] = useState("");

  // Difficulty level — only for JEE Foundation
  // null = mixed (no filter), "Easy" | "Medium" | "Hard"
  const [jeeDifficulty, setJeeDifficulty] = useState(null);

  const DIFFICULTY_LEVELS = [
    { value: null, label: "Mixed (all levels)", badge: "—", color: "#64748b" },
    { value: "Easy", label: "Level 1 — Easy", badge: "L1", color: "#16a34a" },
    {
      value: "Medium",
      label: "Level 2 — Medium",
      badge: "L2",
      color: "#d97706",
    },
    { value: "Hard", label: "Level 3 — Hard", badge: "L3", color: "#dc2626" },
  ];

  const ALLOWED_SUBJECTS = ["mathematics", "physics", "chemistry", "science"]; // lowercase for filtering

  const [subjects, setSubjects] = useState([]); // NEW: [{subject_code, subject_name}]
  const [selectedSubjectObj, setSelectedSubjectObj] = useState(null); // NEW: full object
  const [selectedSubject, setSelectedSubject] = useState(""); // keep for UI/display: "MATHEMATICS"

  const [classes, setClasses] = useState([]); // NOW: [{class_code, class_name}]
  const [selectedClass, setSelectedClass] = useState(""); // keep as string for backward compat
  const [selectedClassObj, setSelectedClassObj] = useState(null); // NEW: full object

  const [chapters, setChapters] = useState([]); // NOW: [{topic_code, name}]
  const [selectedChapters, setSelectedChapters] = useState([]); // NOW: full objects [{topic_code, name}]

  const [questionsPerChapter, setQuestionsPerChapter] = useState(5);
  const [chapterFilter, setChapterFilter] = useState("");

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [cheatsheetData, setCheatsheetData] = useState(null);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [loadingCheatsheet, setLoadingCheatsheet] = useState(false);
  const [expandedSheets, setExpandedSheets] = useState({});

  // Previous Learning Path state
  const [showPrevQuizzes, setShowPrevQuizzes] = useState(false);
  const [prevQuizzes, setPrevQuizzes] = useState([]);
  const [loadingPrevQuizzes, setLoadingPrevQuizzes] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [learningAnswers, setLearningAnswers] = useState({});

  const [hasSubtopics, setHasSubtopics] = useState(false);

  const [subtopics, setSubtopics] = useState([]); // NOW: [{updated_sub_topic_code, updated_sub_topic_name}]
  const [selectedSubtopics, setSelectedSubtopics] = useState([]); // NOW: string[] of subtopic NAMES (for generate payload)
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);

  // ── JEE Foundation: fetch classes on mode switch — Board /classes/ API ──
  useEffect(() => {
    if (quizMode !== "jee_foundation") return;
    setJeeLoadingClasses(true);
    setJeeClasses([]);
    setJeeSelectedClass(null);
    setJeeSubjects([]);
    setJeeSelectedSubject("");
    setJeeSelectedSubjectQuizCode("");
    setJeeChapterObjects([]);
    setJeeChapterObjects([]);
    setJeeChapters([]);
    setJeeSelectedChapters([]);
    setJeeSelectedChapterObjects([]);
    setJeeSubtopics([]);
    setJeeSelectedSubtopics([]);
    axiosInstance
      .get("/classes/")
      .then((res) => setJeeClasses(res.data.data || []))
      .catch(() => setJeeClasses([]))
      .finally(() => setJeeLoadingClasses(false));
  }, [quizMode]);

  // ── JEE Foundation: fetch chapters using Board POST /chapters/ ──
  // Same API as Board mode: POST /chapters/ with { class_id, subject_id }
  // jeeSelectedClass = Board class_code, jeeSelectedSubject = Board subject_code
  useEffect(() => {
    if (
      quizMode !== "jee_foundation" ||
      !jeeSelectedClass ||
      !jeeSelectedSubject
    )
      return;
    setJeeChapters([]);
    setJeeChapterObjects([]);
    setJeeSelectedChapters([]);
    setJeeSelectedChapterObjects([]);
    setJeeSubtopics([]);
    setJeeSelectedSubtopics([]);
    setJeeLoadingChapters(true);
    axiosInstance
      .post("/chapters/", {
        class_id: jeeSelectedClass, // Board class_code
        subject_id: jeeSelectedSubject, // Board subject_code
      })
      .then((res) => {
        const data = res.data.data || []; // [{topic_code, name}]
        setJeeChapterObjects(data);
        setJeeChapters(data.map((ch) => ch.name)); // flat string[] for filter/display
      })
      .catch(() => {
        setJeeChapterObjects([]);
        setJeeChapters([]);
      })
      .finally(() => setJeeLoadingChapters(false));
  }, [quizMode, jeeSelectedClass, jeeSelectedSubject]); // eslint-disable-line

  // ── JEE Foundation: fetch subjects using Board POST /subjects/ + test_prep:true ──
  useEffect(() => {
    if (quizMode !== "jee_foundation" || !jeeSelectedClass) return;

    // Reset downstream
    setJeeSubjects([]);
    setJeeSelectedSubject("");
    setJeeSelectedSubjectQuizCode("");
    setJeeChapters([]);
    setJeeSelectedChapters([]);
    setJeeSubtopics([]);
    setJeeSelectedSubtopics([]);
    setJeeLoadingSubjects(true);

    axiosInstance
      .post("/subjects/", {
        class_id: jeeSelectedClass, // Board class_code
        test_prep: true, // returns only JEE Foundation subjects
      })
      .then((res) => {
        const subs = res.data.data || [];
        setJeeSubjects(subs);
        // No auto-select — user must click a subject chip
      })
      .catch(() => setJeeSubjects([]))
      .finally(() => setJeeLoadingSubjects(false));
  }, [quizMode, jeeSelectedClass]); // eslint-disable-line

  // ── JEE Foundation: fetch subtopics using Board POST /backend/api/updated-subtopic-questions/ ──
  // Same API as Board mode. Fires only when exactly 1 chapter is selected.
  useEffect(() => {
    if (quizMode !== "jee_foundation") return;
    if (jeeSelectedChapters.length !== 1) {
      setJeeSubtopics([]);
      setJeeSelectedSubtopics([]);
      return;
    }
    // Find the chapter object to get its topic_code
    const selectedChObj = jeeChapterObjects.find(
      (ch) => ch.name === jeeSelectedChapters[0],
    );
    if (!selectedChObj) return;

    setJeeLoadingSubtopics(true);
    axiosInstance
      .post("/backend/api/updated-subtopic-questions/", {
        classid: jeeSelectedClass, // Board class_code
        subjectid: jeeSelectedSubject, // Board subject_code
        topicid: [selectedChObj.topic_code],
        sub_topic_names: true,
      })
      .then((res) => {
        const subs = res.data.subtopics || [];
        // Store flat string[] of subtopic names (consistent with existing jeeSubtopics usage)
        setJeeSubtopics(subs.map((s) => s.updated_sub_topic_name));
      })
      .catch(() => setJeeSubtopics([]))
      .finally(() => setJeeLoadingSubtopics(false));
  }, [quizMode, jeeSelectedClass, jeeSelectedChapters]); // eslint-disable-line

  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      setClasses([]);
      setSelectedClass("");
      setSelectedClassObj(null);
      setSubjects([]);
      setSelectedSubjectObj(null);
      setSelectedSubject("");
      setChapters([]);
      setSelectedChapters([]);
      setSubtopics([]);
      setSelectedSubtopics([]);
      setError("");
      try {
        const res = await axiosInstance.get("/classes/");
        setClasses(res.data.data || []);
      } catch (e) {
        setError("Failed to load classes.");
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []); // fetch once on mount

  // ── Load quiz history once on mount for "has attempted" detection ──
  useEffect(() => {
    (async () => {
      try {
        const data = await axiosInstance.fetchQuizzes();
        setPrevQuizzes(Array.isArray(data) ? data : []);
      } catch {
        // silently ignore — history is best-effort
      }
    })();
  }, []); // runs once

  // Auto-fill from retake config
  useEffect(() => {
    if (!retakeConfig || classes.length === 0) return;

    // Find and select the class
    const classNum = retakeConfig.classNum;
    const cls = classes.find(
      (c) => c.class_name.replace(/\D/g, "") === String(classNum),
    );
    if (cls) {
      setSelectedClassObj(cls);
      setSelectedClass(cls.class_name.replace(/\D/g, ""));
      // Trigger subject + chapter loading chain
      // (the existing useEffects watching selectedClassObj will handle this)
    }
  }, [retakeConfig, classes]); // eslint-disable-line

  useEffect(() => {
    if (!selectedClassObj || !selectedSubjectObj) {
      setChapters([]);
      setSelectedChapters([]);
      return;
    }

    const loadChapters = async () => {
      setLoadingChapters(true);
      setChapters([]);
      setSelectedChapters([]);
      setSubtopics([]);
      setSelectedSubtopics([]);
      setChapterFilter("");
      setError("");
      try {
        const res = await axiosInstance.post("/chapters/", {
          subject_id: selectedSubjectObj.subject_code,
          class_id: selectedClassObj.class_code,
        });
        setChapters(res.data.data || []); // [{topic_code, name}, ...]
      } catch (e) {
        setError("Failed to load chapters.");
      } finally {
        setLoadingChapters(false);
      }
    };
    loadChapters();
  }, [selectedClassObj, selectedSubjectObj]);

  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    if (!selectedClassObj) {
      setSubjects([]);
      setSelectedSubjectObj(null);
      setSelectedSubject("");
      setChapters([]);
      setSelectedChapters([]);
      return;
    }

    const loadSubjects = async () => {
      setLoadingSubjects(true);
      setSubjects([]);
      setSelectedSubjectObj(null);
      setSelectedSubject("");
      setChapters([]);
      setSelectedChapters([]);
      setSubtopics([]);
      setSelectedSubtopics([]);
      setError("");
      try {
        const res = await axiosInstance.post("/subjects/", {
          class_id: selectedClassObj.class_code,
        });
        const allSubjects = res.data.data || [];
        const EXCLUDED_SUBJECT_CODES = ["222"]; // Mathematics -3 and any future exclusions

        // Filter to only PHYSICS and MATHEMATICS and Science
        const filtered = allSubjects.filter((s) => {
          const name = s.subject_name.toLowerCase();
          return (
            ALLOWED_SUBJECTS.some((allowed) => name.includes(allowed)) &&
            !name.includes("jee") &&
            !name.includes("mains") &&
            !name.includes("advanced") &&
            !name.includes("foundation") &&
            !EXCLUDED_SUBJECT_CODES.includes(s.subject_code)
          );
        });
        setSubjects(filtered);
      } catch (e) {
        setError("Failed to load subjects.");
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, [selectedClassObj]);

  useEffect(() => {
    setSubtopics([]);
    setSelectedSubtopics([]);
    setHasSubtopics(false);

    // Skip JEE mode — it uses its own external API
    if (quizMode === "jee_foundation") return;
    // Skip if selections aren't ready
    if (
      !selectedClassObj ||
      !selectedSubjectObj ||
      selectedChapters.length === 0
    )
      return;
    // Skip explicitly excluded subjects (e.g., Mathematics-3, code 222)
    const EXCLUDED_SUBJECT_CODES = ["222"];
    if (
      EXCLUDED_SUBJECT_CODES.includes(String(selectedSubjectObj.subject_code))
    )
      return;

    const loadSubtopics = async () => {
      setLoadingSubtopics(true);
      try {
        const results = await Promise.all(
          selectedChapters.map((ch) =>
            axiosInstance
              .post("/backend/api/updated-subtopic-questions/", {
                classid: selectedClassObj.class_code,
                subjectid: selectedSubjectObj.subject_code,
                topicid: [ch.topic_code],
                sub_topic_names: true,
              })
              .then((res) => res.data.subtopics || [])
              .catch(() => []),
          ),
        );
        const allSubs = results.flat();
        const uniqueMap = new Map();
        allSubs.forEach((s) => {
          if (!uniqueMap.has(s.updated_sub_topic_code)) {
            uniqueMap.set(s.updated_sub_topic_code, s);
          }
        });
        const deduped = [...uniqueMap.values()];
        setSubtopics(deduped);
        setHasSubtopics(deduped.length > 0); // ← this drives the UI
      } catch (e) {
        setSubtopics([]);
        setHasSubtopics(false);
      } finally {
        setLoadingSubtopics(false);
      }
    };
    loadSubtopics();
  }, [selectedChapters, selectedClassObj, selectedSubjectObj, quizMode]); // eslint-disable-line

  const toggleChapter = useCallback((ch) => {
    setSelectedChapters(
      (prev) =>
        prev.length === 1 && prev[0].topic_code === ch.topic_code
          ? [] // deselect if clicking the same one
          : [ch], // replace with single selection
    );
  }, []);

  const removeChapter = useCallback((ch) => {
    setSelectedChapters((prev) =>
      prev.filter((c) => c.topic_code !== ch.topic_code),
    );
  }, []);

  const filteredChapters = useMemo(() => {
    if (!chapterFilter.trim()) return chapters;
    const q = chapterFilter.toLowerCase();
    return chapters.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [chapters, chapterFilter]);

  const currentStep = !selectedClassObj
    ? 1
    : !selectedSubjectObj
      ? 2
      : selectedChapters.length === 0
        ? 3
        : 4;

  const jeeCurrentStep = !jeeSelectedClass
    ? 1
    : !jeeSelectedSubject
      ? 2
      : jeeSelectedChapters.length === 0
        ? 3
        : 4;

  const totalQuestions = selectedChapters.length * questionsPerChapter;
  const estimatedTime = totalQuestions * 2; // 2 min per question

  const toggleSheet = useCallback((index) => {
    setExpandedSheets((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const handleRevise = async () => {
    if (
      !selectedSubjectObj ||
      !selectedClassObj ||
      selectedChapters.length === 0
    )
      return;
    setLoadingCheatsheet(true);
    setError("");
    try {
      // Backend expects formatted chapter names (no prefix, no colons, no plus, Title Case)
      const chapterNames = selectedChapters.map((ch) =>
        formatChapterName(ch.name),
      );
      const res = await fetchCheatsheet({
        class_num: Number(selectedClassObj.class_name.replace(/\D/g, "")),
        chapters: chapterNames,
        subject: selectedSubject,
      });
      const raw = res.data;
      const sheets = Array.isArray(raw) ? raw : raw.sheets || [];
      const normalized = {
        class_num: Array.isArray(raw) ? Number(selectedClass) : raw.class_num,
        total_sheets: sheets.length,
        sheets,
      };
      setCheatsheetData(normalized);
      setExpandedSheets(Object.fromEntries(sheets.map((_, i) => [i, true])));
      setShowCheatsheet(true);
    } catch (err) {
      // Cheatsheet not available — fall back to direct generate
      console.warn(
        "Cheatsheet not available, generating test directly:",
        err.response?.data?.detail,
      );
      setLoadingCheatsheet(false);
      handleGenerate();
      return;
    } finally {
      setLoadingCheatsheet(false);
    }
  };

  const handlePrevLearningPath = async () => {
    setShowPrevQuizzes(true);
    setSelectedQuiz(null);
    setLearningAnswers({});
    setLoadingPrevQuizzes(true);
    try {
      const data = await axiosInstance.fetchQuizzes();
      setPrevQuizzes(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load previous quizzes.");
    } finally {
      setLoadingPrevQuizzes(false);
    }
  };

  const handleSelectQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setLearningAnswers({});
  };

  const handleLearningAnswer = (qIndex, option) => {
    if (learningAnswers[qIndex]) return; // already answered
    setLearningAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const renderSheetContent = (sheet) => (
    <>
      {sheet.formulas?.length > 0 && (
        <div className="cheatsheet-section">
          <h3 className="cheatsheet-section-title">
            <span className="cheatsheet-section-icon">📐</span>
            Formulas & Rules
            <span className="cheatsheet-section-badge">
              {sheet.formulas.length}
            </span>
          </h3>
          <div className="cheatsheet-cards">
            {sheet.formulas.map((f, i) => (
              <div className="cheatsheet-card formula-card" key={i}>
                <div className="cheatsheet-card-header">{f.name}</div>
                <div className="cheatsheet-card-formula">
                  <MarkdownWithMath content={f.formula} />
                </div>
                <div className="cheatsheet-card-row">
                  <span className="cheatsheet-card-label">When to use</span>
                  <MarkdownWithMath content={f.when_to_use} />
                </div>
                <div className="cheatsheet-card-row example-row">
                  <span className="cheatsheet-card-label">Example</span>
                  <MarkdownWithMath content={f.example} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {sheet.strategies?.length > 0 && (
        <div className="cheatsheet-section">
          <h3 className="cheatsheet-section-title">
            <span className="cheatsheet-section-icon">💡</span>
            Strategies & Tricks
            <span className="cheatsheet-section-badge">
              {sheet.strategies.length}
            </span>
          </h3>
          <div className="cheatsheet-cards">
            {sheet.strategies.map((s, i) => (
              <div className="cheatsheet-card strategy-card" key={i}>
                <div className="cheatsheet-card-header">
                  <MarkdownWithMath content={s.name} />
                </div>
                <div className="cheatsheet-card-row">
                  <span className="cheatsheet-card-label">Trick</span>
                  <MarkdownWithMath content={s.trick} />
                </div>
                <div className="cheatsheet-card-row why-row">
                  <span className="cheatsheet-card-label">
                    Why students miss this
                  </span>
                  <MarkdownWithMath content={s.why_missed} />
                </div>
                <div className="cheatsheet-card-row example-row">
                  <span className="cheatsheet-card-label">Example</span>
                  <MarkdownWithMath content={s.example} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const handleGenerate = async () => {
    if (
      !selectedSubjectObj ||
      !selectedClassObj ||
      selectedChapters.length === 0
    )
      return;
    setGenerating(true);
    setError("");
    try {
      // Backend expects formatted chapter names (no prefix, no colons, no plus, Title Case)
      const chapterNames = selectedChapters.map((ch) =>
        formatChapterName(ch.name),
      );
      const classNum = Number(selectedClassObj.class_name.replace(/\D/g, ""));

      const subtopicsToSend = hasSubtopics
        ? selectedSubtopics.length > 0
          ? selectedSubtopics
          : subtopics.map((st) => st.updated_sub_topic_name)
        : [];

      const payload =
        hasSubtopics && subtopicsToSend.length > 0
          ? {
              class_num: classNum,
              chapters: chapterNames,
              questions_per_chapter: questionsPerChapter,
              subject: selectedSubject,
              sub_topics: subtopicsToSend,
            }
          : {
              class_num: classNum,
              chapters: chapterNames,
              questions_per_chapter: questionsPerChapter,
              subject: selectedSubject,
            };

      const res = await generateQuestions(payload);
      navigate("/quiz-question", {
        state: {
          quizData: res.data,
          classNum: Number(selectedClassObj.class_name.replace(/\D/g, "")),
          selectedChapters: chapterNames,
          questionsPerChapter,
          subject: selectedSubject,
          selectedSubtopics: selectedSubtopics,
          // Board API IDs for Self Study navigation
          boardSelection: {
            classCode: selectedClassObj.class_code,
            className: selectedClassObj.class_name,
            subjectCode: selectedSubjectObj.subject_code,
            subjectName: selectedSubjectObj.subject_name,
            chapterCode: selectedChapters[0]?.topic_code,
            chapterName: formatChapterName(selectedChapters[0]?.name),
            subtopics: hasSubtopics ? selectedSubtopics : [], // pass only if subtopics are involved
          },
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to generate questions. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  };

  // ── JEE Foundation generate handler ──
  const handleJeeGenerate = async () => {
    if (!jeeSelectedClass || jeeSelectedChapters.length === 0) return;
    setGenerating(true);
    setError("");
    try {
      // Extract numeric class number — quiz API expects a number, not a Board class_code string
      const classNum =
        Number(String(jeeSelectedClass).replace(/\D/g, "")) ||
        Number(jeeSelectedClass);

      // Format chapter names for quiz API (strips CHAPTER_N_ prefix, title-cases)
      const formattedChapters = jeeSelectedChapters.map((ch) =>
        formatChapterName(ch),
      );

      const payload = {
        class_num: classNum, // numeric e.g. 8
        chapters: formattedChapters,
        questions_per_chapter: questionsPerChapter,
        subject: jeeSelectedSubjectQuizCode, // quiz-API string e.g. "JEE_FOUNDATION_MATH"
        ...(jeeDifficulty && { difficulty_level: jeeDifficulty }),
        ...(jeeSelectedSubtopics.length > 0 && {
          sub_topics: jeeSelectedSubtopics,
        }),
      };

      const res = await generateQuestions(payload);

      // Build jeeSelection with exact Board IDs for self-study prefill.
      // jeeSelectedClass = Board class_code, jeeSelectedSubject = Board subject_code.
      // jeeSelectedChapterObjects[0].topic_code = Board chapter topic_code.
      const firstChapterObj =
        jeeSelectedChapterObjects[0] ||
        jeeChapterObjects.find((ch) => ch.name === jeeSelectedChapters[0]);

      const jeeSelection = {
        classCode: jeeSelectedClass, // Board class_code e.g. "10"
        subjectCode: jeeSelectedSubject, // Board subject_code e.g. "6"
        subjectName: jeeSelectedSubjectQuizCode, // quiz subject name e.g. "JEE_MATHEMATICS_FOUNDATION"
        chapterCode: firstChapterObj?.topic_code || null, // Board topic_code e.g. "5"
        chapterName: formattedChapters[0] || "", // formatted name e.g. "Matrices and Determinants"
        subtopics: jeeSelectedSubtopics || [], // selected subtopic names
      };

      navigate("/quiz-question", {
        state: {
          quizData: res.data,
          classNum: classNum,
          selectedChapters: formattedChapters,
          questionsPerChapter,
          subject: jeeSelectedSubjectQuizCode,
          selectedSubtopics: jeeSelectedSubtopics,
          isJeeFoundation: true,
          jeeDifficulty: jeeDifficulty,
          jeeSelectedSubject: jeeSelectedSubjectQuizCode,
          jeeSelectedClass: classNum,
          jeeSelection, // ← NEW: Board IDs for self-study
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to generate questions. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  };

  // True when the selected chapter(s) appear in any previously saved quiz
  const hasHistory = useMemo(() => {
    if (selectedChapters.length === 0 || prevQuizzes.length === 0) return false;

    // Collect all chapter names the student has ever attempted
    const attemptedChapterNames = new Set();
    prevQuizzes.forEach((quiz) => {
      const breakdown = quiz.graph_data?.chapter_breakdown || [];
      breakdown.forEach((ch) => {
        if (ch.chapter) attemptedChapterNames.add(ch.chapter.toLowerCase());
      });
    });

    // Check if ANY selected chapter matches attempted history
    return selectedChapters.some((ch) =>
      attemptedChapterNames.has(formatChapterName(ch.name).toLowerCase()),
    );
  }, [selectedChapters, prevQuizzes]);

  // The quiz API subject string = the Board subject_name exactly.
  // e.g. "JEE_MATHEMATICS_FOUNDATION" → send "JEE_MATHEMATICS_FOUNDATION"
  const deriveQuizSubjectCode = (subjectName = "") => subjectName;

  // ── JEE filtered chapters for search ──
  const jeeFilteredChapters = useMemo(() => {
    if (!jeeChapterFilter.trim()) return jeeChapters;
    const q = jeeChapterFilter.toLowerCase();
    return jeeChapters.filter(
      (ch) =>
        formatChapterName(ch).toLowerCase().includes(q) ||
        ch.toLowerCase().includes(q),
    );
  }, [jeeChapters, jeeChapterFilter]);

  return (
    <div className={`quiz-mode-wrapper${isDark ? " dark-mode" : ""}`}>
      <motion.div
        className="quiz-mode-content"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Breadcrumb */}
        <nav className="quiz-breadcrumb">
          <button
            className="quiz-breadcrumb-link"
            onClick={() => navigate("/student-dash")}
          >
            Dashboard
          </button>
          <span className="quiz-breadcrumb-sep">/</span>
          <span className="quiz-breadcrumb-current">Test Prep</span>
        </nav>

        {/* ── HERO BANNER ── */}
        <div className="quiz-mode-hero">
          <div className="quiz-mode-hero-top">
            <div>
              <h1 className="quiz-mode-hero-title">
                Test <span>Prep</span>
              </h1>
              <p className="quiz-mode-hero-subtitle">
                AI-generated MCQs — challenge yourself, track your bridges
              </p>
            </div>
            <div className="quiz-mode-toggle-pill">
              <button
                className={quizMode === "board" ? "active" : ""}
                onClick={() => setQuizMode("board")}
              >
                📚 Board
              </button>
              <button
                className={quizMode === "jee_foundation" ? "active" : ""}
                onClick={() => setQuizMode("jee_foundation")}
              >
                🏆 JEE
              </button>
            </div>
          </div>
          <div className="quiz-mode-hero-meta">
            <span className="quiz-mode-hero-badge">✦ AI-powered MCQs</span>
            <span className="quiz-mode-hero-badge">
              ⚡ Instant bridge analysis
            </span>
            <button
              className="quiz-prev-path-btn-hero"
              onClick={handlePrevLearningPath}
            >
              🔁 Previous Learning Path
            </button>
          </div>
        </div>

        {/* Score Breakdown Graph — wrapped in a card */}
        <div className="quiz-score-graph-card">
          <div className="quiz-score-graph-card-header">
            <span className="quiz-score-graph-card-title">
              📊 Subject-wise Score Breakdown
            </span>
          </div>
          <QuizScoreGraph quizMode={quizMode} />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="quiz-error-msg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <span className="quiz-error-icon">!</span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════
            BOARD MODE WIZARD
        ══════════════════════════════════════════════ */}
        {quizMode === "board" && (
          <>
            {/* Steps indicator */}
            <div className="quiz-steps-wrapper">
              <div className="quiz-steps">
                {[
                  { num: 1, label: "Class", desc: "Select class" },
                  { num: 2, label: "Subject", desc: "Pick subject" },
                  { num: 3, label: "Chapter", desc: "Pick a topic" },
                  ...(hasSubtopics
                    ? [{ num: 4, label: "Subtopics", desc: "Filter subtopics" }]
                    : []),
                ].map((step, i) => (
                  <React.Fragment key={step.num}>
                    {i > 0 && (
                      <div
                        className={`quiz-step-line ${currentStep > step.num - 1 ? "completed" : ""}`}
                      />
                    )}
                    <div
                      className={`quiz-step ${
                        currentStep === step.num
                          ? "active"
                          : currentStep > step.num
                            ? "completed"
                            : ""
                      }`}
                    >
                      <div className="quiz-step-num">
                        {currentStep > step.num ? "✓" : step.num}
                      </div>
                      <div className="quiz-step-text">
                        <span className="quiz-step-label">{step.label}</span>
                        <span className="quiz-step-desc">{step.desc}</span>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {generating ? (
              <div className="quiz-glass-card">
                <div className="quiz-loading-overlay">
                  <div className="quiz-spinner" />
                  <span className="quiz-loading-text">
                    Generating {totalQuestions} questions...
                  </span>
                  <span className="quiz-loading-subtext">
                    AI is crafting bridge-diagnostic questions for{" "}
                    {selectedChapters.length} chapter
                    {selectedChapters.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* ── Section 1: Class Selection ── */}
                <div className="quiz-glass-card">
                  <div className="quiz-section-label">
                    <span className="quiz-section-num">1</span>
                    <span>Select Class</span>
                  </div>
                  {loadingClasses ? (
                    <div className="quiz-empty-state">
                      <div
                        className="quiz-spinner"
                        style={{ margin: "0 auto", width: 32, height: 32 }}
                      />
                    </div>
                  ) : (
                    <select
                      className="quiz-glass-select"
                      value={selectedClassObj?.class_code || ""}
                      onChange={(e) => {
                        const cls = classes.find(
                          (c) => c.class_code === e.target.value,
                        );
                        setSelectedClassObj(cls || null);
                        setSelectedClass(cls?.class_code || "");
                      }}
                    >
                      <option value="">Choose your class...</option>
                      {classes.map((c) => (
                        <option key={c.class_code} value={c.class_code}>
                          {c.class_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* ── Section 2: Subject Selection (after class is selected) ── */}
                {selectedClassObj && (
                  <div className="quiz-glass-card">
                    <div className="quiz-section-label">
                      <span className="quiz-section-num">2</span>
                      <span>Select Subject</span>
                    </div>
                    {loadingSubjects ? (
                      <div className="quiz-empty-state">
                        <div
                          className="quiz-spinner"
                          style={{ margin: "0 auto", width: 32, height: 32 }}
                        />
                      </div>
                    ) : (
                      <div className="quiz-subject-grid">
                        {subjects.map((sub) => {
                          const name = sub.subject_name.toUpperCase();
                          const icon = name.includes("PHYSICS")
                            ? "⚛️"
                            : name.includes("CHEMISTRY")
                              ? "🧪"
                              : name.includes("SCIENCE")
                                ? "🔬"
                                : "📐";
                          return (
                            <motion.button
                              key={sub.subject_code}
                              className={`quiz-subject-chip ${selectedSubjectObj?.subject_code === sub.subject_code ? "selected" : ""}`}
                              onClick={() => {
                                setSelectedSubjectObj(sub);
                                setSelectedSubject(
                                  name.includes("PHYSICS")
                                    ? "PHYSICS"
                                    : name.includes("CHEMISTRY")
                                      ? "CHEMISTRY"
                                      : name.includes("SCIENCE")
                                        ? "SCIENCE"
                                        : "MATHEMATICS",
                                );
                              }}
                              whileTap={{ scale: 0.96 }}
                            >
                              <span className="quiz-subject-icon">{icon}</span>
                              <span>{sub.subject_name}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Section 3: Chapter Selection ── */}
                <AnimatePresence>
                  {selectedClassObj && selectedSubjectObj && (
                    <motion.div className="quiz-glass-card">
                      <div className="quiz-section-label">
                        <span className="quiz-section-num">3</span>
                        <span>Select Chapter</span>
                        {selectedChapters.length === 1 && (
                          <span className="quiz-section-count">1 selected</span>
                        )}
                      </div>

                      {/* Search */}
                      <div className="quiz-chapter-search">
                        <input
                          className="quiz-glass-input"
                          placeholder="Search chapters..."
                          value={chapterFilter}
                          onChange={(e) => setChapterFilter(e.target.value)}
                        />
                      </div>

                      {/* Radio-style chip grid */}
                      {loadingChapters ? (
                        <div className="quiz-empty-state">...</div>
                      ) : (
                        <div className="quiz-chapter-grid">
                          {filteredChapters.map((ch) => {
                            const isSelected =
                              selectedChapters.length === 1 &&
                              selectedChapters[0].topic_code === ch.topic_code;
                            return (
                              <motion.button
                                key={ch.topic_code}
                                className={`quiz-chapter-chip ${isSelected ? "selected" : ""}`}
                                onClick={() => toggleChapter(ch)}
                                whileTap={{ scale: 0.96 }}
                              >
                                <span
                                  className={`quiz-chip-radio ${isSelected ? "visible" : ""}`}
                                />
                                <span className="quiz-chip-text">
                                  {formatChapterName(ch.name)}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {hasSubtopics && selectedChapters.length > 0 && (
                  <motion.div
                    className="quiz-glass-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="quiz-section-label">
                      <span className="quiz-section-num">4</span>
                      <span>Select Subtopics</span>
                      {selectedSubtopics.length > 0 && (
                        <span className="quiz-section-count">
                          {selectedSubtopics.length} selected
                        </span>
                      )}
                    </div>

                    {loadingSubtopics ? (
                      <div className="quiz-empty-state">
                        <div
                          className="quiz-spinner"
                          style={{ margin: "0 auto", width: 32, height: 32 }}
                        />
                      </div>
                    ) : subtopics.length === 0 ? (
                      <div className="quiz-empty-state">
                        <div className="empty-icon">📭</div>
                        <p>No subtopics available for selected chapters.</p>
                      </div>
                    ) : (
                      <>
                        <div className="quiz-chapter-grid">
                          {subtopics.map((st) => (
                            <motion.button
                              key={st.updated_sub_topic_code}
                              className={`quiz-chapter-chip ${selectedSubtopics.includes(st.updated_sub_topic_name) ? "selected" : ""}`}
                              onClick={() =>
                                setSelectedSubtopics((prev) =>
                                  prev.includes(st.updated_sub_topic_name)
                                    ? prev.filter(
                                        (n) => n !== st.updated_sub_topic_name,
                                      )
                                    : [...prev, st.updated_sub_topic_name],
                                )
                              }
                              whileTap={{ scale: 0.96 }}
                            >
                              <span
                                className={`quiz-chip-check ${selectedSubtopics.includes(st.updated_sub_topic_name) ? "visible" : ""}`}
                              >
                                ✓
                              </span>
                              <span className="quiz-chip-text">
                                {st.updated_sub_topic_name}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                        <p
                          style={{
                            marginTop: 8,
                            fontSize: "0.85rem",
                            opacity: 0.7,
                          }}
                        >
                          "leave blank to cover all" ✅
                        </p>
                      </>
                    )}
                  </motion.div>
                )}

                {/* ── Section 4: Action Button ── */}
                <AnimatePresence>
                  {selectedChapters.length > 0 && (
                    <motion.div
                      className="quiz-glass-card"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.35, delay: 0.1 }}
                    >
                      <div className="quiz-action-buttons">
                        {isRetakeFlow ? (
                          <button
                            className="quiz-start-btn"
                            onClick={handleRevise}
                            disabled={loadingCheatsheet || generating}
                            style={{ flex: 1 }}
                          >
                            {loadingCheatsheet ? (
                              <>
                                <div
                                  className="quiz-spinner"
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderWidth: 2,
                                  }}
                                />
                                Loading Cheatsheet...
                              </>
                            ) : (
                              <>
                                <span className="btn-shimmer" />
                                📋 Revise & Start Test
                              </>
                            )}
                          </button>
                        ) : hasHistory ? (
                          <button
                            className="quiz-start-btn"
                            onClick={handleRevise}
                            disabled={loadingCheatsheet || generating}
                            style={{ flex: 1 }}
                          >
                            {loadingCheatsheet ? (
                              <>
                                <div
                                  className="quiz-spinner"
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderWidth: 2,
                                  }}
                                />
                                Loading Cheatsheet...
                              </>
                            ) : (
                              <>
                                <span className="btn-shimmer" />
                                📋 Revise & Start Test
                              </>
                            )}
                          </button>
                        ) : (
                          // Fresh chapter → go directly
                          <button
                            className="quiz-start-btn"
                            onClick={handleGenerate}
                            disabled={generating}
                            style={{ flex: 1 }}
                          >
                            {generating ? (
                              <>
                                <div
                                  className="quiz-spinner"
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderWidth: 2,
                                  }}
                                />
                                Generating...
                              </>
                            ) : (
                              <>
                                <span className="btn-shimmer" />
                                Start Test
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════
            JEE FOUNDATION MODE WIZARD
        ══════════════════════════════════════════════ */}
        {quizMode === "jee_foundation" && (
          <>
            {/* Steps indicator */}
            <div className="quiz-steps-wrapper">
              <div className="quiz-steps">
                {[
                  { num: 1, label: "Class", desc: "Select class" },
                  { num: 2, label: "Subject", desc: "Pick subject" },
                  { num: 3, label: "Chapter", desc: "Pick a topic" },
                  { num: 4, label: "Difficulty", desc: "Choose level" },
                ].map((step, i) => (
                  <React.Fragment key={step.num}>
                    {i > 0 && (
                      <div
                        className={`quiz-step-line ${jeeCurrentStep > step.num - 1 ? "completed" : ""}`}
                      />
                    )}
                    <div
                      className={`quiz-step ${
                        jeeCurrentStep === step.num
                          ? "active"
                          : jeeCurrentStep > step.num
                            ? "completed"
                            : ""
                      }`}
                    >
                      <div className="quiz-step-num">
                        {jeeCurrentStep > step.num ? "✓" : step.num}
                      </div>
                      <div className="quiz-step-text">
                        <span className="quiz-step-label">{step.label}</span>
                        <span className="quiz-step-desc">{step.desc}</span>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {generating ? (
              <div className="quiz-glass-card">
                <div className="quiz-loading-overlay">
                  <div className="quiz-spinner" />
                  <span className="quiz-loading-text">
                    Generating questions...
                  </span>
                  <span className="quiz-loading-subtext">
                    Fetching{" "}
                    {jeeDifficulty
                      ? `Level ${jeeDifficulty}`
                      : "mixed difficulty"}{" "}
                    questions for {jeeSelectedChapters.length} chapter
                    {jeeSelectedChapters.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* ── Step 1: Class ── */}
                <div className="quiz-glass-card">
                  <div className="quiz-section-label">
                    <span className="quiz-section-num">1</span>
                    <span>Select Class</span>
                  </div>
                  {jeeLoadingClasses ? (
                    <div className="quiz-empty-state">
                      <div
                        className="quiz-spinner"
                        style={{ margin: "0 auto", width: 32, height: 32 }}
                      />
                    </div>
                  ) : (
                    <div className="jee-class-grid">
                      {jeeClasses.map((cls) => (
                        <motion.button
                          key={cls.class_code}
                          className={`jee-class-chip ${jeeSelectedClass === cls.class_code ? "selected" : ""}`}
                          onClick={() => setJeeSelectedClass(cls.class_code)}
                          whileTap={{ scale: 0.96 }}
                        >
                          {cls.class_name}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Step 2: Subject ── */}
                <AnimatePresence>
                  {jeeSelectedClass && (
                    <motion.div
                      className="quiz-glass-card"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35 }}
                    >
                      <div className="quiz-section-label">
                        <span className="quiz-section-num">2</span>
                        <span>Select Subject</span>
                      </div>
                      {jeeLoadingSubjects ? (
                        <div
                          className="quiz-spinner"
                          style={{ width: 20, height: 20 }}
                        />
                      ) : (
                        <div className="quiz-chip-row">
                          {jeeSubjects.map((sub) => {
                            const isSel =
                              jeeSelectedSubject === sub.subject_code;
                            return (
                              <motion.button
                                key={sub.subject_code}
                                className={`quiz-chip ${isSel ? "selected" : ""}`}
                                onClick={() => {
                                  setJeeSelectedSubject(sub.subject_code);
                                  setJeeSelectedSubjectQuizCode(
                                    sub.subject_name,
                                  );
                                  setJeeChapterObjects([]);
                                  setJeeChapters([]);
                                  setJeeSelectedChapters([]);
                                  setJeeSelectedChapterObjects([]);
                                  setJeeSelectedSubtopics([]);
                                  setJeeDifficulty(null);
                                }}
                                whileTap={{ scale: 0.97 }}
                              >
                                <span
                                  className={`quiz-chip-check ${isSel ? "visible" : ""}`}
                                >
                                  ✓
                                </span>
                                <span className="quiz-chip-text">
                                  {sub.subject_name}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Step 3: Chapter ── */}
                <AnimatePresence>
                  {jeeSelectedClass && jeeSelectedSubject && (
                    <motion.div
                      className="quiz-glass-card"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                    >
                      <div className="quiz-section-label">
                        <span className="quiz-section-num">2</span>
                        <span>Select Chapter</span>
                        {jeeSelectedChapters.length > 0 && (
                          <span className="quiz-section-count">
                            {jeeSelectedChapters.length} selected
                          </span>
                        )}
                      </div>
                      <div className="quiz-chapter-search">
                        <input
                          className="quiz-glass-input"
                          placeholder="Search chapters..."
                          value={jeeChapterFilter}
                          onChange={(e) => setJeeChapterFilter(e.target.value)}
                        />
                      </div>
                      {jeeLoadingChapters ? (
                        <div className="quiz-empty-state">
                          <div
                            className="quiz-spinner"
                            style={{ margin: "0 auto", width: 32, height: 32 }}
                          />
                        </div>
                      ) : (
                        <div className="quiz-chapter-grid">
                          {jeeFilteredChapters.map((ch) => {
                            const isSelected = jeeSelectedChapters.includes(ch);
                            return (
                              <motion.button
                                key={ch}
                                className={`quiz-chapter-chip ${isSelected ? "selected" : ""}`}
                                onClick={() => {
                                  const newSelected = isSelected
                                    ? jeeSelectedChapters.filter(
                                        (c) => c !== ch,
                                      )
                                    : [...jeeSelectedChapters, ch];
                                  setJeeSelectedChapters(newSelected);
                                  setJeeSelectedChapterObjects(
                                    jeeChapterObjects.filter((obj) =>
                                      newSelected.includes(obj.name),
                                    ),
                                  );
                                  setJeeSelectedSubtopics([]);
                                }}
                                whileTap={{ scale: 0.97 }}
                              >
                                <span
                                  className={`quiz-chip-check ${isSelected ? "visible" : ""}`}
                                >
                                  ✓
                                </span>
                                <span className="quiz-chip-text">
                                  {formatChapterName(ch)}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}

                      {/* Optional subtopics — shown only when exactly 1 chapter selected and subtopics exist */}
                      {jeeSelectedChapters.length === 1 &&
                        jeeSubtopics.length > 0 && (
                          <div style={{ marginTop: 16 }}>
                            <div
                              className="quiz-section-label"
                              style={{
                                marginBottom: 8,
                                fontSize: "0.82rem",
                                opacity: 0.7,
                              }}
                            >
                              Optional: filter by subtopic
                            </div>
                            {jeeLoadingSubtopics ? (
                              <div className="quiz-empty-state">
                                <div
                                  className="quiz-spinner"
                                  style={{
                                    margin: "0 auto",
                                    width: 24,
                                    height: 24,
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="quiz-chapter-grid">
                                {jeeSubtopics.map((st) => {
                                  const isSel =
                                    jeeSelectedSubtopics.includes(st);
                                  return (
                                    <motion.button
                                      key={st}
                                      className={`quiz-chapter-chip ${isSel ? "selected" : ""}`}
                                      style={{ fontSize: "0.78rem" }}
                                      onClick={() =>
                                        setJeeSelectedSubtopics(
                                          isSel
                                            ? jeeSelectedSubtopics.filter(
                                                (s) => s !== st,
                                              )
                                            : [...jeeSelectedSubtopics, st],
                                        )
                                      }
                                      whileTap={{ scale: 0.97 }}
                                    >
                                      <span
                                        className={`quiz-chip-check ${isSel ? "visible" : ""}`}
                                      >
                                        ✓
                                      </span>
                                      <span className="quiz-chip-text">
                                        {st}
                                      </span>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            )}
                            <p
                              style={{
                                marginTop: 6,
                                fontSize: "0.82rem",
                                opacity: 0.6,
                              }}
                            >
                              Leave blank to cover all subtopics ✅
                            </p>
                          </div>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Step 4: Difficulty Level + Start ── */}
                <AnimatePresence>
                  {jeeSelectedChapters.length > 0 && (
                    <motion.div
                      className="quiz-glass-card"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, delay: 0.05 }}
                    >
                      <div className="quiz-section-label">
                        <span className="quiz-section-num">3</span>
                        <span>Select Difficulty Level</span>
                      </div>
                      <div className="jee-difficulty-grid">
                        {DIFFICULTY_LEVELS.map((d) => (
                          <motion.button
                            key={String(d.value)}
                            className={`jee-difficulty-card ${jeeDifficulty === d.value ? "selected" : ""}`}
                            onClick={() => setJeeDifficulty(d.value)}
                            whileTap={{ scale: 0.97 }}
                          >
                            <span
                              className="jee-diff-badge"
                              style={{ background: d.color }}
                            >
                              {d.badge}
                            </span>
                            <span className="jee-diff-label">{d.label}</span>
                          </motion.button>
                        ))}
                      </div>

                      {/* Start button */}
                      <div style={{ marginTop: 20 }}>
                        <button
                          className="quiz-start-btn"
                          onClick={handleJeeGenerate}
                          disabled={generating}
                          style={{ width: "100%" }}
                        >
                          {generating ? (
                            <>
                              <div
                                className="quiz-spinner"
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderWidth: 2,
                                }}
                              />
                              Generating...
                            </>
                          ) : (
                            <>
                              <span className="btn-shimmer" />
                              Start Test
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </>
        )}
      </motion.div>

      {/* Previous Learning Path modal */}
      {createPortal(
        <AnimatePresence>
          {showPrevQuizzes && (
            <motion.div
              className={`cheatsheet-overlay prev-quiz-overlay${isDark ? " dark-mode" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPrevQuizzes(false);
                setSelectedQuiz(null);
              }}
            >
              <motion.div
                className="cheatsheet-modal prev-quiz-modal"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cheatsheet-header">
                  <div className="cheatsheet-title-row">
                    <div>
                      <h2>
                        {selectedQuiz
                          ? selectedQuiz.name
                          : "Previous Learning Paths"}
                      </h2>
                      <p>
                        {selectedQuiz
                          ? `${selectedQuiz.questions?.length || 0} questions · ${new Date(selectedQuiz.created_at).toLocaleDateString()}`
                          : `${prevQuizzes.length} quiz${prevQuizzes.length !== 1 ? "zes" : ""} found`}
                      </p>
                    </div>
                  </div>
                  <button
                    className="cheatsheet-close"
                    onClick={() => {
                      setShowPrevQuizzes(false);
                      setSelectedQuiz(null);
                    }}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>

                <div className="cheatsheet-body">
                  {loadingPrevQuizzes ? (
                    <div className="quiz-empty-state">
                      <div
                        className="quiz-spinner"
                        style={{ margin: "0 auto", width: 36, height: 36 }}
                      />
                      <p style={{ marginTop: 12 }}>Loading quizzes...</p>
                    </div>
                  ) : !selectedQuiz ? (
                    /* Quiz list view */
                    prevQuizzes.length === 0 ? (
                      <div className="quiz-empty-state">
                        <div className="empty-icon">📭</div>
                        <p>No previous quizzes found</p>
                      </div>
                    ) : (
                      <div className="prev-quiz-list">
                        {prevQuizzes.map((quiz) => (
                          <button
                            key={quiz.id}
                            className="prev-quiz-item"
                            onClick={() => handleSelectQuiz(quiz)}
                            disabled={
                              !quiz.questions || quiz.questions.length === 0
                            }
                          >
                            <div className="prev-quiz-item-top">
                              <span className="prev-quiz-name">
                                {quiz.name}
                              </span>
                              {quiz.analysis?.score_pct != null && (
                                <span
                                  className={`prev-quiz-score ${quiz.analysis.score_pct >= 70 ? "good" : quiz.analysis.score_pct >= 40 ? "mid" : "low"}`}
                                >
                                  {Math.round(quiz.analysis.score_pct)}%
                                </span>
                              )}
                            </div>
                            <div className="prev-quiz-item-meta">
                              <span>
                                {quiz.questions?.length || 0} questions
                              </span>
                              <span>&middot;</span>
                              <span>
                                {new Date(quiz.created_at).toLocaleDateString()}
                              </span>
                              {quiz.analysis?.correct != null && (
                                <>
                                  <span>&middot;</span>
                                  <span>
                                    {quiz.analysis.correct}/
                                    {quiz.analysis.total} correct
                                  </span>
                                </>
                              )}
                            </div>
                            {(!quiz.questions ||
                              quiz.questions.length === 0) && (
                              <span className="prev-quiz-no-q">
                                No questions available
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    /* Learning mode view */
                    <div className="learning-mode-questions">
                      {selectedQuiz.questions.map((q, idx) => {
                        const answered = learningAnswers[idx];
                        const isCorrect = answered === q.correct_answer;
                        return (
                          <div className="learning-q-card" key={idx}>
                            <div className="learning-q-header">
                              <span className="learning-q-num">Q{idx + 1}</span>
                              <span className="learning-q-chapter">
                                {q.chapter}
                              </span>
                              {q.difficulty && (
                                <span
                                  className={`learning-q-diff ${q.difficulty.toLowerCase()}`}
                                >
                                  {q.difficulty}
                                </span>
                              )}
                            </div>
                            <div className="learning-q-text">
                              <MarkdownWithMath content={q.question} />
                            </div>
                            <div className="learning-q-options">
                              {Object.entries(q.options).map(([key, val]) => {
                                let optClass = "learning-opt";
                                if (answered) {
                                  if (key === q.correct_answer)
                                    optClass += " correct";
                                  else if (key === answered && !isCorrect)
                                    optClass += " wrong";
                                  else optClass += " dimmed";
                                }
                                return (
                                  <button
                                    key={key}
                                    className={optClass}
                                    onClick={() =>
                                      handleLearningAnswer(idx, key)
                                    }
                                    disabled={!!answered}
                                  >
                                    <span className="learning-opt-key">
                                      {key}
                                    </span>
                                    <span className="learning-opt-val">
                                      <MarkdownWithMath content={val} />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            {answered && (
                              <motion.div
                                className={`learning-feedback ${isCorrect ? "correct" : "wrong"}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                              >
                                <span className="learning-feedback-icon">
                                  {isCorrect ? "✓" : "✗"}
                                </span>
                                <div className="learning-feedback-text">
                                  <strong>
                                    {isCorrect
                                      ? "Correct!"
                                      : `Incorrect — Answer: ${q.correct_answer}`}
                                  </strong>
                                  {q.solution && (
                                    <div className="learning-solution">
                                      <MarkdownWithMath content={q.solution} />
                                    </div>
                                  )}
                                  <strong>Trap warning</strong>
                                  {q.trap_warning && (
                                    <div className="learning-solution">
                                      <MarkdownWithMath
                                        content={q.trap_warning}
                                      />
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                      <div className="learning-progress-bar">
                        <div
                          className="learning-progress-fill"
                          style={{
                            width: `${(Object.keys(learningAnswers).length / selectedQuiz.questions.length) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="learning-progress-text">
                        {Object.keys(learningAnswers).length} /{" "}
                        {selectedQuiz.questions.length} answered
                        {Object.keys(learningAnswers).length ===
                          selectedQuiz.questions.length && (
                          <span className="learning-score">
                            &nbsp;&middot;&nbsp;Score:{" "}
                            {
                              Object.entries(learningAnswers).filter(
                                ([i, a]) =>
                                  a ===
                                  selectedQuiz.questions[i].correct_answer,
                              ).length
                            }
                            /{selectedQuiz.questions.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="cheatsheet-footer">
                  {selectedQuiz ? (
                    <>
                      <button
                        className="cheatsheet-done-btn"
                        onClick={() => {
                          setSelectedQuiz(null);
                          setLearningAnswers({});
                        }}
                      >
                        Back to List
                      </button>
                      <button
                        className="cheatsheet-done-btn"
                        onClick={() => {
                          setShowPrevQuizzes(false);
                          setSelectedQuiz(null);
                        }}
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <button
                      className="cheatsheet-done-btn"
                      onClick={() => setShowPrevQuizzes(false)}
                      style={{ flex: 1 }}
                    >
                      Close
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* Cheatsheet modal rendered via portal */}
      {createPortal(
        <AnimatePresence>
          {showCheatsheet && cheatsheetData && (
            <motion.div
              className={`cheatsheet-overlay${isDark ? " dark-mode" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheatsheet(false)}
            >
              <motion.div
                className="cheatsheet-modal"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cheatsheet-header">
                  <div className="cheatsheet-title-row">
                    <span className="cheatsheet-icon">📋</span>
                    <div>
                      <h2>Revision Cheatsheet</h2>
                      <p>
                        Class {cheatsheetData.class_num} &middot;{" "}
                        {cheatsheetData.total_sheets} chapter
                        {cheatsheetData.total_sheets > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    className="cheatsheet-close"
                    onClick={() => setShowCheatsheet(false)}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>

                <div className="cheatsheet-body">
                  {cheatsheetData.sheets.map((sheet, idx) => (
                    <div className="cheatsheet-chapter" key={idx}>
                      <button
                        className={`cheatsheet-chapter-toggle ${expandedSheets[idx] ? "expanded" : ""}`}
                        onClick={() => toggleSheet(idx)}
                      >
                        <span className="cheatsheet-chapter-num">
                          Ch {sheet.chapter_num}
                        </span>
                        <span className="cheatsheet-chapter-name">
                          {sheet.chapter}
                        </span>
                        <span className="cheatsheet-chapter-meta">
                          {sheet.formulas?.length || 0} formulas &middot;{" "}
                          {sheet.strategies?.length || 0} strategies
                        </span>
                        <span
                          className={`cheatsheet-chevron ${expandedSheets[idx] ? "open" : ""}`}
                        >
                          &#9662;
                        </span>
                      </button>

                      {expandedSheets[idx] && (
                        <div className="cheatsheet-chapter-content">
                          {renderSheetContent(sheet)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="cheatsheet-footer">
                  <button
                    className="cheatsheet-done-btn"
                    onClick={() => setShowCheatsheet(false)}
                  >
                    Done Revising
                  </button>
                  <button
                    className="cheatsheet-start-btn"
                    onClick={() => {
                      setShowCheatsheet(false);
                      handleGenerate();
                    }}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <div
                          className="quiz-spinner"
                          style={{ width: 18, height: 18, borderWidth: 2 }}
                        />
                        Generating...
                      </>
                    ) : (
                      <>
                        <span className="btn-shimmer" />
                        Start Test
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

export default QuizMode;
