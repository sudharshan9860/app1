// src/components/QuizResultChatPanel.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import MarkdownWithMath from "./MarkdownWithMath";
import "./QuizResultChatPanel.css";

const API_URL = "https://chatbot.smartlearners.ai";
const api = axios.create({ baseURL: API_URL, timeout: 300000 });

// Maps "0"→"A", "1"→"B", "2"→"C", "3"→"D"
const NUM_TO_LETTER = { 0: "A", 1: "B", 2: "C", 3: "D" };

// Normalises any option key or answer to a letter
// handles: "0"→"A", "b"→"B", "B"→"B", 1→"B"
const toLetterKey = (key) =>
  NUM_TO_LETTER[String(key)] ?? String(key).toUpperCase();

// ─── Build answer map from answers array or object ───────────────────────────
const buildAnswerMap = (questions = [], answers = []) => {
  const map = {};
  if (Array.isArray(answers)) {
    answers.forEach((a) => {
      map[a.question_num] = a.selected_option;
    });
  } else if (answers && typeof answers === "object") {
    Object.entries(answers).forEach(([idx, val]) => {
      const qNum = questions[Number(idx)]?.question_num;
      if (qNum !== undefined) map[qNum] = val;
    });
  }
  return map;
};

// ─── Build per-question enriched data ────────────────────────────────────────
const buildQuestionByQuestion = (questions = [], answers = []) => {
  const answerMap = buildAnswerMap(questions, answers);
  return questions.map((q) => {
    const selected = answerMap[q.question_num] || "";
    // FIXED
    const isCorrect =
      toLetterKey(selected ?? "") === toLetterKey(q.correct_answer ?? "");
    const isTrapHit = selected === q.trap_answer;
    return {
      question_num: q.question_num,
      chapter: q.chapter || "",
      bridge_id: q.bridge_id || "",
      bridge_name: q.bridge_name || "",
      concept_tested: q.concept_tested || "",
      question: q.question || "",
      options: q.options || {},
      correct_answer: q.correct_answer || "",
      selected_option: selected,
      is_correct: isCorrect,
      is_unanswered: selected === "",
      trap_hit: isTrapHit,
      trap_answer: q.trap_answer || "",
      trap_explanation: isTrapHit ? q.trap_explanation || "" : "",
    };
  });
};

// ─── Parse a similar-question block out of AI response text ──────────────────
// Looks for a block starting with "Try a similar question:" and extracts
// question text, options (A/B/C/D or 0)/1)/2)/3) prefixed), and correct answer.
const parseSimilarQuestion = (text) => {
  if (!text) return null;

  // Must contain the trigger phrase
  const triggerMatch = text.match(/try a similar question[:\s]*/i);
  if (!triggerMatch) return null;

  const afterTrigger = text.slice(
    text.search(/try a similar question[:\s]*/i) + triggerMatch[0].length,
  );

  // Extract question text — everything up to the first option line
  const questionMatch = afterTrigger.match(
    /^([\s\S]+?)(?=\n\s*(?:[A-D][).:]|[0-3][).:]))/i,
  );
  const questionText = questionMatch ? questionMatch[1].trim() : "";

  if (!questionText) return null;

  // Extract options — support both "A) text", "A. text", "0) text", "1) text" formats
  const optionRegex = /^\s*([A-D0-3])[).:\s]+(.+)$/gim;
  const options = {};
  let match;
  const optionLines = afterTrigger.split("\n");

  // Map numeric keys to letters
  const numToLetter = { 0: "A", 1: "B", 2: "C", 3: "D" };

  for (const line of optionLines) {
    const m = line.match(/^\s*([A-D0-3])[).:\s]+(.+)$/i);
    if (m) {
      const rawKey = m[1].toUpperCase();
      // Convert numeric key to letter if needed
      const key = numToLetter[rawKey] || rawKey;
      options[key] = m[2].trim();
    }
  }

  if (Object.keys(options).length < 2) return null;

  // Extract correct answer — look for "Correct answer: C" or "Answer: C)" etc.
  const correctMatch = afterTrigger.match(
    /(?:correct\s+)?answer[:\s]+([A-D0-3])[).:\s]*/i,
  );
  let correctAnswer = correctMatch ? correctMatch[1].toUpperCase() : null;
  // Normalise numeric correct answer to letter
  if (correctAnswer && numToLetter[correctAnswer]) {
    correctAnswer = numToLetter[correctAnswer];
  }

  return {
    question: questionText,
    options,
    correctAnswer,
    // The text before the similar question block (the explanation part)
    explanationText: text
      .slice(0, text.search(/try a similar question[:\s]*/i))
      .trim(),
  };
};

// ─── Interactive Similar Question MCQ component ───────────────────────────────
const SimilarQuestionMCQ = ({ parsed, onNext }) => {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (!parsed) return null;

  const { question, options, correctAnswer, explanationText } = parsed;
  const isCorrect = submitted && selected === correctAnswer;

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
  };

  return (
    <div className="sq-wrapper">
      {/* Show the explanation text above the MCQ */}
      {explanationText && (
        <div className="sq-explanation">
          <MarkdownWithMath content={explanationText} />
        </div>
      )}

      <div className="sq-card">
        <div className="sq-header">
          <span className="sq-icon">🔁</span>
          <span className="sq-label">Try a similar question</span>
        </div>

        <p className="sq-question">
          <MarkdownWithMath content={question} />
        </p>

        <div className="sq-options">
          {Object.entries(options).map(([rawKey, value]) => {
            const key = toLetterKey(rawKey); // always "A" "B" "C" "D"
            const correctLetter = toLetterKey(correctAnswer);
            const isSelected = selected === key;

            // Build CSS class based on state
            let optClass = "sb-option";
            if (submitted) {
              if (key === correctLetter) optClass += " sb-correct";
              else if (isSelected) optClass += " sb-wrong";
              else optClass += " sb-dimmed";
            } else if (isSelected) {
              optClass += " sb-selected";
            }

            return (
              <label
                key={key}
                className={optClass}
                onClick={() => !submitted && setSelected(key)}
              >
                <span className="sb-radio-dot" />
                <span className="sb-option-key">{key}</span>
                <span className="sb-option-text">
                  <MarkdownWithMath content={String(value)} />
                </span>
              </label>
            );
          })}
        </div>

        {!submitted ? (
          <button
            className="sq-submit-btn"
            onClick={handleSubmit}
            disabled={!selected}
          >
            Submit Answer
          </button>
        ) : (
          <div
            className={`sq-result ${isCorrect ? "sq-result-correct" : "sq-result-wrong"}`}
          >
            {isCorrect ? (
              <>
                <span className="sq-result-icon">✅</span>
                <span>Correct! Well done — you got it!</span>
              </>
            ) : (
              <>
                <span className="sq-result-icon">❌</span>
                <span>
                  Not quite. The correct answer is{" "}
                  <strong>{correctAnswer}</strong>
                  {options[correctAnswer] ? `) ${options[correctAnswer]}` : ""}
                </span>
              </>
            )}
            {onNext && (
              <button className="sq-next-btn" onClick={onNext}>
                Move to Next Question →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Build the structured query sent to /test-prep-analysis ──────────────────
const buildStructuredQuery = (
  questions = [],
  answers = [],
  classNum,
  subject,
) => {
  const qbq = buildQuestionByQuestion(questions, answers);
  const wrong = qbq.filter((q) => !q.is_correct && !q.is_unanswered);
  if (wrong.length === 0) return JSON.stringify({ questions: [] });

  const blocks = wrong.map((q, idx) => {
    const optionLine = Object.entries(q.options || {})
      .map(([letter, text]) => `${letter}) ${text}`)
      .join(" | ");
    const trap =
      q.trap_explanation ||
      "Review the concept carefully before attempting similar questions.";
    return [
      `Q${idx + 1}. ${q.question}`,
      `Chapter: ${q.chapter || "N/A"}`,
      `Options: ${optionLine}`,
      `Correct Answer: ${q.correct_answer}`,
      `Student Answer: ${q.selected_option}`,
      `Trap: ${trap}`,
    ].join("\n");
  });

  return blocks.join("\n\n");
};

// ─── Local fallback if API is unreachable ─────────────────────────────────────
const buildLocalFallback = (evalData, classNum, subject) => {
  const prediction = evalData?.prediction || {};
  const remedialPlan = evalData?.remedial_plan || {};
  const bridgeRepairs = (remedialPlan.bridge_repairs || []).slice(0, 3);
  const studyPlanSummary = remedialPlan.study_plan_summary || {};
  const scorePct = (prediction.score_pct ?? 0).toFixed(0);
  const correct = prediction.correct ?? 0;
  const total = prediction.total ?? 0;
  return `## Your Quiz Analysis — Class ${classNum} ${subject}\n\n**Score: ${scorePct}% (${correct}/${total} correct)**\n\n${studyPlanSummary.expected_improvement || "Keep practising!"}\n\n### Key Concepts to Fix\n${bridgeRepairs.map((b) => `- **${b.bridge_name}**: ${b.what_went_wrong || ""}`).join("\n") || "- Review the chapters attempted."}`;
};

// ─── Score Review Panel (Image 1) ────────────────────────────────────────────
const ScoreReviewPanel = ({
  questions,
  answerMap,
  totalCorrect,
  totalQuestions,
}) => (
  <div className="sb-score-panel">
    <div className="sb-score-header">
      Hey there! 👋 You scored{" "}
      <strong>
        {totalCorrect}/{totalQuestions}
      </strong>
      . Let's review your answers!
    </div>
    <div className="sb-question-list">
      {questions.map((q, idx) => {
        const selected = answerMap[q.question_num] || "";
        const isCorrect = selected && selected === q.correct_answer;
        return (
          <div
            key={idx}
            className={`sb-question-row ${isCorrect ? "correct" : "wrong"}`}
          >
            <span className="sb-q-icon">{isCorrect ? "✅" : "❌"}</span>
            <span className="sb-q-text">
              {idx + 1}. <MarkdownWithMath content={q.question} />
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Wrong Question Panel (Images 2–5) ───────────────────────────────────────
const WrongQuestionPanel = ({
  wrongQ,
  originalQ,
  answerMap,
  mcqPhase,
  mcqShowing,
  selectedOption,
  setSelectedOption,
  answerResult,
  onTestConcept,
  onAnswer,
  onNextQuestion,
  onPracticeSimilar,
  currentIdx,
  total,
}) => {
  const studentAnswer = originalQ
    ? answerMap[originalQ.question_num] || "—"
    : "—";
  const correctAnswer = originalQ?.correct_answer || "—";
  const currentMcq = wrongQ?.[mcqPhase];

  // Normalize options: API returns an array ["opt1","opt2",...] with correct as "A"/"B"/...
  // Convert to letter-keyed entries so selectedOption matches correct answer format
  const mcqOptions = (() => {
    if (!currentMcq?.options) return [];
    const opts = currentMcq.options;
    if (Array.isArray(opts)) {
      // Array → letter-keyed entries: [["A","opt1"],["B","opt2"],...]
      return opts.map((text, i) => [String.fromCharCode(65 + i), text]);
    }
    // Already an object (e.g. {"A":"opt1","B":"opt2"}) → use as-is
    return Object.entries(opts);
  })();

  return (
    <div className="sb-wrong-q-panel">
      {/* Progress indicator */}
      <div className="sb-progress-row">
        <span className="sb-progress-label">
          Question {currentIdx + 1} of {total}
        </span>
        <div className="sb-progress-bar">
          <div
            className="sb-progress-fill"
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Original question header */}
      <div className="sb-original-q">
        <div className="sb-original-q-title">
          <span className="sb-book-icon">📖</span>
          <MarkdownWithMath
            content={originalQ?.question || wrongQ?.originalQuestion || ""}
          />
        </div>
        <div className="sb-answer-line">
          You said: <span className="sb-wrong-ans">{studentAnswer}</span>
          {" → "}
          Correct: <span className="sb-correct-ans">{correctAnswer}</span>
        </div>
      </div>

      {/* Concept card */}
      {wrongQ?.conceptCard && (
        <div className="sb-concept-card">
          <div className="sb-concept-title">💡 {wrongQ.conceptCard.title}</div>
          <div className="sb-concept-body">{wrongQ.conceptCard.concept}</div>
          {wrongQ.conceptCard.whereYouWentWrong && (
            <div className="sb-went-wrong">
              ⚠️ {wrongQ.conceptCard.whereYouWentWrong}
            </div>
          )}
        </div>
      )}

      {/* Test This Concept button — shown BEFORE MCQ */}
      {!mcqShowing && !answerResult && (
        <div className="sb-btn-row">
          <button className="sb-test-concept-btn" onClick={onTestConcept}>
            Test This Concept
          </button>
        </div>
      )}

      {/* MCQ block */}
      {mcqShowing && currentMcq && !answerResult && (
        <div className="sb-mcq-block">
          <div className="sb-mcq-label">
            {mcqPhase === "mcq2"
              ? "🔄 Try a similar question:"
              : "📝 Test yourself:"}
          </div>
          <div className="sb-mcq-question">
            <MarkdownWithMath content={currentMcq.question} />
          </div>
          <div className="sb-mcq-options">
            {mcqOptions.map(([key, text]) => (
              <div
                key={key}
                className={`sb-mcq-option ${selectedOption === key ? "selected" : ""}`}
                onClick={() => setSelectedOption(key)}
              >
                <span className="sb-mcq-key">{key})</span>
                <MarkdownWithMath content={text} />
              </div>
            ))}
          </div>
          {selectedOption && (
            <button
              className="sb-submit-btn"
              onClick={() => onAnswer(selectedOption, currentMcq.correct)}
            >
              Submit Answer
            </button>
          )}
        </div>
      )}

      {/* Answer result feedback */}
      {answerResult === "correct" && (
        <div className="sb-result-row">
          <div className="sb-correct-feedback">
            <span className="sb-correct-msg">✅ Correct! Great job! 🎉</span>
          </div>
          <div className="sb-btn-row">
            <button className="sb-next-btn" onClick={onNextQuestion}>
              Move to Next Question
            </button>
          </div>
        </div>
      )}

      {answerResult === "wrong" && mcqPhase === "mcq1" && (
        <div className="sb-result-row">
          <div className="sb-wrong-feedback">
            <span className="sb-wrong-msg">
              ❌ Not quite. Let's try a similar question to reinforce this.
            </span>
          </div>
          <div className="sb-btn-row">
            <button className="sb-similar-btn" onClick={onPracticeSimilar}>
              Practice Similar Question
            </button>
          </div>
        </div>
      )}

      {answerResult === "wrong" && mcqPhase === "mcq2" && (
        <div className="sb-result-row">
          <div className="sb-wrong-feedback">
            <span className="sb-wrong-msg">
              ❌ Keep practicing this concept — you'll get it!
            </span>
          </div>
          <div className="sb-btn-row">
            <button className="sb-next-btn" onClick={onNextQuestion}>
              Move to Next Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const QuizResultChatPanel = ({
  evalData,
  questions,
  answers,
  classNum,
  subject,
  timeSpent,
  onRetake, // NEW PROP
}) => {
  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisTriggered, setAnalysisTriggered] = useState(false);

  // Study Buddy flow state
  const [chatPhase, setChatPhase] = useState("loading"); // loading | scoreReview | tackling | done
  const [analysisData, setAnalysisData] = useState(null); // parsed JSON from /test-prep-analysis
  const [errorMsg, setErrorMsg] = useState(null);

  // Wrong question flow state
  const [currentWrongIdx, setCurrentWrongIdx] = useState(0);
  const [mcqPhase, setMcqPhase] = useState("mcq1"); // mcq1 | mcq2
  const [mcqShowing, setMcqShowing] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerResult, setAnswerResult] = useState(null); // correct | wrong | null

  const messagesEndRef = useRef(null);
  const autoSentRef = useRef(false);

  // Build answer map once
  const answerMap = useMemo(
    () => buildAnswerMap(questions, answers),
    [questions, answers],
  );

  // Wrong questions from parsed analysis
  const wrongQuestions = useMemo(
    () => analysisData?.questions || [],
    [analysisData],
  );

  // Find original question object matching a wrong question entry
  const findOriginalQuestion = (wrongQ) => {
    if (!wrongQ) return null;
    // wrongQ.questionId = "Q1", "Q2" etc — backend numbers them by wrong index
    // We match by finding the wrong answer at that position in questions array
    const wrongQbq = buildQuestionByQuestion(questions, answers).filter(
      (q) => !q.is_correct && !q.is_unanswered,
    );
    const idx = parseInt((wrongQ.questionId || "Q1").replace("Q", ""), 10) - 1;
    const enriched = wrongQbq[idx];
    if (!enriched) return null;
    return (
      questions.find((q) => q.question_num === enriched.question_num) || null
    );
  };

  const totalCorrect = evalData?.prediction?.correct ?? 0;

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatPhase, mcqShowing, answerResult, currentWrongIdx]);

  // Create session on mount
  useEffect(() => {
    if (!evalData) return;
    createSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createSession = async () => {
    try {
      const qbq = buildQuestionByQuestion(questions, answers);
      const quizSummary = {
        subject,
        class_num: classNum,
        score_pct: evalData?.prediction?.score_pct ?? 0,
        correct: evalData?.prediction?.correct ?? 0,
        total: evalData?.prediction?.total ?? questions.length,
        chapter_breakdown: evalData?.graph_data?.chapter_breakdown ?? [],
        broken_bridges: (evalData?.analysis?.bridge_results || [])
          .filter((b) => b.status === "broken")
          .map((b) => b.bridge_name),
        weak_bridges: (evalData?.analysis?.bridge_results || [])
          .filter((b) => b.status === "weak")
          .map((b) => b.bridge_name),
        priority_repairs:
          evalData?.remedial_plan?.study_plan_summary?.priority_order ?? [],
        expected_improvement:
          evalData?.remedial_plan?.study_plan_summary?.expected_improvement ||
          "",
        question_by_question: qbq,
      };

      const formData = new FormData();
      formData.append(
        "student_name",
        localStorage.getItem("fullName") ||
          localStorage.getItem("username") ||
          "Student",
      );
      formData.append("class_name", String(classNum) || "default_class");
      formData.append("user_type", "student");
      formData.append(
        "exam_data",
        JSON.stringify({ quiz_result: quizSummary }),
      );
      formData.append("json_data", JSON.stringify({ data: {} }));
      formData.append("self_data", JSON.stringify({}));

      const res = await api.post("/create_session", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res.data?.session_id) throw new Error("No session_id returned");
      setSessionId(res.data.session_id);
      setSessionReady(true);
    } catch (err) {
      console.error("QuizResultChatPanel: session creation failed", err);
      setSessionReady(true);
      setErrorMsg(
        "Could not connect to AI analysis service. Showing score review only.",
      );
    }
  };

  // Auto-open and trigger analysis once session is ready
  useEffect(() => {
    if (!sessionReady || autoSentRef.current) return;
    autoSentRef.current = true;
    setIsOpen(true);
    const timer = setTimeout(() => triggerAutoAnalysis(), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady]);

  const triggerAutoAnalysis = async () => {
    const prompt = buildStructuredQuery(questions, answers, classNum, subject);
    setIsLoading(true);
    setAnalysisTriggered(true);
    setChatPhase("loading");

    // If no wrong questions, skip API call
    if (prompt === JSON.stringify({ questions: [] })) {
      setAnalysisData({ questions: [] });
      setChatPhase("scoreReview");
      setIsLoading(false);
      return;
    }

    if (!sessionId) {
      // Offline fallback — show score review with no drill-down
      setChatPhase("scoreReview");
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.post(
        "/test-prep-analysis",
        { session_id: sessionId, query: prompt, language: "en" },
        { headers: { session_token: sessionId } },
      );

      const rawReply = res?.data?.response || res?.data?.reply || "";
      console.log("✅ /test-prep-analysis raw response:", rawReply);

      let parsed = null;
      try {
        parsed = JSON.parse(rawReply);
      } catch {
        // Not valid JSON
      }

      if (parsed?.questions) {
        setAnalysisData(parsed);
      } else {
        // Response isn't in expected JSON format — still show score review
        setAnalysisData({ questions: [] });
        setErrorMsg("AI analysis returned in unexpected format. Review below.");
      }
      setChatPhase("scoreReview");
    } catch (err) {
      console.error("QuizResultChatPanel: /test-prep-analysis failed", err);
      setAnalysisData({ questions: [] });
      setChatPhase("scoreReview");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Tackle flow handlers ─────────────────────────────────────────────────
  const startTackling = () => {
    setChatPhase("tackling");
    setCurrentWrongIdx(0);
    setMcqPhase("mcq1");
    setMcqShowing(false);
    setSelectedOption(null);
    setAnswerResult(null);
  };

  const handleTestConcept = () => {
    setMcqShowing(true);
    setSelectedOption(null);
    setAnswerResult(null);
  };

  const handleAnswer = (selected, correct) => {
    if (selected === correct) {
      setAnswerResult("correct");
    } else {
      setAnswerResult("wrong");
    }
  };

  const handleNextQuestion = () => {
    const isLast = currentWrongIdx >= wrongQuestions.length - 1;
    if (isLast) {
      setChatPhase("done");
    } else {
      setCurrentWrongIdx((prev) => prev + 1);
      setMcqPhase("mcq1");
      setMcqShowing(false);
      setSelectedOption(null);
      setAnswerResult(null);
    }
  };

  const handlePracticeSimilar = () => {
    setMcqPhase("mcq2");
    setMcqShowing(true);
    setSelectedOption(null);
    setAnswerResult(null);
  };

  if (!evalData) return null;

  return (
    <div className={`qrcp-wrapper ${isOpen ? "open" : "closed"}`}>
      {/* Toggle Button */}
      <button
        className={`qrcp-toggle-btn ${isOpen ? "active" : ""} ${analysisTriggered && !isOpen ? "pulse" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="qrcp-toggle-icon">{isOpen ? "✕" : "🤖"}</span>
        <span className="qrcp-toggle-label">
          {isOpen ? "Close" : "Study Buddy"}
        </span>
        {!isOpen && analysisTriggered && <span className="qrcp-badge">1</span>}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="qrcp-panel">
          {/* Header */}
          <div className="qrcp-header">
            <div className="qrcp-header-left">
              <span className="qrcp-header-icon">🤖</span>
              <div>
                <div className="qrcp-header-title">Study Buddy</div>
                <div className="qrcp-header-sub">Your learning assistant</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="qrcp-messages" ref={messagesEndRef}>
            {/* PHASE: loading */}
            {chatPhase === "loading" && (
              <div className="qrcp-thinking" style={{ margin: "auto" }}>
                <span className="qrcp-dot" />
                <span className="qrcp-dot" />
                <span className="qrcp-dot" />
                <span
                  style={{
                    marginLeft: 8,
                    color: "#6366f1",
                    fontSize: "0.85rem",
                  }}
                >
                  Analyzing your quiz results...
                </span>
              </div>
            )}

            {/* PHASE: scoreReview */}
            {chatPhase === "scoreReview" && (
              <>
                {/* Bot message bubble wrapping score panel */}
                <div className="sb-bot-bubble">
                  <ScoreReviewPanel
                    questions={questions}
                    answerMap={answerMap}
                    totalCorrect={totalCorrect}
                    totalQuestions={questions.length}
                  />
                </div>

                {errorMsg && (
                  <div className="sb-bot-bubble">
                    <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>
                      ⚠️ {errorMsg}
                    </span>
                  </div>
                )}

                {wrongQuestions.length > 0 ? (
                  <div className="sb-bot-bubble">
                    <div className="sb-tackle-msg">
                      You got <strong>{wrongQuestions.length}</strong> question
                      {wrongQuestions.length > 1 ? "s" : ""} wrong. Want to work
                      through them together?
                    </div>
                    <button className="sb-tackle-btn" onClick={startTackling}>
                      Let's Tackle Them Together
                    </button>
                  </div>
                ) : (
                  <div className="sb-bot-bubble">
                    <div className="sb-correct-msg">
                      🎉 Perfect score! You answered everything correctly.
                      Amazing work!
                    </div>
                  </div>
                )}
              </>
            )}

            {/* PHASE: tackling */}
            {chatPhase === "tackling" && wrongQuestions[currentWrongIdx] && (
              <div className="sb-bot-bubble">
                <WrongQuestionPanel
                  wrongQ={wrongQuestions[currentWrongIdx]}
                  originalQ={findOriginalQuestion(
                    wrongQuestions[currentWrongIdx],
                  )}
                  answerMap={answerMap}
                  mcqPhase={mcqPhase}
                  mcqShowing={mcqShowing}
                  selectedOption={selectedOption}
                  setSelectedOption={setSelectedOption}
                  answerResult={answerResult}
                  onTestConcept={handleTestConcept}
                  onAnswer={handleAnswer}
                  onNextQuestion={handleNextQuestion}
                  onPracticeSimilar={handlePracticeSimilar}
                  currentIdx={currentWrongIdx}
                  total={wrongQuestions.length}
                />
              </div>
            )}

            {/* PHASE: done */}
            {chatPhase === "done" && (
              <div className="sb-bot-bubble">
                <div className="sb-done-panel">
                  <div className="sb-done-msg">
                    🎉 Great work reviewing all your mistakes! You're getting
                    better with every attempt.
                  </div>
                  <button
                    className="sb-retake-btn"
                    onClick={() => {
                      setIsOpen(false);
                      if (onRetake) {
                        setTimeout(() => onRetake(), 300);
                      }
                    }}
                  >
                    🔁 Retake Test — Same Chapters
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResultChatPanel;
