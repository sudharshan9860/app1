// StudentWizard.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../api/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faRocket,
  faSpinner,
  faChevronRight,
  faPen,
} from "@fortawesome/free-solid-svg-icons";

// ─── Subject-type helpers (unchanged from original) ───────────────────────────
const isJEEMainsAdv = (n = "") => {
  const s = n.toLowerCase();
  return s.includes("mathematics_mains") || s.includes("mathematics_advanced");
};
const isScience = (n = "") => n.toLowerCase().includes("science");

// Subjects that get the "Choose Path" (subtopics OR question-type) step
// • Mathematics: classes 6–12 (non-JEE)
// • Science: classes 6–10
// • Physics / Chemistry: classes 11–12 (non-JEE)
const isSubtopicPathSubject = (cls, sub) => {
  if (!cls || !sub) return false;
  const classNum = parseInt(
    (cls.class_name || cls.class_code || "").toString().replace(/\D/g, ""),
    10,
  );
  if (isNaN(classNum) || classNum < 6 || classNum > 12) return false;

  const subName = (sub.subject_name || "").toLowerCase();
  const isJEE =
    subName.includes("jee") ||
    subName.includes("mains") ||
    subName.includes("advanced");
  if (isJEE) return false;

  const isMath =
    (subName.includes("mathematics") || subName.includes("math")) &&
    classNum >= 6 &&
    classNum <= 12;
  const isSci = subName.includes("science") && classNum >= 6 && classNum <= 10;
  const isPhyChem =
    (subName.includes("physics") || subName.includes("chemistry")) &&
    classNum >= 11 &&
    classNum <= 12;

  return isMath || isSci || isPhyChem;
};

const isPhysics = (n = "") => {
  const s = n.toLowerCase();
  return (
    s.includes("physics") &&
    !s.includes("jee") &&
    !s.includes("mains") &&
    !s.includes("advanced")
  );
};

const isChemistry = (n = "") => {
  const s = n.toLowerCase();
  return (
    s.includes("chemistry") &&
    !s.includes("jee") &&
    !s.includes("mains") &&
    !s.includes("advanced")
  );
};

const SCIENCE_TYPES = [
  {
    id: "1",
    value: "activity_based_questions",
    label: "Activity Based",
    icon: "🧪",
  },
  { id: "2", value: "conceptual_questions", label: "Conceptual", icon: "💡" },
  {
    id: "3",
    value: "diagram_based_questions",
    label: "Diagram Based",
    icon: "🖼️",
  },
  { id: "4", value: "fill_in_the_blanks", label: "Fill in Blanks", icon: "✏️" },
  { id: "5", value: "matching_questions", label: "Matching", icon: "🔗" },
  { id: "6", value: "t_f_questions", label: "True / False", icon: "✅" },
];
const JEE_MAINS_TYPES = [
  { id: "1", value: "mcq", label: "MCQ", icon: "🎯" },
  { id: "2", value: "nvtq", label: "Numerical (NVTQ)", icon: "🔢" },
  { id: "3", value: "theorem", label: "Theorem Based", icon: "📐" },
];
const BOARD_TYPES = [
  { value: "solved", label: "Solved Examples", icon: "📖" },
  { value: "external", label: "Book Exercises", icon: "📝" },
  { value: "worksheets", label: "Worksheets", icon: "📋" },
];

const STEP_LABELS = ["Class", "Subject", "Chapters", "Question Type"];

// ─── Framer Motion variants ────────────────────────────────────────────────────
const sectionVariants = {
  hidden: { opacity: 0, y: 44 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.22 } },
};
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: "easeOut" },
  },
};

// ─── Tiny helpers ──────────────────────────────────────────────────────────────
const extractClassFromUsername = (u = "") => {
  const f2 = u.substring(0, 2);
  if (!isNaN(f2) && f2 !== "") return f2;
  const f1 = u.charAt(0);
  if (!isNaN(f1) && f1 !== "") return f1;
  return "";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Progress stepper bar at the top
function WizardProgress({ activeStep, completedSteps, dark, labels }) {
  const accent = dark ? "#a78bfa" : "#667eea";
  const okColor = dark ? "#34d399" : "#10b981";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 32,
        userSelect: "none",
      }}
    >
      {labels.map((label, i) => {
        const done = completedSteps.includes(i);
        const active = i === activeStep;
        return (
          <React.Fragment key={label}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 60,
              }}
            >
              {/* Circle */}
              <motion.div
                animate={{
                  background: done
                    ? okColor
                    : active
                      ? accent
                      : dark
                        ? "rgba(255,255,255,0.08)"
                        : "#e2e8f0",
                  scale: active ? 1.18 : 1,
                  boxShadow: active ? `0 0 0 6px ${accent}33` : "none",
                }}
                transition={{ duration: 0.35 }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: done || active ? "#fff" : dark ? "#64748b" : "#94a3b8",
                }}
              >
                {done ? (
                  <FontAwesomeIcon icon={faCheck} style={{ fontSize: 13 }} />
                ) : (
                  i + 1
                )}
              </motion.div>
              {/* Label */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  marginTop: 5,
                  color: done
                    ? okColor
                    : active
                      ? accent
                      : dark
                        ? "#475569"
                        : "#94a3b8",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </div>
            {/* Connector */}
            {i < labels.length - 1 && (
              <motion.div
                animate={{
                  background: completedSteps.includes(i)
                    ? okColor
                    : dark
                      ? "rgba(255,255,255,0.08)"
                      : "#e2e8f0",
                }}
                transition={{ duration: 0.5 }}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  marginBottom: 16,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Section title with animated underline
function StepTitle({ children, dark }) {
  const accent = dark ? "#a78bfa" : "#667eea";
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{ marginBottom: 20 }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 800,
          margin: 0,
          color: dark ? "#f1f5f9" : "#0f172a",
          letterSpacing: "-0.02em",
        }}
      >
        {children}
      </h3>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "60px" }}
        transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
        style={{ height: 3, background: accent, borderRadius: 2, marginTop: 6 }}
      />
    </motion.div>
  );
}

// Confirmed selection badge (clickable to go back)
function ConfirmedBadge({ label, icon, onClick, dark }) {
  const okColor = dark ? "#34d399" : "#10b981";
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px 4px 8px",
        borderRadius: 30,
        background: dark ? "rgba(52,211,153,0.1)" : "rgba(16,185,129,0.08)",
        border: `1px solid ${okColor}44`,
        color: okColor,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        outline: "none",
      }}
    >
      <FontAwesomeIcon icon={faCheck} style={{ fontSize: 10 }} />
      {icon && <span>{icon}</span>}
      {label}
      <FontAwesomeIcon icon={faPen} style={{ fontSize: 9, opacity: 0.6 }} />
    </motion.button>
  );
}

// Spinner inside a step
function StepSpinner({ label, dark }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "20px 0",
        color: dark ? "#64748b" : "#94a3b8",
      }}
    >
      <FontAwesomeIcon icon={faSpinner} spin />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// Pill / chip button
function Pill({ label, icon, selected, onClick, dark, size = "md" }) {
  const accent = dark ? "#a78bfa" : "#667eea";
  const accentBg = dark ? "rgba(124,58,237,0.2)" : "rgba(102,126,234,0.1)";
  const isLg = size === "lg";
  return (
    <motion.button
      variants={itemVariants}
      whileHover={{
        y: -3,
        boxShadow: selected
          ? `0 10px 28px ${accent}44`
          : "0 6px 16px rgba(0,0,0,0.12)",
      }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        padding: isLg ? "13px 28px" : "10px 18px",
        borderRadius: 30,
        cursor: "pointer",
        border: selected
          ? `2px solid ${accent}`
          : `1.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        background: selected
          ? `linear-gradient(135deg, ${dark ? "#7c3aed" : "#667eea"}, ${dark ? "#6366f1" : "#764ba2"})`
          : dark
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.9)",
        color: selected ? "#fff" : dark ? "#cbd5e1" : "#334155",
        fontSize: isLg ? 15 : 13,
        fontWeight: selected ? 700 : 500,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        boxShadow: selected
          ? `0 6px 20px ${accent}44`
          : "0 2px 6px rgba(0,0,0,0.05)",
        outline: "none",
        backdropFilter: "blur(8px)",
        transition: "background 0.25s, border 0.25s, color 0.25s",
        userSelect: "none",
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
      {selected && <FontAwesomeIcon icon={faCheck} style={{ fontSize: 11 }} />}
    </motion.button>
  );
}

// Card-style question type tile
function QTypeCard({ opt, selected, onClick, dark }) {
  const accent = dark ? "#a78bfa" : "#667eea";
  const accentBg = dark ? "rgba(124,58,237,0.18)" : "rgba(102,126,234,0.08)";
  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ y: -4, boxShadow: `0 14px 32px ${accent}33` }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        padding: "22px 16px",
        borderRadius: 18,
        border: selected
          ? `2px solid ${accent}`
          : `1.5px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
        background: selected
          ? accentBg
          : dark
            ? "rgba(255,255,255,0.03)"
            : "#fafafa",
        cursor: "pointer",
        textAlign: "center",
        outline: "none",
        boxShadow: selected
          ? `0 0 0 1px ${accent}44, 0 8px 24px ${accent}22`
          : "none",
        backdropFilter: "blur(12px)",
        transition: "background 0.25s, border 0.25s",
      }}
    >
      <div style={{ fontSize: 30, marginBottom: 10 }}>{opt.icon}</div>
      <div
        style={{
          fontSize: 13,
          fontWeight: selected ? 700 : 500,
          color: selected ? accent : dark ? "#94a3b8" : "#475569",
          lineHeight: 1.3,
        }}
      >
        {opt.label}
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ marginTop: 8 }}
        >
          <FontAwesomeIcon
            icon={faCheck}
            style={{ color: accent, fontSize: 12 }}
          />
        </motion.div>
      )}
    </motion.button>
  );
}

// Glass card wrapper for each section
function GlassSection({ children, dark }) {
  return (
    <div
      style={{
        background: dark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderRadius: 20,
        padding: "28px 26px",
        border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
        boxShadow: dark
          ? "0 8px 40px rgba(0,0,0,0.4)"
          : "0 4px 28px rgba(0,0,0,0.07)",
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function StudentWizard({
  username = "",
  isDarkMode = false,
  isJeeMode = false,
  onReadyToSubmit,
  prefill = null, // ← ADD
}) {
  const dark = isDarkMode;

  // Selections
  const [selClass, setSelClass] = useState(null);
  const [selSub, setSelSub] = useState(null);
  const [selChaps, setSelChaps] = useState([]);
  const [selQType, setSelQType] = useState(null);
  const [selLevel, setSelLevel] = useState(null);
  const [selWS, setSelWS] = useState(null);

  // API data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [qtOpts, setQtOpts] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [worksheets, setWorksheets] = useState([]);

  // Loading flags
  const [loadSub, setLoadSub] = useState(false);
  const [loadCh, setLoadCh] = useState(false);
  const [loadQT, setLoadQT] = useState(false);

  // ── Subtopic-path state (Math 6-12, Science 6-10, Physics/Chemistry 11-12) ──
  const [subtopicList, setSubtopicList] = useState([]); // fetched subtopic list
  const [selSubtopics, setSelSubtopics] = useState([]); // selected codes (multi)
  const [loadingSubtopicList, setLoadingSubtopicList] = useState(false); // loading flag
  const [subtopicPath, setSubtopicPath] = useState(null); // "subtopics" | "questionType" | null

  // subtopicList is set after confirmChapters runs.
  // Show "Choose Path" label only if subtopics actually loaded.
  const stepLabels =
    subtopicList.length > 0
      ? ["Class", "Subject", "Chapter", "Choose Path"]
      : STEP_LABELS;

  // Which steps are "done" (for stepper)
  const completedSteps = [
    selClass && 0,
    selSub && 1,
    selChaps.length && 2,
    subtopicList.length > 0
      ? (subtopicPath === "subtopics" && selSubtopics.length > 0) ||
        (subtopicPath === "questionType" && selQType)
        ? 3
        : null
      : selQType && 3,
  ].filter((s) => s !== null && s !== false && s !== undefined);

  const activeStep = selQType
    ? 3
    : selChaps.length
      ? 3
      : selSub
        ? 2
        : selClass
          ? 1
          : 0;

  // Refs for smooth scroll-into-view on reveal
  const subjectRef = useRef(null);
  const chapterRef = useRef(null);
  const qtypeRef = useRef(null);
  const beginRef = useRef(null);
  const subtopicPathRef = useRef(null); // scroll target for the path-choice step

  const scrollTo = (ref) => {
    setTimeout(
      () =>
        ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      80,
    );
  };

  // ── On mount: fetch classes, auto-detect from username ─────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/classes/");
        let data = res.data.data || [];
        if (isJeeMode)
          data = data.filter(
            (c) => c.class_name.includes("11") || c.class_name.includes("12"),
          );
        setClasses(data);
        // Skip username auto-detection if prefill is provided
        // (prefill will handle class selection via the stage-based chain)
        if (!prefill) {
          const def = extractClassFromUsername(username);
          if (def) {
            const m = data.find(
              (c) => c.class_name.includes(def) || c.class_code === def,
            );
            if (m) pickClass(m);
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [username, isJeeMode]); // eslint-disable-line

  // ════════════════════════════════════════════════════════════════════
  // AUTO-PREFILL FROM TEST PREP → "Go to Self Study"
  // Uses a stage ref to drive the chain: class → subject → chapter → confirm → subtopics
  // Each stage waits for its async data to arrive, then advances to the next.
  // ════════════════════════════════════════════════════════════════════
  const prefillAppliedRef = useRef(false);
  const prefillStageRef = useRef(0);
  // Stages: 0 = waiting for class, 1 = waiting for subjects, 2 = waiting for chapters,
  //          3 = chapter set → need to call confirmChapters,
  //          4 = waiting for subtopics/qtOpts, 5 = done

  // Stage 0 → 1: Pick class
  useEffect(() => {
    if (!prefill || classes.length === 0) return;
    if (prefillStageRef.current !== 0) return;

    const cls = classes.find((c) => c.class_code === prefill.classCode);
    if (cls) {
      prefillAppliedRef.current = true;
      prefillStageRef.current = 1;
      pickClass(cls); // this fetches subjects
    }
  }, [prefill, classes]); // eslint-disable-line

  // Stage 1 → 2: Pick subject
  useEffect(() => {
    if (!prefillAppliedRef.current || subjects.length === 0) return;
    if (prefillStageRef.current !== 1) return;

    const sub = subjects.find((s) => s.subject_code === prefill.subjectCode);
    if (sub) {
      prefillStageRef.current = 2;
      pickSubject(sub); // this fetches chapters
    }
  }, [prefill, subjects]); // eslint-disable-line

  // Stage 2 → 3: Select chapter + auto-call confirmChapters
  useEffect(() => {
    if (!prefillAppliedRef.current || chapters.length === 0) return;
    if (prefillStageRef.current !== 2) return;

    const ch = chapters.find((c) => c.topic_code === prefill.chapterCode);
    if (ch) {
      prefillStageRef.current = 3;
      setSelChaps([ch]);
      // confirmChapters reads selChaps from state, but we just called setSelChaps
      // so we need to wait for the next render. Use a ref flag instead.
    }
  }, [prefill, chapters]); // eslint-disable-line

  // Stage 3: Actually call confirmChapters once selChaps is set
  useEffect(() => {
    if (prefillStageRef.current !== 3) return;
    if (selChaps.length === 0) return; // wait for state to update

    prefillStageRef.current = 4; // move to "waiting for subtopics/qtOpts"
    // Small delay to let React commit the state
    const timer = setTimeout(() => {
      confirmChapters();
    }, 50);
    return () => clearTimeout(timer);
  }, [selChaps]); // eslint-disable-line

  // Stage 4a: If subtopics loaded — auto-select subtopics path + codes
  useEffect(() => {
    if (prefillStageRef.current !== 4) return;
    if (subtopicList.length === 0) return; // still loading, or none available

    setSubtopicPath("subtopics");

    if (prefill?.subtopics?.length > 0) {
      const matchedCodes = subtopicList
        .filter((st) =>
          prefill.subtopics.some(
            (name) =>
              st.updated_sub_topic_name === name ||
              st.updated_sub_topic_name?.toLowerCase() === name?.toLowerCase(),
          ),
        )
        .map((st) => st.updated_sub_topic_code);
      setSelSubtopics(
        matchedCodes.length > 0
          ? matchedCodes
          : [subtopicList[0].updated_sub_topic_code],
      );
    } else {
      setSelSubtopics([subtopicList[0].updated_sub_topic_code]);
    }

    prefillStageRef.current = 5;
  }, [prefill, subtopicList]); // eslint-disable-line

  // Stage 4b: No subtopics available — fall back to question type
  useEffect(() => {
    if (prefillStageRef.current !== 4) return;
    if (subtopicList.length > 0) return; // handled by 4a
    if (loadingSubtopicList) return; // still fetching, wait
    if (qtOpts.length === 0) return; // question types not ready yet

    pickQType(qtOpts[0]);
    prefillStageRef.current = 5;
  }, [prefill, subtopicList, loadingSubtopicList, qtOpts]); // eslint-disable-line

  // Clear location state after prefill is fully applied (avoid re-triggering on back-nav)
  useEffect(() => {
    if (prefillStageRef.current >= 5 && prefill) {
      window.history.replaceState({}, document.title);
    }
  }, [prefill, selClass, selSub, selChaps]); // eslint-disable-line

  // ── Pick class ─────────────────────────────────────────────────────────────
  const pickClass = async (cls) => {
    setSelClass(cls);
    setSelSub(null);
    setSubjects([]);
    setSelChaps([]);
    setChapters([]);
    setQtOpts([]);
    setSelQType(null);
    setSelLevel(null);
    setSelWS(null);
    setSubTopics([]);
    setWorksheets([]);

    // Add to pickClass (after existing resets):
    setSubtopicPath(null);
    setSubtopicList([]);
    setSelSubtopics([]);
    setLoadSub(true);
    scrollTo(subjectRef);
    try {
      const res = await axiosInstance.post("/subjects/", {
        class_id: cls.class_code,
      });
      let data = res.data.data || [];
      const is8to10 = ["8", "9", "10"].some((n) =>
        cls.class_code.toString().includes(n),
      );
      if (isJeeMode) {
        data = data.filter((s) => {
          const n = s.subject_name.toLowerCase();
          return (
            n.includes("jee") ||
            n.includes("mathematics_mains") ||
            n.includes("mathematics_advanced") ||
            n.includes("physics_mains") ||
            n.includes("chemistry_mains")
          );
        });
      } else {
        // Show all subjects returned by the backend — no client-side filtering.
        // data is already the full list; nothing to remove here.
      }
      setSubjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadSub(false);
    }
  };

  // ── Pick subject ───────────────────────────────────────────────────────────
  const pickSubject = async (sub) => {
    setSelSub(sub);
    setSelChaps([]);
    setChapters([]);
    setQtOpts([]);
    setSelQType(null);
    setSelLevel(null);
    setSelWS(null);
    setSubTopics([]);
    setWorksheets([]);

    setSubtopicPath(null);
    setSubtopicList([]);
    setSelSubtopics([]);

    setLoadCh(true);
    scrollTo(chapterRef);
    try {
      const res = await axiosInstance.post("/chapters/", {
        subject_id: sub.subject_code,
        class_id: selClass.class_code,
      });
      setChapters(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadCh(false);
    }
  };

  // AFTER
  // Always use multi-select. The single-select restriction was only needed
  // because the subtopic API only accepted one topic at a time — but the
  // new flow calls confirmChapters and then probes the API regardless.
  // Multi-select is safe; the subtopic fetch uses selChaps[0] for the probe.
  const toggleChap = (ch) => {
    setSelChaps((p) =>
      p.find((c) => c.topic_code === ch.topic_code)
        ? p.filter((c) => c.topic_code !== ch.topic_code)
        : [...p, ch],
    );
    // Reset downstream state
    setSelQType(null);
    setSelLevel(null);
    setSelWS(null);
    setSubtopicPath(null);
    setSubtopicList([]);
    setSelSubtopics([]);
    setQtOpts([]);
  };

  const confirmChapters = async () => {
    if (!selChaps.length) return;
    const sn = selSub?.subject_name || "";

    // ── Always try to fetch subtopics first for any subject/class ──────────
    setLoadingSubtopicList(true);
    scrollTo(subtopicPathRef);
    let fetchedSubtopics = [];
    try {
      const res = await axiosInstance.post(
        "/backend/api/updated-subtopic-questions/",
        {
          classid: selClass.class_code,
          subjectid: selSub.subject_code,
          topicid: [selChaps[0].topic_code],
          sub_topic_names: true,
        },
      );
      fetchedSubtopics = res.data.subtopics || [];
      setSubtopicList(fetchedSubtopics);
    } catch (e) {
      // API error = treat as no subtopics available, not a hard failure
      setSubtopicList([]);
    } finally {
      setLoadingSubtopicList(false);
    }

    // ── Always fetch question types too (needed for Path B or fallback) ────
    setLoadQT(true);
    scrollTo(qtypeRef);
    try {
      if (isJEEMainsAdv(sn)) {
        const res = await axiosInstance.post("/question-images-paginator/", {
          classid: selClass.class_code,
          subjectid: selSub.subject_code,
          topicid: selChaps.map((c) => c.topic_code),
          external: true,
        });
        setQtOpts(
          JEE_MAINS_TYPES.filter((t) =>
            (res.data.subtopics || []).includes(t.id),
          ),
        );
      } else if (isScience(sn)) {
        const res = await axiosInstance.post("/question-images-paginator/", {
          classid: selClass.class_code,
          subjectid: selSub.subject_code,
          topicid: selChaps.map((c) => c.topic_code),
          external: true,
        });
        const subs = res.data.subtopics || [];
        setQtOpts(
          subs.length
            ? SCIENCE_TYPES.filter((t) => subs.includes(t.id))
            : SCIENCE_TYPES,
        );
      } else {
        setQtOpts(BOARD_TYPES);
      }
    } catch (e) {
      setQtOpts(BOARD_TYPES);
    } finally {
      setLoadQT(false);
    }

    // ── If subtopics came back, reset path choice so user picks ───────────
    if (fetchedSubtopics.length > 0) {
      setSubtopicPath(null); // user must choose Path A or Path B
    }
    // If subtopics is empty, no path choice is needed — the UI falls straight
    // through to the question-type selector (same as the current non-subtopic flow).
  };

  // ── Pick question type → optionally fetch sub-selections ──────────────────
  const pickQType = async (opt) => {
    setSelQType(opt);
    setSelLevel(null);
    setSelWS(null);
    setSubTopics([]);
    setWorksheets([]);
    scrollTo(beginRef);
    if (
      opt.value === "external" &&
      !isJEEMainsAdv(selSub?.subject_name || "")
    ) {
      try {
        const res = await axiosInstance.post("/question-images-paginator/", {
          classid: selClass.class_code,
          subjectid: selSub.subject_code,
          topicid: selChaps[0].topic_code,
          external: true,
        });
        setSubTopics(res.data.subtopics || []);
      } catch (e) {
        setSubTopics([]);
      }
    }
    if (opt.value === "worksheets") {
      try {
        const res = await axiosInstance.post("/question-images-paginator/", {
          classid: selClass.class_code,
          subjectid: selSub.subject_code,
          topicid: selChaps[0].topic_code,
          worksheets: true,
        });
        setWorksheets(res.data.worksheets || []);
      } catch (e) {
        setWorksheets([]);
      }
    }
  };

  // ── Ready check ───────────────────────────────────────────────────────────
  const isReady = () => {
    if (!selClass || !selSub || !selChaps.length) return false;

    // If subtopics are available for this chapter, user must have picked a path
    if (subtopicList.length > 0) {
      if (subtopicPath === "subtopics") return selSubtopics.length > 0;
      if (subtopicPath === "questionType") {
        if (!selQType) return false;
        if (selQType.value === "external" && subTopics.length > 0 && !selLevel)
          return false;
        if (selQType.value === "worksheets" && worksheets.length > 0 && !selWS)
          return false;
        return true;
      }
      return false; // path not chosen yet
    }

    // No subtopics available — normal question-type flow
    if (!selQType) return false;
    if (selQType.value === "external" && subTopics.length > 0 && !selLevel)
      return false;
    if (selQType.value === "worksheets" && worksheets.length > 0 && !selWS)
      return false;
    return true;
  };

  // ── Build payload & fire callback ─────────────────────────────────────────
  const handleBegin = () => {
    if (!isReady()) return;
    const sn = selSub?.subject_name || "";

    // ── Subtopic-path subjects — subtopics route ──
    if (subtopicList.length > 0 && subtopicPath === "subtopics") {
      const req = {
        classid: selClass.class_code,
        subjectid: selSub.subject_code,
        topicid: [selChaps[0].topic_code],
        sub_topic_code: selSubtopics, // array of updated_sub_topic_code values
        _useSubtopicApi: true, // flag for StudentDash to use the correct API
      };
      onReadyToSubmit?.(req, {
        selClass,
        selSub,
        selChaps,
        selQType: null,
        selLevel: null,
        selWS: null,
      });
      return;
    }

    const req = {
      classid: Number(selClass.class_code),
      subjectid: Number(selSub.subject_code),
      topicid: selChaps.map((c) => c.topic_code),
    };
    const SCI_IDS = {
      activity_based_questions: "1",
      conceptual_questions: "2",
      diagram_based_questions: "3",
      fill_in_the_blanks: "4",
      matching_questions: "5",
      t_f_questions: "6",
    };
    if (isScience(sn)) {
      req.subtopic = SCI_IDS[selQType.value];
    } else if (isJEEMainsAdv(sn)) {
      req.subtopic = { mcq: "1", nvtq: "2", theorem: "3" }[selQType.value];
    } else {
      req.solved = selQType.value === "solved";
      req.exercise = selQType.value === "exercise";
      req.subtopic = selQType.value === "external" ? selLevel : null;
      req.worksheet_name = selQType.value === "worksheets" ? selWS : null;
    }
    onReadyToSubmit?.(req, {
      selClass,
      selSub,
      selChaps,
      selQType,
      selLevel,
      selWS,
    });
  };

  // ── Accent tokens ─────────────────────────────────────────────────────────
  const accent = dark ? "#a78bfa" : "#667eea";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        fontFamily: "inherit",
      }}
    >
      {/* Keyframe for shimmer on Begin button */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 ${accent}66; }
          70%  { box-shadow: 0 0 0 12px ${accent}00; }
          100% { box-shadow: 0 0 0 0 ${accent}00; }
        }
      `}</style>

      {/* ── Progress Stepper ── */}
      <WizardProgress
        activeStep={activeStep}
        completedSteps={completedSteps}
        dark={dark}
        labels={stepLabels} // ← pass dynamic labels
      />

      {/* ══════════════════════════════════════════════════════
          STEP 0 — CLASS
      ══════════════════════════════════════════════════════ */}
      <GlassSection dark={dark}>
        <StepTitle dark={dark}>Choose Your Class</StepTitle>
        {classes.length === 0 ? (
          <StepSpinner label="Loading classes…" dark={dark} />
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
          >
            {classes.map((cls) => (
              <Pill
                key={cls.class_code}
                label={cls.class_name}
                selected={selClass?.class_code === cls.class_code}
                onClick={() => pickClass(cls)}
                dark={dark}
                size="lg"
              />
            ))}
          </motion.div>
        )}
      </GlassSection>

      {/* ══════════════════════════════════════════════════════
          STEP 1 — SUBJECT
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selClass && (
          <motion.div
            ref={subjectRef}
            key="subject-section"
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <GlassSection dark={dark}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <StepTitle dark={dark}>Choose Subject</StepTitle>
                <ConfirmedBadge
                  label={selClass.class_name}
                  dark={dark}
                  onClick={() => {
                    setSelClass(null);
                    setSelSub(null);
                    setSelChaps([]);
                    setSelQType(null);
                  }}
                />
              </div>
              {loadSub ? (
                <StepSpinner label="Loading subjects…" dark={dark} />
              ) : (
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
                >
                  {subjects.map((sub) => (
                    <Pill
                      key={sub.subject_code}
                      label={sub.subject_name}
                      selected={selSub?.subject_code === sub.subject_code}
                      onClick={() => pickSubject(sub)}
                      dark={dark}
                      size="lg"
                    />
                  ))}
                </motion.div>
              )}
            </GlassSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          STEP 2 — CHAPTERS (multi-select)
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selSub && (
          <motion.div
            ref={chapterRef}
            key="chapter-section"
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <GlassSection dark={dark}>
              {/* Confirmed badges */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <ConfirmedBadge
                  label={selClass.class_name}
                  dark={dark}
                  onClick={() => {
                    setSelClass(null);
                    setSelSub(null);
                    setSelChaps([]);
                    setSelQType(null);
                  }}
                />
                <span
                  style={{ color: dark ? "#334155" : "#cbd5e1", fontSize: 12 }}
                >
                  ›
                </span>
                <ConfirmedBadge
                  label={selSub.subject_name}
                  dark={dark}
                  onClick={() => {
                    setSelSub(null);
                    setSelChaps([]);
                    setSelQType(null);
                  }}
                />
              </div>

              <StepTitle dark={dark}>Select Chapters</StepTitle>
              <p
                style={{
                  fontSize: 12,
                  color: dark ? "#64748b" : "#94a3b8",
                  marginBottom: 14,
                  marginTop: -12,
                }}
              >
                {isSubtopicPathSubject(selClass, selSub)
                  ? "Select one chapter"
                  : "You can pick multiple chapters"}
              </p>

              {loadCh ? (
                <StepSpinner label="Loading chapters…" dark={dark} />
              ) : (
                <>
                  <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 9,
                      maxHeight: 280,
                      overflowY: "auto",
                      paddingRight: 4,
                    }}
                  >
                    {chapters.map((ch) => {
                      const sel = selChaps.some(
                        (c) => c.topic_code === ch.topic_code,
                      );
                      return (
                        <Pill
                          key={ch.topic_code}
                          label={ch.name}
                          selected={sel}
                          onClick={() => toggleChap(ch)}
                          dark={dark}
                        />
                      );
                    })}
                  </motion.div>

                  <AnimatePresence>
                    {selChaps.length > 0 &&
                      !subtopicPath &&
                      subtopicList.length === 0 &&
                      qtOpts.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          style={{
                            marginTop: 18,
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          {loadQT ? (
                            <StepSpinner
                              label="Preparing question types…"
                              dark={dark}
                            />
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={confirmChapters}
                              style={{
                                padding: "11px 24px",
                                borderRadius: 30,
                                border: "none",
                                background: `linear-gradient(135deg, ${dark ? "#7c3aed" : "#667eea"}, ${dark ? "#6366f1" : "#764ba2"})`,
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                boxShadow: `0 6px 20px ${accent}44`,
                              }}
                            >
                              Continue ({selChaps.length} selected)
                              <FontAwesomeIcon
                                icon={faChevronRight}
                                style={{ fontSize: 12 }}
                              />
                            </motion.button>
                          )}
                        </motion.div>
                      )}
                  </AnimatePresence>
                </>
              )}
            </GlassSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
    STEP 3.5 — SUBTOPIC PATH CHOICE (subtopics vs question type)
    Applies to: Math 6-12, Science 6-10, Physics/Chemistry 11-12
══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {subtopicList.length > 0 &&
          selChaps.length >= 1 &&
          qtOpts.length > 0 && (
            <motion.div
              ref={subtopicPathRef}
              key="subtopic-path-section"
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <GlassSection dark={dark}>
                {/* Confirmed badges */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <ConfirmedBadge
                    label={selClass.class_name}
                    dark={dark}
                    onClick={() => {
                      setSelClass(null);
                      setSelSub(null);
                      setSelChaps([]);
                      setSelQType(null);
                      setSubtopicPath(null);
                    }}
                  />
                  <span
                    style={{
                      color: dark ? "#334155" : "#cbd5e1",
                      fontSize: 12,
                    }}
                  >
                    ›
                  </span>
                  <ConfirmedBadge
                    label={selSub.subject_name}
                    dark={dark}
                    onClick={() => {
                      setSelSub(null);
                      setSelChaps([]);
                      setSelQType(null);
                      setSubtopicPath(null);
                    }}
                  />
                  <span
                    style={{
                      color: dark ? "#334155" : "#cbd5e1",
                      fontSize: 12,
                    }}
                  >
                    ›
                  </span>
                  <ConfirmedBadge
                    label={selChaps[0].name}
                    dark={dark}
                    onClick={() => {
                      setSelChaps([]);
                      setSelQType(null);
                      setSubtopicPath(null);
                      setSubtopicList([]);
                      setSelSubtopics([]);
                    }}
                  />
                </div>

                <StepTitle dark={dark}>Choose Your Path</StepTitle>
                <p
                  style={{
                    fontSize: 12,
                    color: dark ? "#64748b" : "#94a3b8",
                    marginBottom: 18,
                    marginTop: -12,
                  }}
                >
                  Pick subtopics to focus on specific areas, or choose a
                  question type for the full chapter
                </p>

                {loadingSubtopicList ? (
                  <StepSpinner label="Loading subtopics…" dark={dark} />
                ) : (
                  <>
                    {/* ── Path toggle buttons ── */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSubtopicPath("subtopics");
                          setSelQType(null);
                          setSelLevel(null);
                          setSelWS(null);
                        }}
                        style={{
                          flex: 1,
                          padding: "14px 18px",
                          borderRadius: 14,
                          border: `2px solid ${
                            subtopicPath === "subtopics"
                              ? dark
                                ? "#a78bfa"
                                : "#667eea"
                              : dark
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.08)"
                          }`,
                          background:
                            subtopicPath === "subtopics"
                              ? dark
                                ? "rgba(167,139,250,0.15)"
                                : "rgba(102,126,234,0.1)"
                              : "transparent",
                          color: dark ? "#e2e8f0" : "#1e293b",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 14,
                          opacity: subtopicPath === "questionType" ? 0.4 : 1,
                          transition: "all 0.2s ease",
                        }}
                      >
                        📚 Subtopics
                        <span
                          style={{
                            display: "block",
                            fontSize: 11,
                            fontWeight: 400,
                            marginTop: 4,
                            color: dark ? "#94a3b8" : "#64748b",
                          }}
                        >
                          Focus on specific areas
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSubtopicPath("questionType");
                          setSelSubtopics([]);
                        }}
                        style={{
                          flex: 1,
                          padding: "14px 18px",
                          borderRadius: 14,
                          border: `2px solid ${
                            subtopicPath === "questionType"
                              ? dark
                                ? "#a78bfa"
                                : "#667eea"
                              : dark
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.08)"
                          }`,
                          background:
                            subtopicPath === "questionType"
                              ? dark
                                ? "rgba(167,139,250,0.15)"
                                : "rgba(102,126,234,0.1)"
                              : "transparent",
                          color: dark ? "#e2e8f0" : "#1e293b",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 14,
                          opacity: subtopicPath === "subtopics" ? 0.4 : 1,
                          transition: "all 0.2s ease",
                        }}
                      >
                        📝 Question Type
                        <span
                          style={{
                            display: "block",
                            fontSize: 11,
                            fontWeight: 400,
                            marginTop: 4,
                            color: dark ? "#94a3b8" : "#64748b",
                          }}
                        >
                          Solved / Exercises / Worksheets
                        </span>
                      </motion.button>
                    </div>

                    {/* ── Subtopics multi-select (visible when path = "subtopics") ── */}
                    <AnimatePresence>
                      {subtopicPath === "subtopics" &&
                        subtopicList.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: "hidden" }}
                          >
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                marginBottom: 10,
                                color: dark ? "#c4b5fd" : "#4f46e5",
                              }}
                            >
                              Select one or more subtopics:
                            </p>
                            <motion.div
                              variants={listVariants}
                              initial="hidden"
                              animate="show"
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 9,
                                maxHeight: 240,
                                overflowY: "auto",
                                paddingRight: 4,
                              }}
                            >
                              {subtopicList.map((st) => {
                                const sel = selSubtopics.includes(
                                  st.updated_sub_topic_code,
                                );
                                return (
                                  <Pill
                                    key={st.updated_sub_topic_code}
                                    label={st.updated_sub_topic_name}
                                    selected={sel}
                                    onClick={() => {
                                      setSelSubtopics((p) =>
                                        p.includes(st.updated_sub_topic_code)
                                          ? p.filter(
                                              (c) =>
                                                c !== st.updated_sub_topic_code,
                                            )
                                          : [...p, st.updated_sub_topic_code],
                                      );
                                    }}
                                    dark={dark}
                                  />
                                );
                              })}
                            </motion.div>
                          </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Question type cards (visible when path = "questionType") ── */}
                    <AnimatePresence>
                      {subtopicPath === "questionType" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: "hidden" }}
                        >
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              marginBottom: 10,
                              color: dark ? "#c4b5fd" : "#4f46e5",
                            }}
                          >
                            Select question type:
                          </p>
                          <motion.div
                            variants={listVariants}
                            initial="hidden"
                            animate="show"
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fill, minmax(130px, 1fr))",
                              gap: 12,
                            }}
                          >
                            {qtOpts.map((opt) => (
                              <QTypeCard
                                key={opt.value}
                                opt={opt}
                                selected={selQType?.value === opt.value}
                                onClick={() => pickQType(opt)}
                                dark={dark}
                              />
                            ))}
                          </motion.div>

                          {/* Exercise sub-select (inside Class 9 questionType path) */}
                          <AnimatePresence>
                            {selQType?.value === "external" &&
                              subTopics.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{ overflow: "hidden", marginTop: 20 }}
                                >
                                  <p
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: dark ? "#94a3b8" : "#64748b",
                                      marginBottom: 10,
                                    }}
                                  >
                                    Select Exercise Set
                                  </p>
                                  <motion.div
                                    variants={listVariants}
                                    initial="hidden"
                                    animate="show"
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 8,
                                    }}
                                  >
                                    {subTopics.map((st, i) => (
                                      <Pill
                                        key={st}
                                        label={`Exercise ${i + 1}`}
                                        selected={selLevel === st}
                                        onClick={() => setSelLevel(st)}
                                        dark={dark}
                                      />
                                    ))}
                                  </motion.div>
                                </motion.div>
                              )}
                          </AnimatePresence>

                          {/* Worksheet sub-select (inside Class 9 questionType path) */}
                          <AnimatePresence>
                            {selQType?.value === "worksheets" &&
                              worksheets.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{ overflow: "hidden", marginTop: 20 }}
                                >
                                  <p
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: dark ? "#94a3b8" : "#64748b",
                                      marginBottom: 10,
                                    }}
                                  >
                                    Select Worksheet
                                  </p>
                                  <motion.div
                                    variants={listVariants}
                                    initial="hidden"
                                    animate="show"
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 8,
                                    }}
                                  >
                                    {worksheets.map((ws) => (
                                      <Pill
                                        key={ws.id || ws.worksheet_name}
                                        label={ws.worksheet_name}
                                        selected={selWS === ws.worksheet_name}
                                        onClick={() =>
                                          setSelWS(ws.worksheet_name)
                                        }
                                        dark={dark}
                                      />
                                    ))}
                                  </motion.div>
                                </motion.div>
                              )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </GlassSection>
            </motion.div>
          )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          STEP 3 — QUESTION TYPE
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {qtOpts.length > 0 && subtopicList.length === 0 && (
          <motion.div
            ref={qtypeRef}
            key="qtype-section"
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <GlassSection dark={dark}>
              {/* Breadcrumb badges */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <ConfirmedBadge
                  label={selClass.class_name}
                  dark={dark}
                  onClick={() => {
                    setSelClass(null);
                    setSelSub(null);
                    setSelChaps([]);
                    setSelQType(null);
                    setQtOpts([]);
                  }}
                />
                <span
                  style={{ color: dark ? "#334155" : "#cbd5e1", fontSize: 12 }}
                >
                  ›
                </span>
                <ConfirmedBadge
                  label={selSub.subject_name}
                  dark={dark}
                  onClick={() => {
                    setSelSub(null);
                    setSelChaps([]);
                    setSelQType(null);
                    setQtOpts([]);
                  }}
                />
                <span
                  style={{ color: dark ? "#334155" : "#cbd5e1", fontSize: 12 }}
                >
                  ›
                </span>
                <ConfirmedBadge
                  label={`${selChaps.length} chapter${selChaps.length > 1 ? "s" : ""}`}
                  dark={dark}
                  onClick={() => {
                    setSelQType(null);
                    setQtOpts([]);
                  }}
                />
              </div>

              <StepTitle dark={dark}>Question Type</StepTitle>

              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: 12,
                }}
              >
                {qtOpts.map((opt) => (
                  <QTypeCard
                    key={opt.value}
                    opt={opt}
                    selected={selQType?.value === opt.value}
                    onClick={() => pickQType(opt)}
                    dark={dark}
                  />
                ))}
              </motion.div>

              {/* Exercise sub-select */}
              <AnimatePresence>
                {selQType?.value === "external" && subTopics.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden", marginTop: 20 }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: dark ? "#94a3b8" : "#64748b",
                        marginBottom: 10,
                      }}
                    >
                      Select Exercise Set
                    </p>
                    <motion.div
                      variants={listVariants}
                      initial="hidden"
                      animate="show"
                      style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                    >
                      {subTopics.map((st, i) => (
                        <Pill
                          key={st}
                          label={`Exercise ${i + 1}`}
                          selected={selLevel === st}
                          onClick={() => setSelLevel(st)}
                          dark={dark}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Worksheet sub-select */}
              <AnimatePresence>
                {selQType?.value === "worksheets" && worksheets.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden", marginTop: 20 }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: dark ? "#94a3b8" : "#64748b",
                        marginBottom: 10,
                      }}
                    >
                      Select Worksheet
                    </p>
                    <motion.div
                      variants={listVariants}
                      initial="hidden"
                      animate="show"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {worksheets.map((ws) => (
                        <Pill
                          key={ws.id || ws.worksheet_name}
                          label={ws.worksheet_name}
                          selected={selWS === ws.worksheet_name}
                          onClick={() => setSelWS(ws.worksheet_name)}
                          dark={dark}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          FINAL — LET'S BEGIN BUTTON
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isReady() && (
          <motion.div
            ref={beginRef}
            key="begin-btn"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: 8 }}
          >
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: `0 16px 48px ${accent}66` }}
              whileTap={{ scale: 0.97 }}
              onClick={handleBegin}
              style={{
                width: "100%",
                padding: "18px 0",
                borderRadius: 20,
                border: "none",
                background: `linear-gradient(135deg, ${dark ? "#7c3aed" : "#667eea"} 0%, ${dark ? "#6366f1" : "#764ba2"} 50%, ${dark ? "#ec4899" : "#f093fb"} 100%)`,
                backgroundSize: "200% auto",
                animation: "shimmer 3s linear infinite",
                color: "#fff",
                fontSize: 17,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: `0 8px 32px ${accent}55`,
                outline: "none",
                animationName: "pulse-ring",
                animationDuration: "2s",
                animationIterationCount: "infinite",
              }}
            >
              <FontAwesomeIcon icon={faRocket} style={{ fontSize: 18 }} />
              Let's Begin
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
