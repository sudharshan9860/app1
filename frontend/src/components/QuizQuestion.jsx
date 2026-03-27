import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { evaluateAnswers } from "../api/quizApi";
import MarkdownWithMath from "./MarkdownWithMath";
import AlertBox from "./AlertBox";
import "./QuizQuestion.css";

const QuizQuestion = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [isDark] = useState(() => {
    try {
      return localStorage.getItem("darkMode") === "true";
    } catch {
      return false;
    }
  });

  const quizData = state?.quizData;
  const questions = quizData?.questions || [];
  const classNum = state?.classNum;
  const subject = state?.subject || "PHYSICS";
  const timeSpent = state?.timeSpent || 0;
  const boardSelection = state?.boardSelection;
  const learningPath = state?.learningPath || false;
  // ── Retake mode (set by QuizResult.handleRetakeTest) ──────────────
  const isRetake = state?.isRetake || false;

  const [answers, setAnswers] = useState({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  // automatic evaluation only when explicitly in learning path mode
  const autoEval = learningPath;

  const questionRefs = useRef([]);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // ── Scroll to top when question page first loads ──
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []); // empty deps — runs once on mount only

  useEffect(() => {
    if (!quizData) return;
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [quizData]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const selectAnswer = useCallback((idx, optionKey) => {
    setAnswers((prev) => ({ ...prev, [idx]: optionKey }));
    // in auto-eval mode we can optionally scroll to next or show feedback automatically
  }, []);

  const scrollToQuestion = (idx) => {
    questionRefs.current[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  const showSubmit = !learningPath;

  // Redirect if no data
  if (!quizData || questions.length === 0) {
    return (
      <div className={`quiz-question-wrapper${isDark ? " dark-mode" : ""}`}>
        <div
          className="quiz-question-content"
          style={{ textAlign: "center", paddingTop: 80 }}
        >
          <h2
            style={{ color: isDark ? "#e0e7ff" : "#1e293b", marginBottom: 16 }}
          >
            No quiz data found
          </h2>
          <button
            className="quiz-nav-btn next"
            onClick={() => navigate("/quiz-mode")}
          >
            Go to Test Prep
          </button>
        </div>
      </div>
    );
  }

  const getQuizFigureSrc = (figure) => {
    if (!figure) return null;
    if (figure.startsWith("data:")) return figure;
    // JPEG signatures
    if (figure.startsWith("/9j/") || figure.startsWith("9j/")) {
      const b64 = figure.startsWith("/") ? figure : "/" + figure;
      return `data:image/jpeg;base64,${b64}`;
    }
    // PNG / default
    return `data:image/png;base64,${figure}`;
  };

  const handleSubmit = async () => {
    setShowSubmitModal(false);
    setEvaluating(true);
    setError("");
    clearInterval(timerRef.current);

    const answerPayload = questions.map((q, idx) => ({
      question_num: q.question_num,
      selected_option: answers[idx] || "",
    }));

    try {
      const res = await evaluateAnswers({
        class_num: classNum,
        questions: questions,
        answers: answerPayload,
        subject: subject,
      });

      navigate("/quiz-result", {
        state: {
          evalData: res.data,
          questions,
          answers,
          classNum,
          timeSpent: elapsed,
          quizData,
          subject,
          boardSelection: state?.boardSelection,
          selectedChapters: state?.selectedChapters, // ← ADD (already exists in some paths)
          selectedSubtopics: state?.selectedSubtopics, // ← ADD THIS
          questionsPerChapter: state?.questionsPerChapter,
          // ── NEW: pass JEE Foundation context through ──
          isJeeFoundation: state?.isJeeFoundation || false,
          jeeDifficulty: state?.jeeDifficulty || null,
        },
      });
    } catch (err) {
      setEvaluating(false);
      setError(
        err.response?.data?.detail || "Evaluation failed. Please try again.",
      );
    }
  };

  return (
    <div className={`quiz-question-wrapper${isDark ? " dark-mode" : ""}`}>
      {alertMsg && (
        <div className="alert-container">
          <AlertBox
            message={alertMsg}
            type="warning"
            onClose={() => setAlertMsg("")}
          />
        </div>
      )}
      {/* Sticky Top Bar */}
      <div className="quiz-sticky-header">
        <div className="quiz-top-bar">
          <div className="quiz-top-left">
            <div className="quiz-top-title">Test Prep — Class {classNum}</div>
            <div className="quiz-top-subtitle">
              {quizData.total_questions} questions |{" "}
              {state?.selectedChapters?.join(", ")}
              {learningPath && (
                <span
                  style={{
                    marginLeft: 8,
                    fontStyle: "italic",
                    fontSize: "0.8rem",
                  }}
                >
                  (practice mode)
                </span>
              )}
            </div>
            {isRetake && (
              <div className="quiz-retake-banner">
                🔁 Retake mode — fresh questions generated. Score ≥ 60% to show
                mastery!
              </div>
            )}
          </div>
          <div
            className={`quiz-timer-box ${elapsed > 1800 ? "danger" : elapsed > 900 ? "warning" : ""}`}
          >
            <span className="quiz-timer-icon">⏱</span>
            <span className="quiz-timer-value">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="quiz-progress-section">
          <div className="quiz-progress-bar-track">
            <div
              className="quiz-progress-bar-fill"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
          <div className="quiz-progress-stats">
            <span className="quiz-progress-stat">
              <strong>{answeredCount}</strong> of{" "}
              <strong>{questions.length}</strong> answered
            </span>
          </div>
        </div>

        {/* Question dots */}
        <div className="quiz-dots-nav">
          {questions.map((_, idx) => (
            <button
              key={idx}
              className={`quiz-dot ${answers[idx] ? "answered" : ""}`}
              onClick={() => scrollToQuestion(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-question-content">
        {/* Error */}
        {error && (
          <div className="quiz-error-msg" style={{ marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {/* All Questions */}
        <div className="quiz-questions-list">
          {questions.map((q, idx) => (
            <motion.div
              key={idx}
              ref={(el) => (questionRefs.current[idx] = el)}
              className={`quiz-question-card ${answers[idx] ? "card-answered" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              {/* Question Header */}
              <div className="quiz-q-header">
                <div className="quiz-q-number">
                  <span className="quiz-q-badge">Q{q.question_num}</span>
                  <span className="quiz-q-chapter">{q.chapter}</span>
                </div>
                {q.bridge_name && (
                  <span className="quiz-q-bridge">{q.bridge_name}</span>
                )}
                {answers[idx] && (
                  <span className="quiz-q-answered-tag">Answered</span>
                )}
              </div>

              {/* Question text */}
              <div className="quiz-q-text">
                <MarkdownWithMath content={q.question} />
                {q.figure && (
                  <div className="quiz-question-figure">
                    <img
                      src={getQuizFigureSrc(q.figure)}
                      alt={`Figure for question ${q.question_num}`}
                      className="quiz-question-figure-img"
                    />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="quiz-options">
                {Object.entries(q.options).map(([key, value]) => {
                  const isSelected = answers[idx] === key;
                  let extraCls = "";
                  if (autoEval && answers[idx]) {
                    if (key === q.correct_answer) extraCls = "correct";
                    else if (isSelected) extraCls = "incorrect";
                  }

                  return (
                    <motion.button
                      key={key}
                      className={`quiz-option ${isSelected ? "selected" : ""} ${extraCls}`.trim()}
                      onClick={() => selectAnswer(idx, key)}
                      whileTap={{ scale: 0.98 }}
                      disabled={autoEval && !!answers[idx]}
                    >
                      <span className="quiz-option-letter">{key}</span>
                      <span className="quiz-option-text">
                        <MarkdownWithMath content={value} />
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              {/* auto-eval feedback */}
              {autoEval && answers[idx] && learningPath && (
                <div className="quiz-auto-feedback">
                  {answers[idx] === q.correct_answer ? (
                    <p className="correct-msg">✅ Correct</p>
                  ) : (
                    <p className="incorrect-msg">
                      ❌ Wrong. Correct: <strong>{q.correct_answer}</strong>{" "}
                      {q.options[q.correct_answer]
                        ? `) ${q.options[q.correct_answer]}`
                        : ""}
                    </p>
                  )}
                  {q.solution && (
                    <div className="solution">
                      <strong>Solution:</strong>{" "}
                      <MarkdownWithMath content={q.solution} />
                    </div>
                  )}
                  {q.trap_warning && (
                    <div className="solution">
                      <strong>Trap Warning:</strong>{" "}
                      <MarkdownWithMath content={q.trap_warning} />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Submit / Return buttons at bottom */}
        <div className="quiz-submit-bar">
          {showSubmit && (
            <button
              className="quiz-nav-btn submit"
              onClick={() => {
                if (answeredCount < questions.length) {
                  setAlertMsg(
                    `Please answer all the questions. You have ${unansweredCount} unanswered question${unansweredCount > 1 ? "s" : ""}.`,
                  );
                  return;
                }
                setShowSubmitModal(true);
              }}
            >
              Submit Test ({answeredCount}/{questions.length} answered)
            </button>
          )}
          {learningPath && (
            <button
              className="quiz-nav-btn next"
              onClick={() => navigate("/quiz-mode")}
            >
              Back to Test Prep
            </button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmit && (
        <AnimatePresence>
          {showSubmitModal && (
            <motion.div
              className="quiz-submit-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitModal(false)}
            >
              <motion.div
                className="quiz-submit-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Submit Test?</h3>
                <div className="quiz-submit-stats">
                  <div className="quiz-submit-stat">
                    <div className="stat-num green">{answeredCount}</div>
                    <div className="stat-label">Answered</div>
                  </div>
                  <div className="quiz-submit-stat">
                    <div className="stat-num gray">{unansweredCount}</div>
                    <div className="stat-label">Unanswered</div>
                  </div>
                </div>
                {unansweredCount > 0 && (
                  <p className="quiz-submit-warning">
                    You have {unansweredCount} unanswered question
                    {unansweredCount > 1 ? "s" : ""}.
                  </p>
                )}
                <div className="quiz-submit-actions">
                  <button
                    className="cancel-btn"
                    onClick={() => setShowSubmitModal(false)}
                  >
                    Go Back
                  </button>
                  <button className="confirm-btn" onClick={handleSubmit}>
                    Confirm Submit
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Evaluating overlay v2 ── */}
      {/* ── Evaluating overlay v3 — GPU composited ── */}
      {evaluating && (
        <div className="quiz-evaluating-overlay">
          {/* Floating particles — translateY + opacity only */}
          <div className="eval-particles">
            {[
              {
                x: "7%",
                d: "5s",
                dl: "0s",
                sz: "5px",
                bg: "rgba(99,102,241,0.8)",
              },
              {
                x: "14%",
                d: "6.2s",
                dl: "0.8s",
                sz: "7px",
                bg: "rgba(139,92,246,0.7)",
              },
              {
                x: "23%",
                d: "4.4s",
                dl: "1.3s",
                sz: "4px",
                bg: "rgba(192,132,252,0.65)",
              },
              {
                x: "33%",
                d: "7s",
                dl: "0.3s",
                sz: "6px",
                bg: "rgba(99,102,241,0.6)",
              },
              {
                x: "44%",
                d: "5.5s",
                dl: "1.9s",
                sz: "4px",
                bg: "rgba(139,92,246,0.8)",
              },
              {
                x: "56%",
                d: "4.8s",
                dl: "0.6s",
                sz: "7px",
                bg: "rgba(99,102,241,0.55)",
              },
              {
                x: "66%",
                d: "6.8s",
                dl: "2.2s",
                sz: "5px",
                bg: "rgba(192,132,252,0.7)",
              },
              {
                x: "76%",
                d: "5.2s",
                dl: "1.6s",
                sz: "4px",
                bg: "rgba(139,92,246,0.65)",
              },
              {
                x: "84%",
                d: "7.2s",
                dl: "1s",
                sz: "6px",
                bg: "rgba(99,102,241,0.7)",
              },
              {
                x: "92%",
                d: "4.2s",
                dl: "2.5s",
                sz: "5px",
                bg: "rgba(192,132,252,0.55)",
              },
            ].map((p, i) => (
              <div
                key={i}
                className="eval-particle"
                style={{
                  "--px": p.x,
                  "--pd": p.d,
                  "--pdl": p.dl,
                  "--psz": p.sz,
                  "--pbg": p.bg,
                }}
              />
            ))}
          </div>

          {/* Orbit system */}
          <div className="eval-orbit-container">
            <div className="eval-glow-inner" />
            <div className="eval-glow-inner2" />

            <div className="eval-ring eval-ring-1" />
            <div className="eval-ring eval-ring-2" />
            <div className="eval-ring eval-ring-3" />

            {/*
        Arm-node pattern:
        - The arm div rotates (evalSpinCW / evalSpinCCW)
        - The node div just sits at a fixed translateX — no CSS var in transform
        This lets the browser composite each arm on its own GPU layer
      */}

            {/* Outer ring — 3 arms, 120° apart, each with its own delay */}
            <div
              className="eval-dot-arm"
              style={{
                "--arm-t": "2s",
                "--arm-dl": "0s",
                transform: "rotate(0deg)",
              }}
            >
              <div
                className="eval-dot-node"
                style={{
                  "--dot-c": "#6366f1",
                  "--dot-sz": "10px",
                  "--dot-r": "107px",
                }}
              />
            </div>
            <div
              className="eval-dot-arm"
              style={{
                "--arm-t": "2s",
                "--arm-dl": "0s",
                transform: "rotate(120deg)",
              }}
            >
              <div
                className="eval-dot-node"
                style={{
                  "--dot-c": "#8b5cf6",
                  "--dot-sz": "10px",
                  "--dot-r": "107px",
                }}
              />
            </div>
            <div
              className="eval-dot-arm"
              style={{
                "--arm-t": "2s",
                "--arm-dl": "0s",
                transform: "rotate(240deg)",
              }}
            >
              <div
                className="eval-dot-node"
                style={{
                  "--dot-c": "#c084fc",
                  "--dot-sz": "10px",
                  "--dot-r": "107px",
                }}
              />
            </div>

            {/* Middle ring — 1 slower dot */}
            <div
              className="eval-dot-arm ccw"
              style={{
                "--arm-t": "2.8s",
                "--arm-dl": "0s",
                transform: "rotate(60deg)",
              }}
            >
              <div
                className="eval-dot-node"
                style={{
                  "--dot-c": "rgba(139,92,246,0.75)",
                  "--dot-sz": "7px",
                  "--dot-r": "87px",
                }}
              />
            </div>

            <div className="eval-brain">🧠</div>
          </div>

          {/* Text + progress */}
          <div className="eval-text-section">
            <h3 className="eval-title">Evaluating your answers…</h3>
            <p className="eval-subtitle">
              Our AI is scanning your bridge knowledge
            </p>

            {/* Progress bar — scaleX transform, sheen overlay */}
            <div className="eval-bar-track" style={{ position: "relative" }}>
              <div className="eval-bar-fill" />
              <div className="eval-bar-sheen" />
            </div>
            <div className="eval-bar-label">Analysing…</div>

            <div className="eval-tips">
              <div className="eval-tip-highlight">
                <span style={{ fontSize: 16 }}>⚡</span>
                <span>
                  Analysing {questions.length} question
                  {questions.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="eval-tip-row" style={{ "--tip-dl": "0.4s" }}>
                <span style={{ fontSize: 16 }}>🔗</span>
                <span>Identifying concept bridges &amp; gaps</span>
              </div>
              <div className="eval-tip-row" style={{ "--tip-dl": "0.8s" }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <span>Preparing your personalised report</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;
