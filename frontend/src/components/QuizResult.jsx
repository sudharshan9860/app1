import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "../api/axiosInstance";
import "./QuizResult.css";
import MarkdownWithMath from "./MarkdownWithMath";
import QuizResultChatPanel from "./QuizResultChatPanel";
import {
  generateQuestions,
  generateLearningPath,
  fetchCheatsheet,
} from "../api/quizApi";
import { createPortal } from "react-dom";

/* ── Convert LaTeX + Markdown to readable plain text for PDF ── */
const latexToPlainText = (text) => {
  if (!text) return "";
  let t = text;
  // strip markdown headers
  t = t.replace(/^#{1,6}\s+/gm, "");
  // bold / italic
  t = t.replace(/\*\*(.+?)\*\*/g, "$1");
  t = t.replace(/__(.+?)__/g, "$1");
  t = t.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1");
  t = t.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "$1");
  // process math blocks
  const processMath = (m) => {
    // fractions
    m = m.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1/$2)");
    // square root
    m = m.replace(/\\sqrt\{([^}]*)\}/g, "\u221A($1)");
    m = m.replace(/\\sqrt(\s)/g, "\u221A$1");
    // Greek
    const greek = {
      pi: "\u03C0",
      theta: "\u03B8",
      alpha: "\u03B1",
      beta: "\u03B2",
      gamma: "\u03B3",
      delta: "\u03B4",
      sigma: "\u03C3",
      mu: "\u03BC",
      lambda: "\u03BB",
      phi: "\u03C6",
      omega: "\u03C9",
      epsilon: "\u03B5",
      tau: "\u03C4",
      rho: "\u03C1",
      eta: "\u03B7",
      nu: "\u03BD",
      Delta: "\u0394",
      Sigma: "\u03A3",
      Pi: "\u03A0",
      Theta: "\u0398",
      Omega: "\u03A9",
    };
    Object.entries(greek).forEach(([k, v]) => {
      m = m.replace(new RegExp("\\\\" + k + "(?![a-zA-Z])", "g"), v);
    });
    // operators & symbols
    const ops = {
      times: "\u00D7",
      div: "\u00F7",
      pm: "\u00B1",
      mp: "\u2213",
      cdot: "\u00B7",
      leq: "\u2264",
      geq: "\u2265",
      neq: "\u2260",
      approx: "\u2248",
      equiv: "\u2261",
      infty: "\u221E",
      degree: "\u00B0",
      circ: "\u00B0",
      angle: "\u2220",
      perp: "\u22A5",
      therefore: "\u2234",
      because: "\u2235",
      rightarrow: "\u2192",
      leftarrow: "\u2190",
      Rightarrow: "\u21D2",
      Leftarrow: "\u21D0",
      quad: " ",
      qquad: "  ",
      ",": " ",
      sin: "sin",
      cos: "cos",
      tan: "tan",
      log: "log",
      ln: "ln",
      lim: "lim",
    };
    Object.entries(ops).forEach(([k, v]) => {
      m = m.replace(new RegExp("\\\\" + k + "(?![a-zA-Z])", "g"), v);
    });
    // superscripts
    const sup = {
      0: "\u2070",
      1: "\u00B9",
      2: "\u00B2",
      3: "\u00B3",
      4: "\u2074",
      5: "\u2075",
      6: "\u2076",
      7: "\u2077",
      8: "\u2078",
      9: "\u2079",
      n: "\u207F",
      "-": "\u207B",
    };
    m = m.replace(/\^\{([^}]*)\}/g, (_, inner) =>
      inner
        .split("")
        .map((c) => sup[c] || `^${c}`)
        .join(""),
    );
    m = m.replace(/\^([0-9n])/g, (_, c) => sup[c] || `^${c}`);
    // subscripts
    const sub = {
      0: "\u2080",
      1: "\u2081",
      2: "\u2082",
      3: "\u2083",
      4: "\u2084",
      5: "\u2085",
      6: "\u2086",
      7: "\u2087",
      8: "\u2088",
      9: "\u2089",
    };
    m = m.replace(/\_\{([^}]*)\}/g, (_, inner) =>
      inner
        .split("")
        .map((c) => sub[c] || `_${c}`)
        .join(""),
    );
    // text / mathrm
    m = m.replace(/\\text\{([^}]*)\}/g, "$1");
    m = m.replace(/\\mathrm\{([^}]*)\}/g, "$1");
    m = m.replace(/\\mathbf\{([^}]*)\}/g, "$1");
    // remaining unknown commands → just the name
    m = m.replace(/\\([a-zA-Z]+)/g, "$1");
    // clean braces
    m = m.replace(/[{}]/g, "");
    return m;
  };
  // display math $$...$$
  t = t.replace(/\$\$([^$]+)\$\$/g, (_, math) => processMath(math));
  // inline math $...$
  t = t.replace(/\$([^$]+)\$/g, (_, math) => processMath(math));
  // list markers
  t = t.replace(/^[-*]\s+/gm, "  \u2022 ");
  // horizontal rules
  t = t.replace(/^---+$/gm, "");
  // collapse multiple blank lines
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
};

const QuizResult = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const evalData = state?.evalData || {};
  const questions = state?.questions || [];
  const answers = state?.answers || {};
  const classNum = state?.classNum;
  const subject = state?.subject;
  const boardSelection = state?.boardSelection;
  const timeSpent = state?.timeSpent || 0;

  /* ── data extraction ── */
  const prediction = evalData.prediction || {};
  const analysis = evalData.analysis || {};
  const rootCause = evalData.root_cause_data || {};
  const graphData = evalData.graph_data || {};
  const bridgeStatus = graphData.bridge_status_counts || {};
  const chapterBreakdown = graphData.chapter_breakdown || [];
  const bridgeResults = analysis.bridge_results || [];
  const chapterScoresObj = analysis.chapter_scores || {};
  const atRiskConcepts = rootCause.at_risk_concepts || [];
  const dependencyMap = rootCause.dependency_map || {};
  const cascadeMap = rootCause.cascade_map || {};
  const bridgeDetails = evalData.ai_bridge_evaluations || [];
  const conceptDetails = evalData.concept_details || [];

  const jeeSelectedSubject = state?.jeeSelectedSubject || "JEE_FOUNDATION_MATH";
  const jeeSelectedClass = state?.jeeSelectedClass || classNum;
  const jeeSelection = state?.jeeSelection || null;

  const isJeeFoundation = state?.isJeeFoundation || false;
  const jeeDifficulty = state?.jeeDifficulty || null; // "Easy" | "Medium" | "Hard" | null

  const remedialPlanRaw = evalData.remedial_plan;
  const isRemedialObj = remedialPlanRaw && typeof remedialPlanRaw === "object";
  const foundationRepairs = isRemedialObj
    ? remedialPlanRaw.foundation_repairs || []
    : [];
  const bridgeRepairs = isRemedialObj
    ? remedialPlanRaw.bridge_repairs || []
    : [];
  const studyPlanSummary = isRemedialObj
    ? remedialPlanRaw.study_plan_summary || {}
    : {};
  const remedialText = isRemedialObj
    ? remedialPlanRaw.remedial_text || ""
    : typeof remedialPlanRaw === "string"
      ? remedialPlanRaw
      : "";

  const foundationImpact = graphData.foundation_impact || [];
  const scoreTrend = graphData.score_trend_seed || [];

  /* concept lookup */
  const conceptLookup = {};
  [...conceptDetails, ...atRiskConcepts].forEach((c) => {
    if (c?.id) conceptLookup[c.id] = c;
  });

  /* bridge source & maps */
  const bridgeSource = bridgeResults.length ? bridgeResults : bridgeDetails;
  const questionBridgeMap = {};
  bridgeSource.forEach((br) => {
    questionBridgeMap[br.question_num] = br;
  });

  /* all concepts deduplicated */
  const allConceptsMap = new Map();
  [...conceptDetails, ...atRiskConcepts].forEach((c) => {
    if (c?.id && !allConceptsMap.has(c.id)) allConceptsMap.set(c.id, c);
  });
  const allConcepts = [...allConceptsMap.values()];

  /* bridges grouped by chapter for heatmap */
  const bridgesByChapter = {};
  bridgeSource.forEach((br) => {
    const ch = br.chapter || "Unknown";
    if (!bridgesByChapter[ch]) bridgesByChapter[ch] = [];
    bridgesByChapter[ch].push(br);
  });

  /* chapter scores array */
  const chapterScoresArr = Object.entries(chapterScoresObj).map(([ch, v]) => ({
    chapter: ch,
    correct: v.correct,
    total: v.total,
    score_pct: v.total ? Math.round((v.correct / v.total) * 100) : 0,
  }));

  const DIFFICULTY_PROGRESSION = {
    null: "Easy",
    Easy: "Medium",
    Medium: "Hard",
    Hard: null,
  };

  const nextDifficulty = DIFFICULTY_PROGRESSION[String(jeeDifficulty)];

  const handleNextLevel = async () => {
    if (!nextDifficulty) return;
    setRetakeLoading(true);
    setRetakeError("");
    try {
      const res = await generateQuestions({
        class_num: Number(jeeSelectedClass), // ← was Number(classNum)
        chapters: state?.selectedChapters || [],
        questions_per_chapter: state?.questionsPerChapter || 5,
        subject: jeeSelectedSubject, // ← was "JEE_FOUNDATION_MATH"
        difficulty_level: nextDifficulty,
        ...(state?.selectedSubtopics?.length > 0 && {
          sub_topics: state.selectedSubtopics,
        }),
      });
      navigate("/quiz-question", {
        state: {
          quizData: res.data,
          classNum: Number(jeeSelectedClass),
          selectedChapters: state?.selectedChapters || [],
          questionsPerChapter: state?.questionsPerChapter || 5,
          subject: jeeSelectedSubject,
          selectedSubtopics: state?.selectedSubtopics || [],
          isJeeFoundation: true,
          jeeDifficulty: nextDifficulty,
          jeeSelectedSubject, // ← NEW: carry forward
          jeeSelectedClass, // ← NEW: carry forward
        },
      });
    } catch (err) {
      setRetakeError(
        err.response?.data?.detail ||
          "Failed to generate next level questions.",
      );
    } finally {
      setRetakeLoading(false);
    }
  };

  /* ── state ── */
  const [showFullRemedial, setShowFullRemedial] = useState(false);
  const [expandedRepair, setExpandedRepair] = useState({});
  const [generatingPath, setGeneratingPath] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [retakeError, setRetakeError] = useState("");
  const [pathError, setPathError] = useState("");
  const [quizId, setQuizId] = useState(null);
  const quizSaved = useRef(false);
  const analysisSent = useRef(false);
  const isDark = localStorage.getItem("DarkMode") === "true";

  // Already exists — just confirm it's present:
  const isRetake = state?.isRetake || false;

  const selectedSubtopics =
    state?.selectedSubtopics || boardSelection?.subtopics || [];

  /* ── Save quiz to backend for QuizScoreGraph ── */
  useEffect(() => {
    if (quizSaved.current || !evalData?.prediction) return;
    quizSaved.current = true;

    // Build chapter_breakdown from questions if API didn't provide it
    const ensuredChapterBreakdown = (() => {
      if (chapterBreakdown && chapterBreakdown.length > 0)
        return chapterBreakdown;
      const chapterMap = {};
      questions.forEach((q, idx) => {
        const chapter = q.chapter || "Unknown";
        if (!chapterMap[chapter])
          chapterMap[chapter] = { chapter, correct: 0, total: 0 };
        chapterMap[chapter].total += 1;
        const studentAnswer = answers[idx] || "";
        if (studentAnswer && studentAnswer === q.correct_answer) {
          chapterMap[chapter].correct += 1;
        }
      });
      return Object.values(chapterMap).map((ch) => ({
        ...ch,
        score_pct: ch.total > 0 ? Math.round((ch.correct / ch.total) * 100) : 0,
      }));
    })();

    (async () => {
      try {
        const saved = await axiosInstance.createQuiz({
          name: `Class ${classNum} - ${subject} - ${new Date().toLocaleDateString()}`,
          questions: questions,
          analysis: evalData,
          graph_data: {
            subject: subject || "Mathematics",
            chapter_breakdown: ensuredChapterBreakdown,
            score_pct: scorePct,
            correct: correct,
            total: total,
          },
        });
        setQuizId(saved.id || saved.quiz_id);
      } catch (e) {
        console.error("Failed to save quiz:", e);
      }
    })();
  }, []); // eslint-disable-line

  const scorePct = prediction.score_pct ?? 0;
  const correct = prediction.correct ?? analysis.correct ?? 0;
  const total = prediction.total ?? analysis.total ?? questions.length;
  const incorrect = total - correct;
  const brokenCount = bridgeStatus.broken || 0;
  const weakCount = bridgeStatus.weak || 0;

  const [retakeLoading, setRetakeLoading] = useState(false);

  // Cheatsheet state for retake flow
  const [cheatsheetData, setCheatsheetData] = useState(null);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [loadingCheatsheet, setLoadingCheatsheet] = useState(false);
  const [expandedSheets, setExpandedSheets] = useState({});

  /* Time calculations */
  const timeGivenMin = Math.max(total * 2, 5);
  const timeGivenSec = timeGivenMin * 60;
  const timePct =
    timeGivenSec > 0
      ? Math.min(Math.round((timeSpent / timeGivenSec) * 100), 100)
      : 0;

  const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const formatTimeDetailed = (s) => `${Math.floor(s / 60)} min ${s % 60} sec`;
  const statusIcon = (s) =>
    s === "intact" ? "✅" : s === "weak" ? "🟡" : "🔴";

  const toggleRepair = (key) =>
    setExpandedRepair((p) => ({ ...p, [key]: !p[key] }));

  /* ── PDF Download ── */
  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    let y = 16;
    const addPageIfNeeded = (need = 30) => {
      if (y + need > doc.internal.pageSize.getHeight() - 16) {
        doc.addPage();
        y = 16;
      }
    };
    doc.setFillColor(15, 12, 41);
    doc.rect(0, 0, pageW, 44, "F");
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 44, pageW, 3, "F");
    doc.setTextColor(224, 231, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, "bold");
    doc.text("SmartLearners.ai — Bridge Scan Report", pageW / 2, 18, {
      align: "center",
    });
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(165, 180, 252);
    doc.text(
      `Class ${classNum}  |  Score: ${scorePct}%  |  ${correct}/${total} correct  |  Time: ${formatTime(timeSpent)}`,
      pageW / 2,
      30,
      { align: "center" },
    );
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, 38, {
      align: "center",
    });
    y = 55;

    /* Score summary */
    const summaryData = [
      ["Score", `${scorePct}%`],
      ["Correct", `${correct}`],
      ["Incorrect", `${incorrect}`],
      ["Total Questions", `${total}`],
      ["Time Spent", formatTime(timeSpent)],
    ];
    if (prediction.predicted_marks_out_of_100 != null)
      summaryData.push([
        "Predicted Board Score",
        `${prediction.predicted_marks_out_of_100} / 100`,
      ]);
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: summaryData,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9.5 },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 10;

    /* Question Review */
    addPageIfNeeded(20);
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.setTextColor(50, 50, 80);
    doc.text("Question-by-Question Analysis", margin, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [
        [
          "Q#",
          "Chapter",
          "Question",
          "Your Ans",
          "Correct",
          "Result",
          "Bridge",
        ],
      ],
      body: questions.map((q, idx) => {
        const sel = answers[idx] || "";
        const isCorrect = sel === q.correct_answer;
        const bridge = questionBridgeMap[q.question_num];
        const qText = latexToPlainText(q.question);
        return [
          q.question_num,
          q.chapter || "",
          qText,
          sel || "—",
          q.correct_answer,
          isCorrect ? "Correct" : sel ? "Wrong" : "Skip",
          bridge?.bridge_id || "",
        ];
      }),
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      bodyStyles: { fontSize: 8, cellWidth: "wrap" },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 28 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 16 },
        4: { cellWidth: 16 },
        5: { cellWidth: 16 },
        6: { cellWidth: 18 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          if (data.cell.raw === "Correct")
            data.cell.styles.textColor = [5, 150, 105];
          else if (data.cell.raw === "Wrong")
            data.cell.styles.textColor = [220, 38, 38];
          else data.cell.styles.textColor = [120, 120, 120];
        }
      },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 10;

    /* Bridge Analysis */
    if (bridgeSource.length > 0) {
      addPageIfNeeded(30);
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.setTextColor(50, 50, 80);
      doc.text("Bridge Gap Analysis", margin, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [
          ["Bridge ID", "Bridge Name", "Chapter", "Status", "Trap Explanation"],
        ],
        body: bridgeSource.map((br) => {
          const trap = latexToPlainText(br.trap_explanation || "");
          return [
            br.bridge_id,
            br.bridge_name,
            br.chapter || "",
            br.status,
            trap,
          ];
        }),
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8.5,
        },
        bodyStyles: { fontSize: 8, cellWidth: "wrap" },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 30 },
          2: { cellWidth: 28 },
          3: { cellWidth: 18 },
          4: { cellWidth: "auto" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 3) {
            if (data.cell.raw === "intact")
              data.cell.styles.textColor = [5, 150, 105];
            else if (data.cell.raw === "weak")
              data.cell.styles.textColor = [217, 119, 6];
            else data.cell.styles.textColor = [220, 38, 38];
          }
        },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    /* Foundation Gap Analysis */
    if (allConcepts.length > 0) {
      addPageIfNeeded(20);
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.setTextColor(50, 50, 80);
      doc.text("Foundation Gap Analysis — Root Causes", margin, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [
          [
            "Concept ID",
            "Concept",
            "Class",
            "Chapter",
            "Affected Bridges",
            "Impact",
          ],
        ],
        body: allConcepts.map((c) => {
          const aff = cascadeMap[c.id] || [];
          return [
            c.id,
            latexToPlainText(c.name),
            c.class || "",
            c.chapter,
            aff.join(", "),
            aff.length,
          ];
        }),
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8.5,
        },
        bodyStyles: { fontSize: 8 },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    /* ── PART A: Foundation Repairs ── */
    if (foundationRepairs.length > 0) {
      addPageIfNeeded(30);
      doc.setFillColor(99, 102, 241);
      doc.rect(margin, y - 2, pageW - margin * 2, 10, "F");
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(
        "PART A: FOUNDATION REPAIRS (Fix These First)",
        margin + 4,
        y + 5,
      );
      y += 16;

      foundationRepairs.forEach((item, idx) => {
        addPageIfNeeded(40);
        const conceptName = item.concept_name || item.name || "";
        const conceptId = item.concept_id || "";
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(
          `${idx + 1}. Concept: ${latexToPlainText(conceptName)}${conceptId ? ` (${conceptId})` : ""}`,
          margin,
          y,
        );
        y += 7;

        const bulletItems = [];
        if (item.concept_explanation)
          bulletItems.push({
            label: "Definition",
            text: latexToPlainText(item.concept_explanation),
          });
        if (item.ncert_reference)
          bulletItems.push({
            label: "NCERT Ref",
            text: latexToPlainText(item.ncert_reference),
          });
        if (item.key_formulas?.length > 0)
          bulletItems.push({
            label: "Formula",
            text: item.key_formulas.map((f) => latexToPlainText(f)).join("; "),
          });
        if (item.worked_example)
          bulletItems.push({
            label: "Worked Example",
            text: latexToPlainText(item.worked_example),
          });
        if (item.practice_exercises?.length > 0)
          bulletItems.push({
            label: "Practice",
            text: item.practice_exercises
              .map((ex) => latexToPlainText(ex))
              .join("; "),
          });
        if (item.self_check)
          bulletItems.push({
            label: "Self-Check",
            text: latexToPlainText(item.self_check),
          });

        bulletItems.forEach(({ label, text }) => {
          addPageIfNeeded(12);
          doc.setFontSize(9);
          doc.setFont(undefined, "bold");
          doc.setTextColor(71, 85, 105);
          doc.text(`  \u2022  ${label}: `, margin + 2, y);
          const labelW = doc.getTextWidth(`  \u2022  ${label}: `);
          doc.setFont(undefined, "normal");
          doc.setTextColor(71, 85, 105);
          const maxW = pageW - margin * 2 - labelW - 4;
          const lines = doc.splitTextToSize(
            text,
            maxW > 40 ? maxW : pageW - margin * 2 - 10,
          );
          if (lines.length === 1) {
            doc.text(lines[0], margin + 2 + labelW, y);
            y += 5;
          } else {
            doc.text(lines[0], margin + 2 + labelW, y);
            y += 5;
            for (let li = 1; li < lines.length; li++) {
              addPageIfNeeded(5);
              doc.text(lines[li], margin + 10, y);
              y += 4.5;
            }
          }
        });
        y += 4;
      });
      y += 6;
    }

    /* ── PART B: Bridge Repairs ── */
    if (bridgeRepairs.length > 0) {
      addPageIfNeeded(30);
      doc.setFillColor(245, 158, 11);
      doc.rect(margin, y - 2, pageW - margin * 2, 10, "F");
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("PART B: BRIDGE REPAIRS", margin + 4, y + 5);
      y += 16;

      bridgeRepairs.forEach((item, idx) => {
        addPageIfNeeded(40);
        const bridgeName = item.bridge_name || item.name || "";
        const bridgeId = item.bridge_id || "";
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(
          `${idx + 1}. Bridge: ${latexToPlainText(bridgeName)}${bridgeId ? ` (${bridgeId})` : ""}`,
          margin,
          y,
        );
        y += 7;

        const bulletItems = [];
        if (item.what_went_wrong)
          bulletItems.push({
            label: "What Went Wrong",
            text: latexToPlainText(item.what_went_wrong),
          });
        if (item.correct_concept)
          bulletItems.push({
            label: "Correct Concept",
            text: latexToPlainText(item.correct_concept),
          });
        if (item.ncert_reference)
          bulletItems.push({
            label: "NCERT Ref",
            text: latexToPlainText(item.ncert_reference),
          });
        if (item.key_formulas_rules?.length > 0)
          bulletItems.push({
            label: "Key Formulas & Rules",
            text: item.key_formulas_rules
              .map((f) => latexToPlainText(f))
              .join("; "),
          });
        if (item.worked_examples?.length > 0) {
          item.worked_examples.forEach((ex) => {
            bulletItems.push({
              label: `Worked Example (${ex.level || "Example"})`,
              text: `Problem: ${latexToPlainText(ex.problem || "")}  Solution: ${latexToPlainText(ex.solution || "")}`,
            });
          });
        }
        if (item.practice_exercises?.length > 0)
          bulletItems.push({
            label: "Practice",
            text: item.practice_exercises
              .map((ex) => latexToPlainText(ex))
              .join("; "),
          });
        if (item.common_traps?.length > 0)
          bulletItems.push({
            label: "Common Traps",
            text: item.common_traps.map((t) => latexToPlainText(t)).join("; "),
          });
        if (item.estimated_time_minutes)
          bulletItems.push({
            label: "Est. Time",
            text: `${item.estimated_time_minutes} minutes`,
          });

        bulletItems.forEach(({ label, text }) => {
          addPageIfNeeded(12);
          doc.setFontSize(9);
          doc.setFont(undefined, "bold");
          doc.setTextColor(71, 85, 105);
          doc.text(`  \u2022  ${label}: `, margin + 2, y);
          const labelW = doc.getTextWidth(`  \u2022  ${label}: `);
          doc.setFont(undefined, "normal");
          doc.setTextColor(71, 85, 105);
          const maxW = pageW - margin * 2 - labelW - 4;
          const lines = doc.splitTextToSize(
            text,
            maxW > 40 ? maxW : pageW - margin * 2 - 10,
          );
          if (lines.length === 1) {
            doc.text(lines[0], margin + 2 + labelW, y);
            y += 5;
          } else {
            doc.text(lines[0], margin + 2 + labelW, y);
            y += 5;
            for (let li = 1; li < lines.length; li++) {
              addPageIfNeeded(5);
              doc.text(lines[li], margin + 10, y);
              y += 4.5;
            }
          }
        });
        y += 4;
      });
      y += 6;
    }

    /* Study Plan Summary in PDF */
    if (
      studyPlanSummary.total_study_time ||
      studyPlanSummary.expected_improvement ||
      studyPlanSummary.priority_order?.length > 0
    ) {
      addPageIfNeeded(20);
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.setTextColor(50, 50, 80);
      doc.text("Study Plan Summary", margin, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.setTextColor(60, 60, 60);
      if (studyPlanSummary.total_study_time) {
        const stLines = doc.splitTextToSize(
          `Total Study Time: ${studyPlanSummary.total_study_time}`,
          pageW - margin * 2 - 6,
        );
        stLines.forEach((line) => {
          addPageIfNeeded(5);
          doc.text(line, margin + 2, y);
          y += 4.5;
        });
        y += 1;
      }
      if (studyPlanSummary.expected_improvement) {
        const eiLines = doc.splitTextToSize(
          `Expected Improvement: ${studyPlanSummary.expected_improvement}`,
          pageW - margin * 2 - 6,
        );
        eiLines.forEach((line) => {
          addPageIfNeeded(5);
          doc.text(line, margin + 2, y);
          y += 4.5;
        });
        y += 1;
      }
      if (studyPlanSummary.priority_order?.length > 0) {
        y += 2;
        doc.setFont(undefined, "bold");
        doc.text("Priority Order:", margin + 2, y);
        y += 5;
        doc.setFont(undefined, "normal");
        studyPlanSummary.priority_order.forEach((p, i) => {
          addPageIfNeeded(5);
          const pLines = doc.splitTextToSize(
            `${i + 1}. ${p}`,
            pageW - margin * 2 - 6,
          );
          pLines.forEach((line) => {
            doc.text(line, margin + 6, y);
            y += 4.5;
          });
        });
      }
      if (studyPlanSummary.tips?.length > 0) {
        y += 3;
        doc.setFont(undefined, "bold");
        doc.text("Study Tips:", margin + 2, y);
        y += 5;
        doc.setFont(undefined, "normal");
        studyPlanSummary.tips.forEach((t, i) => {
          addPageIfNeeded(5);
          const tLines = doc.splitTextToSize(
            `${i + 1}. ${t}`,
            pageW - margin * 2 - 6,
          );
          tLines.forEach((line) => {
            doc.text(line, margin + 6, y);
            y += 4.5;
          });
        });
      }
      y += 6;
    }

    /* Remedial text (full markdown guide) */
    if (remedialText) {
      addPageIfNeeded(20);
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.setTextColor(50, 50, 80);
      doc.text("Comprehensive Remedial Study Guide", margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.setTextColor(60, 60, 60);
      const cleanRemedial = latexToPlainText(remedialText);
      const planLines = doc.splitTextToSize(cleanRemedial, pageW - margin * 2);
      planLines.forEach((line) => {
        addPageIfNeeded(5);
        doc.text(line, margin, y);
        y += 4.5;
      });
    }

    /* Footer */
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const ph = doc.internal.pageSize.getHeight();
      doc.setFontSize(7.5);
      doc.setTextColor(160, 160, 180);
      doc.text("SmartLearners Quiz Report", margin, ph - 8);
      doc.text(`Page ${i} of ${totalPages}`, pageW - margin, ph - 8, {
        align: "right",
      });
    }
    doc.save(`BridgeScan_Class${classNum}_${scorePct}pct.pdf`);
  };

  // Hide the floating mascot on this page to prevent overlap with Study Buddy
  useEffect(() => {
    const mascots = document.querySelectorAll(
      ".floating-mascot-container, .chat-box-container, .chat-toggle-btn",
    );
    mascots.forEach((el) => (el.style.display = "none"));
    return () => {
      mascots.forEach((el) => (el.style.display = ""));
    };
  }, []);

  const toggleSheet = (index) =>
    setExpandedSheets((prev) => ({ ...prev, [index]: !prev[index] }));

  const renderSheetContent = (sheet) => (
    <>
      {sheet.formulas?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 8,
              color: "#4338ca",
            }}
          >
            📐 Formulas & Rules ({sheet.formulas.length})
          </h4>
          {sheet.formulas.map((f, i) => (
            <div
              key={i}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{f.name}</div>
              <MarkdownWithMath content={f.formula} />
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                <strong>When to use:</strong>{" "}
                <MarkdownWithMath content={f.when_to_use} />
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                <strong>Example:</strong>{" "}
                <MarkdownWithMath content={f.example} />
              </div>
            </div>
          ))}
        </div>
      )}
      {sheet.strategies?.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 8,
              color: "#4338ca",
            }}
          >
            💡 Strategies & Tricks ({sheet.strategies.length})
          </h4>
          {sheet.strategies.map((s, i) => (
            <div
              key={i}
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                <MarkdownWithMath content={s.name} />
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                <strong>Trick:</strong> <MarkdownWithMath content={s.trick} />
              </div>
              <div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>
                <strong>Why students miss:</strong>{" "}
                <MarkdownWithMath content={s.why_missed} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  /* ── generate learning path ── */
  const handleGeneratePath = async () => {
    if (!classNum) return;
    const chaptersList = Array.from(
      new Set(questions.map((q) => q.chapter).filter(Boolean)),
    );
    const targetBridges = bridgeSource
      .filter((br) => br.status && br.status !== "intact")
      .map((br) => br.bridge_id)
      .filter(Boolean);
    if (targetBridges.length === 0) {
      setPathError("No broken or weak bridges to target.");
      return;
    }
    setGeneratingPath(true);
    setPathError("");
    try {
      const res = await generateLearningPath({
        class_num: classNum,
        chapters: chaptersList,
        bridge_ids: targetBridges,
        subject: subject,
      });
      // persist learning-path questions against the saved quiz
      if (quizId) {
        try {
          await axiosInstance.updateQuizQuestions(quizId, res.data.questions);
        } catch (_) {
          // best-effort; don't block navigation
        }
      }
      navigate("/quiz-question", {
        state: {
          quizData: res.data,
          classNum,
          selectedChapters: chaptersList,
          learningPath: true,
          subject,
          boardSelection: boardSelection, // PRESERVE
        },
      });
    } catch (err) {
      setPathError(
        err.response?.data?.detail || "Failed to generate learning path.",
      );
    } finally {
      setGeneratingPath(false);
    }
  };

  /* ── Retake: regenerate fresh questions for the same chapters ── */
  /* ── JEE Foundation: skip cheatsheet modal, generate directly  ── */
  /* ── Board: fetch cheatsheet first, then show modal            ── */
  const handleRetakeTest = async () => {
    const chaptersForRetake = state?.selectedChapters || [
      ...new Set(questions.map((q) => q.chapter).filter(Boolean)),
    ];

    if (!classNum || chaptersForRetake.length === 0) {
      setRetakeError("Cannot retake: original quiz configuration not found.");
      return;
    }

    // ── JEE Foundation path: no cheatsheet step, generate directly ──
    if (isJeeFoundation) {
      setRetakeLoading(true);
      setRetakeError("");
      try {
        const res = await generateQuestions({
          class_num: Number(jeeSelectedClass),
          chapters: chaptersForRetake,
          questions_per_chapter: state?.questionsPerChapter || 5,
          subject: jeeSelectedSubject,
          ...(jeeDifficulty && { difficulty_level: jeeDifficulty }),
          ...(state?.selectedSubtopics?.length > 0 && {
            sub_topics: state.selectedSubtopics,
          }),
        });
        navigate("/quiz-question", {
          state: {
            quizData: res.data,
            classNum: Number(jeeSelectedClass),
            selectedChapters: chaptersForRetake,
            questionsPerChapter: state?.questionsPerChapter || 5,
            subject: jeeSelectedSubject,
            selectedSubtopics: state?.selectedSubtopics || [],
            isJeeFoundation: true,
            jeeDifficulty: jeeDifficulty,
            jeeSelectedSubject: jeeSelectedSubject,
            jeeSelectedClass: jeeSelectedClass,
          },
        });
      } catch (err) {
        setRetakeError(
          err.response?.data?.detail ||
            "Failed to generate new questions. Please try again.",
        );
      } finally {
        setRetakeLoading(false);
      }
      return; // ← stop here for JEE, don't fall through to Board path
    }

    // ── Board path: fetch cheatsheet first, then show modal ──
    setLoadingCheatsheet(true);
    setRetakeLoading(true);
    setRetakeError("");

    try {
      const res = await fetchCheatsheet({
        class_num: Number(classNum),
        chapters: chaptersForRetake,
        subject: subject,
        ...(selectedSubtopics.length > 0 && { sub_topics: selectedSubtopics }),
      });

      const raw = res.data;
      const sheets = Array.isArray(raw) ? raw : raw.sheets || [];

      if (sheets.length > 0) {
        setCheatsheetData({
          class_num: Number(classNum),
          total_sheets: sheets.length,
          sheets,
          _retakeConfig: {
            chapters: chaptersForRetake,
            questionsPerChapter: state?.questionsPerChapter || 5,
            subtopics: selectedSubtopics,
          },
        });
        setExpandedSheets(Object.fromEntries(sheets.map((_, i) => [i, true])));
        setShowCheatsheet(true);
        setRetakeLoading(false);
        setLoadingCheatsheet(false);
      } else {
        setLoadingCheatsheet(false);
        await generateAndNavigateRetake(chaptersForRetake);
      }
    } catch (err) {
      console.warn(
        "Cheatsheet not available, generating directly:",
        err.response?.data?.detail,
      );
      setLoadingCheatsheet(false);
      await generateAndNavigateRetake(chaptersForRetake);
    }
  };

  /* ── Helper: generate retake questions and navigate ── */
  const generateAndNavigateRetake = async (chaptersForRetake) => {
    const qPerChapter = state?.questionsPerChapter || 5;

    setRetakeLoading(true);
    setRetaking(true);

    try {
      const res = await generateQuestions({
        class_num: Number(classNum),
        chapters: chaptersForRetake,
        questions_per_chapter: qPerChapter,
        subject: subject,
        ...(selectedSubtopics.length > 0 && { sub_topics: selectedSubtopics }),
      });

      navigate("/quiz-question", {
        state: {
          quizData: res.data,
          classNum: Number(classNum),
          selectedChapters: chaptersForRetake,
          questionsPerChapter: qPerChapter,
          subject: subject,
          isRetake: true,
          boardSelection: boardSelection,
          selectedSubtopics: selectedSubtopics,
        },
      });
    } catch (err) {
      setRetakeError(
        err.response?.data?.detail ||
          "Failed to generate new questions. Please try again.",
      );
      setRetakeLoading(false);
    } finally {
      setRetaking(false);
    }
  };

  /* ── Called when user clicks "Start Test" in cheatsheet modal ── */
  const handleCheatsheetStartTest = async () => {
    setShowCheatsheet(false);
    const config = cheatsheetData?._retakeConfig;
    if (config) {
      await generateAndNavigateRetake(config.chapters);
    }
  };

  /* ── no data state ── */
  if (!state?.evalData) {
    return (
      <div className={`quiz-result-wrapper${isDark ? " dark-mode" : ""}`}>
        <div
          className="quiz-result-content"
          style={{ textAlign: "center", paddingTop: 80 }}
        >
          <h2
            style={{ color: isDark ? "#e0e7ff" : "#1e293b", marginBottom: 16 }}
          >
            No results data
          </h2>
          <button
            className="qr-action-btn primary"
            onClick={() => navigate("/quiz-mode")}
          >
            Start New Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`quiz-result-wrapper${isDark ? " dark-mode" : ""}`}>
      <motion.div
        className="quiz-result-content"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* ════ Premium Banner ════ */}
        <div className="qr-banner">
          <div className="qr-banner-content">
            <div className="qr-banner-badge">🧠 Bridge Scan Report</div>
            <h1 className="qr-banner-title">
              SmartLearners<span className="qr-banner-title-dot">.</span>ai
            </h1>
            <p className="qr-banner-subtitle">
              AI-Powered Thinking Diagnostic &mdash; Tests Decisions, Not
              Computation
            </p>
            <div className="qr-banner-meta">
              <span className="qr-banner-meta-chip">Class {classNum}</span>
              <span className="qr-banner-meta-chip">
                {correct}/{total} Correct
              </span>
              <span className="qr-banner-meta-chip">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* ════ Stat Cards ════ */}
        <div className="qr-stats-row">
          <motion.div
            className="qr-stat-card accent-indigo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 120 }}
          >
            {/* <div className="qr-stat-icon">📊</div> */}
            <div className="qr-stat-value">
              {scorePct}
              <span className="qr-stat-unit">%</span>
            </div>
            <div className="qr-stat-label">Your Score</div>
            <div className="qr-stat-bar">
              <div
                className="qr-stat-bar-fill accent-indigo"
                style={{ width: `${scorePct}%` }}
              />
            </div>
          </motion.div>
          <motion.div
            className="qr-stat-card accent-slate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 120 }}
          >
            {/* <div className="qr-stat-icon">✅</div> */}
            <div className="qr-stat-value">
              {correct}
              <span className="qr-stat-unit">/{total}</span>
            </div>
            <div className="qr-stat-label">Correct</div>
          </motion.div>
          <motion.div
            className="qr-stat-card accent-amber"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 120 }}
          >
            {/* <div className="qr-stat-icon">🎯</div> */}
            <div className="qr-stat-value">
              {prediction.predicted_marks_out_of_100 ?? "—"}
            </div>
            <div className="qr-stat-label">Predicted /100</div>
          </motion.div>
          {/* <motion.div className="qr-stat-card accent-red" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, type: 'spring', stiffness: 120 }}>
            <div className="qr-stat-icon">🔴</div>
            <div className="qr-stat-value">{brokenCount + weakCount}</div>
            <div className="qr-stat-label">Broken Bridges</div>
          </motion.div> */}
          <motion.div
            className="qr-stat-card accent-emerald"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 120 }}
          >
            {/* <div className="qr-stat-icon">⏱</div> */}
            <div className="qr-stat-value">{formatTime(timeSpent)}</div>
            <div className="qr-stat-label">
              Time &middot; SA2: {timeGivenMin}m
            </div>
          </motion.div>
        </div>

        {/* ════ Time Progress Bar ════ */}
        <div className="qr-time-section">
          <div className="qr-time-labels">
            <span>⏱ Time Given (SA2 pace): {timeGivenMin} min</span>
            <span>
              ⏱ Time Taken:{" "}
              <strong className="qr-time-taken">
                {formatTimeDetailed(timeSpent)}
              </strong>
            </span>
          </div>
          <div className="qr-time-bar-track">
            <div
              className="qr-time-bar-fill"
              style={{ width: `${timePct}%` }}
            />
          </div>
          <div className="qr-time-pct">{timePct}% of allotted time used</div>
        </div>

        {/* ════ Question-by-Question Analysis ════ */}
        <div className="qr-glass-section">
          <div className="qr-section-header">
            {/* <span className="section-icon">📊</span> */}
            <h3>Question-by-Question Analysis</h3>
            <span className="qr-header-badge">
              {questions.length} questions answered
            </span>
          </div>
          <div className="qr-section-body qr-table-scroll">
            <table className="qr-table qr-table-striped">
              <thead>
                <tr>
                  <th>Q#</th>
                  <th>Chapter</th>
                  <th>Question</th>
                  <th>Correct Answer</th>
                  <th>Your Answer</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => {
                  const sel = answers[idx] || "";
                  const isCorrect = sel === q.correct_answer;
                  const correctFull = q.options?.[q.correct_answer]
                    ? `${q.correct_answer}) ${q.options[q.correct_answer]}`
                    : q.correct_answer;
                  const yourFull = sel
                    ? q.options?.[sel]
                      ? `${sel}) ${q.options[sel]}`
                      : sel
                    : "—";
                  const bridge = questionBridgeMap[q.question_num];
                  return (
                    <tr key={idx}>
                      <td className="qr-table-center">{q.question_num}</td>
                      <td>{q.chapter}</td>
                      <td className="qr-table-question">
                        <MarkdownWithMath content={q.question} />
                      </td>
                      <td>
                        <MarkdownWithMath content={correctFull} />
                      </td>
                      <td>
                        <MarkdownWithMath content={yourFull} />
                      </td>
                      <td className="qr-table-center">
                        {isCorrect ? "✅" : sel ? "❌" : "⬜"}
                      </td>
                      <td className="qr-table-bridge">
                        {bridge?.bridge_id || ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ════ Bridge Gap Analysis ════ */}
        {bridgeSource.length > 0 && (
          <div className="qr-glass-section">
            <div className="qr-section-header">
              <span className="section-icon">🔥</span>
              <h3>Bridge Gap Analysis</h3>
              <span className="qr-header-badge">
                {bridgeSource.length} bridges tested
              </span>
            </div>
            <div className="qr-section-body qr-table-scroll">
              <table className="qr-table">
                <thead>
                  <tr>
                    <th>Bridge ID</th>
                    <th>Bridge Name</th>
                    <th>Chapter</th>
                    <th>Status</th>
                    <th>Trap / Issue Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {bridgeSource.map((br, idx) => (
                    <tr
                      key={idx}
                      className={`qr-bridge-status-row ${br.status}`}
                    >
                      <td className="qr-table-bridge">{br.bridge_id}</td>
                      <td className="qr-bridge-name-cell">{br.bridge_name}</td>
                      <td>{br.chapter}</td>
                      <td>
                        <span className={`qr-status-badge ${br.status}`}>
                          {statusIcon(br.status)}{" "}
                          {br.status.charAt(0).toUpperCase() +
                            br.status.slice(1)}
                        </span>
                      </td>
                      <td className="qr-table-trap">{br.trap_explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════ Foundation Gap Analysis — Root Causes ════ */}
        {allConcepts.length > 0 && (
          <div className="qr-glass-section">
            <div className="qr-section-header">
              <span className="section-icon">🏛️</span>
              <h3>Foundation Gap Analysis — Root Causes</h3>
            </div>
            <div className="qr-section-body qr-table-scroll">
              <table className="qr-table qr-table-striped">
                <thead>
                  <tr>
                    <th>Concept ID</th>
                    <th>Foundation Concept</th>
                    <th>Class</th>
                    <th>Chapter</th>
                    <th>Affected Bridges</th>
                    <th>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {allConcepts.map((c, idx) => {
                    const affected = cascadeMap[c.id] || [];
                    return (
                      <tr key={idx}>
                        <td className="qr-table-bridge">{c.id}</td>
                        <td>{c.name}</td>
                        <td className="qr-table-center">{c.class ?? "—"}</td>
                        <td>{c.chapter}</td>
                        <td className="qr-table-bridges-list">
                          {affected.join(", ") || "—"}
                        </td>
                        <td className="qr-table-center">
                          <span className="qr-impact-badge">
                            {affected.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════ Bridge Heatmap — Your Cognitive Map ════ */}
        {bridgeSource.length > 0 && (
          <div className="qr-glass-section">
            <div className="qr-section-header">
              <span className="section-icon">🔥</span>
              <h3>Bridge Heatmap — Your Cognitive Map</h3>
            </div>
            <div className="qr-section-body">
              {Object.entries(bridgesByChapter).map(([chapter, bridges]) => {
                const chScore = chapterScoresObj[chapter] || {};
                const chPct = chScore.total
                  ? Math.round((chScore.correct / chScore.total) * 100)
                  : null;
                const chCorrect = chScore.correct ?? 0;
                const chTotal = chScore.total ?? bridges.length;
                const chColor =
                  chPct === null
                    ? "#94a3b8"
                    : chPct >= 70
                      ? "#10b981"
                      : chPct >= 40
                        ? "#f59e0b"
                        : "#ef4444";
                return (
                  <div className="qr-hm-chapter" key={chapter}>
                    <div
                      className="qr-hm-chapter-header"
                      style={{ borderLeftColor: chColor }}
                    >
                      <span
                        className="qr-hm-dot"
                        style={{ backgroundColor: chColor }}
                      />
                      <span
                        className="qr-hm-chapter-name"
                        style={{ color: chColor }}
                      >
                        {chapter}
                      </span>
                      {chPct !== null && (
                        <span
                          className="qr-hm-chapter-score"
                          style={{ color: chColor }}
                        >
                          {chPct}% ({chCorrect}/{chTotal})
                        </span>
                      )}
                    </div>
                    <div className="qr-hm-bridges">
                      {bridges.map((br, idx) => {
                        const barColor =
                          br.status === "intact"
                            ? "#10b981"
                            : br.status === "weak"
                              ? "#f59e0b"
                              : "#ef4444";
                        const barW =
                          br.status === "intact"
                            ? "100%"
                            : br.status === "weak"
                              ? "50%"
                              : "15%";
                        return (
                          <div className={`qr-hm-card ${br.status}`} key={idx}>
                            <div className="qr-hm-card-top">
                              <div className="qr-hm-card-left">
                                <span style={{ marginRight: 6 }}>
                                  {statusIcon(br.status)}
                                </span>
                                <span className="qr-hm-bridge-id">
                                  {br.bridge_id}
                                </span>
                                <span className="qr-hm-sep"> — </span>
                                <span className="qr-hm-bridge-name">
                                  {br.bridge_name}
                                </span>
                              </div>
                              <span className={`qr-status-badge ${br.status}`}>
                                {br.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="qr-hm-bar-track">
                              <div
                                className="qr-hm-bar-fill"
                                style={{
                                  width: barW,
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                            {(br.status === "weak" || br.status === "broken") &&
                              br.trap_explanation && (
                                <div className="qr-hm-trap">
                                  <span className="qr-hm-trap-icon">⚠️</span>
                                  <span>{br.trap_explanation}</span>
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ Repair Suggestions ════ */}
        {(foundationRepairs.length > 0 || bridgeRepairs.length > 0) && (
          <div className="qr-glass-section">
            <div className="qr-section-header">
              <span className="section-icon">🔧</span>
              <h3>Remedial Suggestions</h3>
            </div>
            <div className="qr-section-body">
              {foundationRepairs.length > 0 && (
                <>
                  <div className="qr-repair-subtitle qr-part-a">
                    PART A: FOUNDATION REPAIRS (Fix These First)
                  </div>
                  <div className="qr-repair-list">
                    {foundationRepairs.map((item, idx) => {
                      const key = `fr-${idx}`;
                      const isExpanded = expandedRepair[key];
                      return (
                        <div
                          className={`qr-repair-card ${isExpanded ? "expanded" : ""}`}
                          key={idx}
                          onClick={() => toggleRepair(key)}
                        >
                          <div className="qr-repair-card-header">
                            <span className="qr-repair-icon">🏗</span>
                            {item.concept_id && (
                              <span className="qr-repair-id-badge">
                                {item.concept_id}
                              </span>
                            )}
                            <span className="qr-repair-card-title">
                              {item.concept_name ||
                                item.name ||
                                (typeof item === "string"
                                  ? item
                                  : JSON.stringify(item))}
                            </span>
                            {item.chapter && (
                              <span className="qr-repair-chapter-badge">
                                {item.chapter}
                              </span>
                            )}
                            {item.concept_class && (
                              <span className="qr-repair-class-badge">
                                Class {item.concept_class}
                              </span>
                            )}
                            <span
                              className={`qr-q-expand-icon ${isExpanded ? "open" : ""}`}
                            >
                              ▼
                            </span>
                          </div>
                          {isExpanded && item.concept_explanation && (
                            <div className="qr-repair-card-body">
                              <div className="qr-repair-detail-block">
                                <span className="qr-detail-label">
                                  Explanation
                                </span>
                                <MarkdownWithMath
                                  content={item.concept_explanation}
                                />
                              </div>
                              {item.ncert_reference && (
                                <div className="qr-repair-detail-block">
                                  <span className="qr-detail-label">
                                    NCERT Reference
                                  </span>
                                  <MarkdownWithMath
                                    content={item.ncert_reference}
                                  />
                                </div>
                              )}
                              {item.key_formulas?.length > 0 && (
                                <div className="qr-repair-detail-block">
                                  <span className="qr-detail-label">
                                    Key Formulas
                                  </span>
                                  {item.key_formulas.map((f, i) => (
                                    <div key={i} className="qr-formula-item">
                                      <MarkdownWithMath content={f} />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.worked_example && (
                                <div className="qr-repair-detail-block example">
                                  <span className="qr-detail-label">
                                    Worked Example
                                  </span>
                                  <MarkdownWithMath
                                    content={item.worked_example}
                                  />
                                </div>
                              )}
                              {item.practice_exercises?.length > 0 && (
                                <div className="qr-repair-detail-block">
                                  <span className="qr-detail-label">
                                    Practice Exercises
                                  </span>
                                  <ul>
                                    {item.practice_exercises.map((ex, i) => (
                                      <li key={i}>{ex}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {item.self_check && (
                                <div className="qr-repair-detail-block tip">
                                  <span className="qr-detail-label">
                                    Self Check
                                  </span>
                                  <MarkdownWithMath content={item.self_check} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {bridgeRepairs.length > 0 && (
                <>
                  <div
                    className="qr-repair-subtitle qr-part-b"
                    style={{ marginTop: foundationRepairs.length > 0 ? 24 : 0 }}
                  >
                    PART B: BRIDGE REPAIRS
                  </div>
                  <div className="qr-repair-list">
                    {bridgeRepairs.map((item, idx) => {
                      const key = `br-${idx}`;
                      const isExpanded = expandedRepair[key];
                      return (
                        <div
                          className={`qr-repair-card ${isExpanded ? "expanded" : ""}`}
                          key={idx}
                          onClick={() => toggleRepair(key)}
                        >
                          <div className="qr-repair-card-header">
                            <span className="qr-repair-icon">🌉</span>
                            {item.bridge_id && (
                              <span className="qr-repair-id-badge">
                                {item.bridge_id}
                              </span>
                            )}
                            <span className="qr-repair-card-title">
                              {item.bridge_name ||
                                item.name ||
                                (typeof item === "string"
                                  ? item
                                  : JSON.stringify(item))}
                            </span>
                            {item.chapter && (
                              <span className="qr-repair-chapter-badge">
                                {item.chapter}
                              </span>
                            )}
                            {item.estimated_time_minutes && (
                              <span className="qr-repair-time-badge">
                                ~{item.estimated_time_minutes} min
                              </span>
                            )}
                            <span
                              className={`qr-q-expand-icon ${isExpanded ? "open" : ""}`}
                            >
                              ▼
                            </span>
                          </div>
                          {isExpanded && (
                            <div className="qr-repair-card-body">
                              {item.what_went_wrong && (
                                <div className="qr-repair-detail-block trap">
                                  <span className="qr-detail-label">
                                    What Went Wrong
                                  </span>
                                  <MarkdownWithMath
                                    content={item.what_went_wrong}
                                  />
                                </div>
                              )}
                              {item.correct_concept && (
                                <div className="qr-repair-detail-block">
                                  <span className="qr-detail-label">
                                    Correct Concept
                                  </span>
                                  <MarkdownWithMath
                                    content={item.correct_concept}
                                  />
                                </div>
                              )}
                              {item.ncert_reference && (
                                <div className="qr-repair-detail-block">
                                  <span className="qr-detail-label">
                                    NCERT Reference
                                  </span>
                                  <MarkdownWithMath
                                    content={item.ncert_reference}
                                  />
                                </div>
                              )}
                              {item.key_formulas_rules?.length > 0 && (
                                <div className="qr-repair-detail-block">
                                  <span className="qr-detail-label">
                                    Key Formulas & Rules
                                  </span>
                                  {item.key_formulas_rules.map((f, i) => (
                                    <div key={i} className="qr-formula-item">
                                      <MarkdownWithMath content={f} />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.worked_examples?.length > 0 && (
                                <div className="qr-repair-detail-block example">
                                  <span className="qr-detail-label">
                                    Worked Examples
                                  </span>
                                  {item.worked_examples.map((ex, i) => (
                                    <div key={i} className="qr-worked-example">
                                      <div className="qr-we-level">
                                        {ex.level}
                                      </div>
                                      <div className="qr-we-problem">
                                        <strong>Problem:</strong>{" "}
                                        <MarkdownWithMath
                                          content={ex.problem}
                                        />
                                      </div>
                                      <div className="qr-we-solution">
                                        <strong>Solution:</strong>{" "}
                                        <MarkdownWithMath
                                          content={ex.solution}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.practice_exercises?.length > 0 && (
                                <div className="qr-repair-detail-block">
                                  <span className="qr-detail-label">
                                    Practice Exercises
                                  </span>
                                  <ul>
                                    <MarkdownWithMath
                                      content={item.practice_exercises.join(
                                        "\n",
                                      )}
                                    />
                                  </ul>
                                </div>
                              )}
                              {item.common_traps?.length > 0 && (
                                <div className="qr-repair-detail-block trap">
                                  <span className="qr-detail-label">
                                    Common Traps
                                  </span>
                                  <ul>
                                    <MarkdownWithMath
                                      content={item.common_traps.join("\n")}
                                    />
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ════ Study Plan Summary ════ */}
        {(studyPlanSummary.total_study_time ||
          studyPlanSummary.priority_order?.length > 0 ||
          studyPlanSummary.expected_improvement) && (
          <div className="qr-glass-section">
            <div className="qr-section-header">
              <span className="section-icon">📋</span>
              <h3>Study Plan Summary</h3>
            </div>
            <div className="qr-section-body">
              {/* Key Metrics Table */}
              {(studyPlanSummary.total_study_time ||
                studyPlanSummary.expected_improvement) && (
                <div className="qr-table-scroll">
                  <table className="qr-table qr-sp-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studyPlanSummary.total_study_time && (
                        <tr>
                          <td className="qr-sp-metric-label">
                            ⏱ Total Study Time
                          </td>
                          <td className="qr-sp-metric-value">
                            {studyPlanSummary.total_study_time}
                          </td>
                        </tr>
                      )}
                      {studyPlanSummary.expected_improvement && (
                        <tr>
                          <td className="qr-sp-metric-label">
                            📈 Expected Improvement
                          </td>
                          <td className="qr-sp-metric-value">
                            {studyPlanSummary.expected_improvement}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Priority Order */}
              {studyPlanSummary.priority_order?.length > 0 && (
                <div className="qr-sp-block">
                  <div className="qr-sp-block-title"> Priority Order</div>
                  <div className="qr-sp-ordered-list">
                    {studyPlanSummary.priority_order.map((p, i) => (
                      <div key={i}>
                        <MarkdownWithMath content={p} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {studyPlanSummary.tips?.length > 0 && (
                <div className="qr-sp-block">
                  <div className="qr-sp-block-title">💡 Study Tips</div>
                  <div className="qr-sp-tips-grid">
                    {studyPlanSummary.tips.map((t, i) => (
                      <div className="qr-sp-tip-card" key={i}>
                        <span className="qr-sp-tip-num">{i + 1}</span>
                        <MarkdownWithMath content={t} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ Remedial Study Guide ════ */}
        {remedialText && (
          <div className="qr-glass-section">
            <div className="qr-section-header">
              <span className="section-icon">📚</span>
              <h3>Remedial Study Guide</h3>
            </div>
            <div className="qr-section-body">
              <div
                className={`qr-remedial-container ${showFullRemedial ? "expanded" : "collapsed"}`}
              >
                <div className="qr-markdown">
                  <MarkdownWithMath content={remedialText} />
                </div>
              </div>
              <button
                className="qr-show-more-btn"
                onClick={() => setShowFullRemedial(!showFullRemedial)}
              >
                {showFullRemedial ? "▲ Show Less" : "▼ Show Full Study Guide"}
              </button>
            </div>
          </div>
        )}

        {/* ════ Score-Gated Actions ════ */}
        {isJeeFoundation ? (
          <motion.div
            className="qr-selfstudy-banner"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, type: "spring", stiffness: 90 }}
          >
            {/* Level badge */}
            <div style={{ marginBottom: 8 }}>
              {jeeDifficulty === "Easy" && (
                <span className="jee-result-badge easy">Level 1 — Easy</span>
              )}
              {jeeDifficulty === "Medium" && (
                <span className="jee-result-badge medium">
                  Level 2 — Medium
                </span>
              )}
              {jeeDifficulty === "Hard" && (
                <span className="jee-result-badge hard">Level 3 — Hard</span>
              )}
              {!jeeDifficulty && (
                <span className="jee-result-badge mixed">Mixed</span>
              )}
            </div>

            <div className="qr-ss-trophy">{scorePct >= 60 ? "🏆" : "📖"}</div>
            <h2 className="qr-ss-title">Test Completed!</h2>
            <p className="qr-ss-score">
              You scored <strong>{Number(scorePct).toFixed(0)}%</strong>
              {scorePct >= 60 ? " — great work!" : " — keep pushing!"}
            </p>

            {/* ── Easy level ── */}
            {jeeDifficulty === "Easy" && (
              <>
                <p className="qr-ss-message">
                  {scorePct >= 60
                    ? "You've cleared Level 1. Ready to move up to Level 2 — Medium?"
                    : "You scored below 60% on Easy. You can retake this level or push ahead to Medium."}
                </p>
                <div className="qr-ss-actions">
                  {scorePct < 60 && (
                    <button
                      className="qr-ss-btn secondary"
                      onClick={async () => {
                        setRetakeLoading(true);
                        setRetakeError("");
                        try {
                          const res = await generateQuestions({
                            class_num: Number(jeeSelectedClass),
                            chapters: state?.selectedChapters || [],
                            questions_per_chapter:
                              state?.questionsPerChapter || 5,
                            subject: jeeSelectedSubject,
                            difficulty_level: "Easy",
                            ...(state?.selectedSubtopics?.length > 0 && {
                              sub_topics: state.selectedSubtopics,
                            }),
                          });
                          navigate("/quiz-question", {
                            state: {
                              quizData: res.data,
                              classNum: Number(jeeSelectedClass),
                              selectedChapters: state?.selectedChapters || [],
                              questionsPerChapter:
                                state?.questionsPerChapter || 5,
                              subject: jeeSelectedSubject,
                              selectedSubtopics: state?.selectedSubtopics || [],
                              isJeeFoundation: true,
                              jeeDifficulty: "Easy",
                              jeeSelectedSubject,
                              jeeSelectedClass,
                            },
                          });
                        } catch (err) {
                          setRetakeError(
                            err.response?.data?.detail ||
                              "Failed to regenerate questions.",
                          );
                        } finally {
                          setRetakeLoading(false);
                        }
                      }}
                      disabled={retakeLoading}
                    >
                      {retakeLoading
                        ? "Preparing…"
                        : "🔁 Retake Level 1 — Easy"}
                    </button>
                  )}
                  <button
                    className="qr-ss-btn primary"
                    onClick={handleNextLevel}
                    disabled={retakeLoading}
                  >
                    {retakeLoading
                      ? "Preparing…"
                      : "⬆️ Move to Level 2 — Medium"}
                  </button>
                </div>
              </>
            )}

            {/* ── Medium level ── */}
            {jeeDifficulty === "Medium" && (
              <>
                <p className="qr-ss-message">
                  {scorePct >= 60
                    ? "You've cleared Level 2. Ready for the hardest level?"
                    : "You scored below 60% on Medium. Retake to strengthen the concepts or push on to Hard."}
                </p>
                <div className="qr-ss-actions">
                  {scorePct < 60 && (
                    <button
                      className="qr-ss-btn secondary"
                      onClick={async () => {
                        setRetakeLoading(true);
                        setRetakeError("");
                        try {
                          const res = await generateQuestions({
                            class_num: Number(jeeSelectedClass),
                            chapters: state?.selectedChapters || [],
                            questions_per_chapter:
                              state?.questionsPerChapter || 5,
                            subject: jeeSelectedSubject,
                            difficulty_level: "Medium",
                            ...(state?.selectedSubtopics?.length > 0 && {
                              sub_topics: state.selectedSubtopics,
                            }),
                          });
                          navigate("/quiz-question", {
                            state: {
                              quizData: res.data,
                              classNum: Number(jeeSelectedClass),
                              selectedChapters: state?.selectedChapters || [],
                              questionsPerChapter:
                                state?.questionsPerChapter || 5,
                              subject: jeeSelectedSubject,
                              selectedSubtopics: state?.selectedSubtopics || [],
                              isJeeFoundation: true,
                              jeeDifficulty: "Medium",
                              jeeSelectedSubject,
                              jeeSelectedClass,
                            },
                          });
                        } catch (err) {
                          setRetakeError(
                            err.response?.data?.detail ||
                              "Failed to regenerate questions.",
                          );
                        } finally {
                          setRetakeLoading(false);
                        }
                      }}
                      disabled={retakeLoading}
                    >
                      {retakeLoading
                        ? "Preparing…"
                        : "🔁 Retake Level 2 — Medium"}
                    </button>
                  )}
                  <button
                    className="qr-ss-btn primary"
                    onClick={handleNextLevel}
                    disabled={retakeLoading}
                  >
                    {retakeLoading ? "Preparing…" : "⬆️ Move to Level 3 — Hard"}
                  </button>
                </div>
              </>
            )}

            {/* ── Hard level ── */}
            {jeeDifficulty === "Hard" && (
              <>
                <p className="qr-ss-message">
                  {scorePct >= 60
                    ? "Excellent! You've conquered Level 3 — Hard. Time to go deep with Self Study."
                    : "Below 60% on Hard. Retake to master these concepts or go to Self Study for in-depth practice."}
                </p>
                <div className="qr-ss-actions">
                  {scorePct < 60 && (
                    <button
                      className="qr-ss-btn secondary"
                      onClick={async () => {
                        setRetakeLoading(true);
                        setRetakeError("");
                        try {
                          const res = await generateQuestions({
                            class_num: Number(jeeSelectedClass),
                            chapters: state?.selectedChapters || [],
                            questions_per_chapter:
                              state?.questionsPerChapter || 5,
                            subject: jeeSelectedSubject,
                            difficulty_level: "Hard",
                            ...(state?.selectedSubtopics?.length > 0 && {
                              sub_topics: state.selectedSubtopics,
                            }),
                          });
                          navigate("/quiz-question", {
                            state: {
                              quizData: res.data,
                              classNum: Number(jeeSelectedClass),
                              selectedChapters: state?.selectedChapters || [],
                              questionsPerChapter:
                                state?.questionsPerChapter || 5,
                              subject: jeeSelectedSubject,
                              selectedSubtopics: state?.selectedSubtopics || [],
                              isJeeFoundation: true,
                              jeeDifficulty: "Hard",
                              jeeSelectedSubject,
                              jeeSelectedClass,
                            },
                          });
                        } catch (err) {
                          setRetakeError(
                            err.response?.data?.detail ||
                              "Failed to regenerate questions.",
                          );
                        } finally {
                          setRetakeLoading(false);
                        }
                      }}
                      disabled={retakeLoading}
                    >
                      {retakeLoading
                        ? "Preparing…"
                        : "🔁 Retake Level 3 — Hard"}
                    </button>
                  )}
                  {/* Self Study — navigates to StudentDash with JEE prefill */}
                  <button
                    className="qr-ss-btn primary"
                    onClick={() => {
                      navigate("/student-dash", {
                        state: {
                          prefill: {
                            isJeeFoundation: true,
                            source: "jee_testprep",
                            fromQuizResult: true,
                            // If we have exact Board IDs from jeeSelection, use them directly.
                            // Otherwise fall back to the old fuzzy-match path.
                            ...(jeeSelection
                              ? {
                                  // Direct path — exact Board IDs, no re-resolution needed
                                  classCode: jeeSelection.classCode,
                                  subjectCode: jeeSelection.subjectCode,
                                  subjectName: jeeSelection.subjectName,
                                  chapterCode: jeeSelection.chapterCode,
                                  chapterName: jeeSelection.chapterName,
                                  subtopics: jeeSelection.subtopics || [],
                                  hasExactBoardIds: true,
                                }
                              : {
                                  // Fallback fuzzy path (jeeSelection not available)
                                  classCode: String(jeeSelectedClass),
                                  subjectCode: jeeSelectedSubject,
                                  subjectName: jeeSelectedSubject,
                                  chapterName:
                                    (state?.selectedChapters || [])[0] || "",
                                  subtopics: state?.selectedSubtopics || [],
                                  hasExactBoardIds: false,
                                }),
                          },
                          autoFetch: true,
                        },
                      });
                    }}
                  >
                    🚀 Go to Self Study
                  </button>
                </div>
              </>
            )}

            {/* ── Mixed / null difficulty ── */}
            {!jeeDifficulty && (
              <>
                <p className="qr-ss-message">
                  Review your results above and try a specific level next.
                </p>
                <div className="qr-ss-actions">
                  <button
                    className="qr-ss-btn primary"
                    onClick={() => navigate("/quiz-mode")}
                  >
                    🔄 Take Another Test
                  </button>
                  <button className="qr-ss-btn secondary" onClick={downloadPDF}>
                    📥 Download Report
                  </button>
                </div>
              </>
            )}

            {retakeError && (
              <p
                style={{ color: "#ef4444", marginTop: 12, fontSize: "0.85rem" }}
              >
                {retakeError}
              </p>
            )}

            <p className="qr-ss-footnote">
              JEE Foundation — Level 1 Easy → Level 2 Medium → Level 3 Hard
            </p>
          </motion.div>
        ) : scorePct >= 60 || !isRetake ? (
          /* ─── Board: PASS or 1st attempt: Self Study Unlocked ──────────────── */
          <motion.div
            className="qr-selfstudy-banner"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, type: "spring", stiffness: 90 }}
          >
            {scorePct >= 60 && (
              <div className="qr-ss-fireworks" aria-hidden="true">
                🎉 ✨ 🎊
              </div>
            )}
            <div className="qr-ss-trophy">{scorePct >= 60 ? "🏆" : "📖"}</div>{" "}
            <h2 className="qr-ss-title">Test Completed!</h2>
            <p className="qr-ss-score">
              You scored <strong>{Number(scorePct).toFixed(0)}%</strong>
              {scorePct >= 60
                ? " — above the 60% mastery mark"
                : " — keep going, every attempt builds understanding"}
            </p>
            <p className="qr-ss-message">
              {scorePct >= 60 ? (
                <>
                  You've demonstrated strong conceptual understanding of these
                  chapters.
                  <br />
                  You are now eligible to move to <strong>Self Study</strong> —
                  explore questions, get AI explanations, and solve problems at
                  your own pace.
                </>
              ) : (
                <>
                  Self Study is unlocked for you — use it to revisit concepts at
                  your own pace, get AI-powered hints, and strengthen the gaps
                  identified above.
                  <br />
                  You can also retake this test anytime to track your
                  improvement.
                </>
              )}
            </p>
            <div className="qr-ss-actions">
              <button
                className="qr-ss-btn primary"
                onClick={() => {
                  navigate("/student-dash", {
                    state: boardSelection
                      ? {
                          prefill: {
                            classCode: boardSelection.classCode,
                            className: boardSelection.className,
                            subjectCode: boardSelection.subjectCode,
                            subjectName: boardSelection.subjectName,
                            chapterCode: boardSelection.chapterCode,
                            chapterName: boardSelection.chapterName,
                            subtopics: boardSelection.subtopics || [],
                            source: "testprep",
                            fromQuizResult: true,
                          },
                          // NEW FLAG — skip wizard, go straight to QuestionListModal
                          autoFetch: true,
                        }
                      : undefined,
                  });
                }}
              >
                🚀 Go to Self Study
              </button>
              <button className="qr-ss-btn secondary" onClick={downloadPDF}>
                📥 Download Report
              </button>
              {/* Show retake option inside pass card when 1st attempt score was low */}
              {!isRetake && scorePct < 60 && (
                <button
                  className="qr-ss-btn secondary"
                  onClick={handleRetakeTest}
                  disabled={retakeLoading}
                  style={{ marginTop: 4 }}
                >
                  {retakeLoading ? "Preparing…" : "🔁 Retry This Level"}
                </button>
              )}
            </div>
            <p className="qr-ss-footnote">
              Self Study lets you practice any chapter with AI-powered hints,
              solutions, and gap analysis.
            </p>
          </motion.div>
        ) : (
          /* ─── Board: FAIL: Retake Card + Original Buttons ───────────────────── */
          <>
            {/* Original action buttons unchanged */}
            <div className="qr-actions">
              <button
                className="qr-action-btn primary"
                onClick={handleGeneratePath}
                disabled={generatingPath}
              >
                📘 Generate Learning Path
              </button>
              <button
                className="qr-action-btn primary"
                onClick={() => navigate("/quiz-mode")}
              >
                🔄 Take Another Test
              </button>
              <button
                className="qr-action-btn primary"
                onClick={downloadPDF}
                style={{
                  background: "linear-gradient(135deg,#10b981,#059669)",
                  boxShadow: "0 8px 24px rgba(16,185,129,.3)",
                }}
              >
                📥 Download PDF Report
              </button>
              <button
                className="qr-action-btn secondary"
                onClick={() => navigate("/student-dash")}
              >
                🏠 Dashboard
              </button>
              {pathError && (
                <div className="qr-error-msg" style={{ marginTop: 8 }}>
                  {pathError}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
      {/* ════ Learning Path Generation Overlay ════ */}
      <AnimatePresence>
        {generatingPath && (
          <motion.div
            className="qr-path-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="qr-path-overlay-content"
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="qr-path-orbit">
                <div className="qr-path-orbit-ring" />
                <div className="qr-path-orbit-ring ring2" />
                <div className="qr-path-orbit-ring ring3" />
                <div className="qr-path-orbit-icon">🔍</div>
              </div>
              <h3 className="qr-path-overlay-title">
                Building Your Learning Path
              </h3>
              <p className="qr-path-overlay-sub">
                AI is analyzing {brokenCount + weakCount} broken bridge
                {brokenCount + weakCount !== 1 ? "s" : ""} and crafting targeted
                practice questions...
              </p>
              <div className="qr-path-steps">
                <motion.div
                  className="qr-path-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="qr-path-step-icon">🔍</span>
                  <span>Analyzing weak concepts</span>
                </motion.div>
                <motion.div
                  className="qr-path-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <span className="qr-path-step-icon">🧩</span>
                  <span>Mapping knowledge gaps</span>
                </motion.div>
                <motion.div
                  className="qr-path-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 }}
                >
                  <span className="qr-path-step-icon">📝</span>
                  <span>Generating practice questions</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Retake Loading Overlay */}
      <AnimatePresence>
        {retakeLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 12, 41, 0.92)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: 48,
                height: 48,
                border: "4px solid rgba(255,255,255,0.15)",
                borderTopColor: "#818cf8",
                borderRadius: "50%",
                marginBottom: 24,
              }}
            />
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                color: "#e0e7ff",
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              🔁 Generating New Questions...
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.9rem",
                textAlign: "center",
                maxWidth: 300,
              }}
            >
              Fresh questions are being prepared for the same chapters. This
              usually takes a few seconds.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ════ Cheatsheet Modal for Retake ════ */}
      {createPortal(
        <AnimatePresence>
          {showCheatsheet && cheatsheetData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheatsheet(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                zIndex: 9998,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: isDark ? "#1e293b" : "#fff",
                  borderRadius: 20,
                  width: "100%",
                  maxWidth: 640,
                  maxHeight: "85vh",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "20px 24px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>
                      📋 Revision Cheatsheet
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>
                      Class {cheatsheetData.class_num} ·{" "}
                      {cheatsheetData.total_sheets} chapter
                      {cheatsheetData.total_sheets > 1 ? "s" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCheatsheet(false)}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      color: "#fff",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      fontSize: 18,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Body */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 24,
                    color: isDark ? "#e2e8f0" : "#1e293b",
                  }}
                >
                  {cheatsheetData.sheets.map((sheet, idx) => (
                    <div key={idx} style={{ marginBottom: 20 }}>
                      <button
                        onClick={() => toggleSheet(idx)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          background: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "#f1f5f9",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                          borderRadius: 12,
                          cursor: "pointer",
                          color: isDark ? "#e2e8f0" : "#1e293b",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        <span>
                          Ch {sheet.chapter_num} — {sheet.chapter}
                        </span>
                        <span style={{ fontSize: 12, opacity: 0.6 }}>
                          {sheet.formulas?.length || 0} formulas ·{" "}
                          {sheet.strategies?.length || 0} strategies
                          {expandedSheets[idx] ? " ▲" : " ▼"}
                        </span>
                      </button>
                      {expandedSheets[idx] && (
                        <div style={{ padding: "12px 0" }}>
                          {renderSheetContent(sheet)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: "16px 24px",
                    borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <button
                    onClick={() => setShowCheatsheet(false)}
                    style={{
                      flex: 1,
                      padding: "14px 20px",
                      borderRadius: 12,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0"}`,
                      background: "transparent",
                      color: isDark ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Done Revising
                  </button>
                  <button
                    onClick={handleCheatsheetStartTest}
                    disabled={retaking}
                    style={{
                      flex: 2,
                      padding: "14px 20px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: retaking ? "not-allowed" : "pointer",
                      opacity: retaking ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
                    }}
                  >
                    {retaking ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          style={{
                            width: 16,
                            height: 16,
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#fff",
                            borderRadius: "50%",
                          }}
                        />
                        Generating...
                      </>
                    ) : (
                      "🚀 Start Test"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
      // AFTER (both Board AND JEE)
      <QuizResultChatPanel
        evalData={evalData}
        questions={questions}
        answers={answers}
        classNum={classNum}
        subject={subject}
        timeSpent={timeSpent}
        onRetake={handleRetakeTest}
      />
    </div>
  );
};

export default QuizResult;
