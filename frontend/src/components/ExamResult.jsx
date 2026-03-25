// ExamResult.jsx - Component to display exam results
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Table,
  ProgressBar,
  Badge,
  Collapse,
  Accordion,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faCheckCircle,
  faTimesCircle,
  faMinusCircle,
  faClock,
  faChartBar,
  faRedo,
  faHome,
  faArrowRight,
  faMedal,
  faFire,
  faPercent,
  faListOl,
  faBook,
  faExclamationTriangle,
  faLightbulb,
  faGraduationCap,
  faCommentDots,
  faChevronDown,
  faChevronUp,
  faStar,
  faImage,
  faRoad,
  faCalendarAlt,
  faHourglassHalf,
  faSpinner,
  faCheckDouble,
  faPlay,
  faQuestion,
  faBrain,
  faBookOpen,
  faTasks,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "../api/axiosInstance";
import "./ExamResult.css";
import MarkdownWithMath from "./MarkdownWithMath";
import { getImageSrc } from "../utils/imageUtils";

function ExamResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    questionResults = [],
    examStats = {},
    metadata = {},
    apiResponse,
  } = location.state || {};

  console.log("apiResponse", apiResponse);
  // console.log("exam_id", apiResponse.exam_id);

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // State for showing detailed results
  const [showDetails, setShowDetails] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  // Learning path states
  const [showLearningPathModal, setShowLearningPathModal] = useState(false);
  const [learningPathLoading, setLearningPathLoading] = useState(false);
  const [learningPathData, setLearningPathData] = useState(null);
  const [learningPathId, setLearningPathId] = useState(null);
  const [learningPathError, setLearningPathError] = useState(null);
  const [learningPathForm, setLearningPathForm] = useState({
    total_days: 7,
    duration: "30",
  });
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [expandedDayQuestions, setExpandedDayQuestions] = useState({});

  // Redirect if no results
  useEffect(() => {
    if (!questionResults || questionResults.length === 0) {
      navigate("/exam-mode");
    }
  }, [questionResults, navigate]);

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

  // Format time spent
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Get grade based on percentage
  const getGrade = (percentage) => {
    if (percentage >= 90)
      return { grade: "A+", color: "#10b981", label: "Excellent!" };
    if (percentage >= 80)
      return { grade: "A", color: "#22c55e", label: "Great Job!" };
    if (percentage >= 70)
      return { grade: "B+", color: "#84cc16", label: "Good Work!" };
    if (percentage >= 60)
      return { grade: "B", color: "#eab308", label: "Nice Try!" };
    if (percentage >= 50)
      return { grade: "C", color: "#f59e0b", label: "Keep Practicing!" };
    if (percentage >= 40)
      return { grade: "D", color: "#f97316", label: "Needs Improvement" };
    return { grade: "F", color: "#ef4444", label: "Try Again" };
  };

  const gradeInfo = getGrade(parseFloat(examStats.percentage || 0));

  // Get topic-wise analysis
  const getTopicAnalysis = () => {
    const topicMap = {};
    questionResults.forEach((result) => {
      if (!topicMap[result.topic]) {
        topicMap[result.topic] = {
          total: 0,
          correct: 0,
          marks: 0,
          maxMarks: 0,
        };
      }
      topicMap[result.topic].total += 1;
      topicMap[result.topic].maxMarks += result.maxMarks;
      topicMap[result.topic].marks += result.marks || 0;
      if (result.marks === result.maxMarks) {
        topicMap[result.topic].correct += 1;
      }
    });

    return Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      ...data,
      percentage:
        data.maxMarks > 0 ? ((data.marks / data.maxMarks) * 100).toFixed(0) : 0,
    }));
  };

  // Toggle expanded question
  const toggleQuestion = (index) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Get score color based on percentage
  const getScoreColor = (score, maxMarks) => {
    const percentage = maxMarks > 0 ? (score / maxMarks) * 100 : 0;
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "warning";
    if (percentage > 0) return "info";
    return "danger";
  };

  const topicAnalysis = getTopicAnalysis();

  // Generate Learning Path
  const handleGenerateLearningPath = async () => {
    if (!apiResponse?.exam_id) {
      setLearningPathError("Exam ID not found. Please try again.");
      return;
    }

    setLearningPathLoading(true);
    setLearningPathError(null);
    setShowLearningPathModal(false);

    try {
      const formData = new FormData();
      formData.append("exam_id", apiResponse.exam_id);
      formData.append("total_days", learningPathForm.total_days);
      formData.append("duration", learningPathForm.duration);

      const response = await axiosInstance.post("/learning-path/", formData);
      setLearningPathId(response.data.plan_id);

      if (response.data?.learning_path) {
        setLearningPathData(response.data.learning_path);
        setActiveDayIndex(0);
      } else {
        setLearningPathError("No learning path data received.");
      }
    } catch (error) {
      console.error("Learning path error:", error);
      setLearningPathError(
        error.response?.data?.error ||
          error.message ||
          "Failed to generate learning path. Please try again.",
      );
    } finally {
      setLearningPathLoading(false);
    }
  };

  // Handle form input changes
  const handleLearningPathFormChange = (e) => {
    const { name, value } = e.target;
    setLearningPathForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle day question expansion
  const toggleDayQuestion = (dayIndex, questionIndex) => {
    const key = `${dayIndex}-${questionIndex}`;
    setExpandedDayQuestions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Navigate between days
  const goToPreviousDay = () => {
    if (activeDayIndex > 0) setActiveDayIndex(activeDayIndex - 1);
  };

  const goToNextDay = () => {
    if (
      learningPathData?.daily_plans &&
      activeDayIndex < learningPathData.daily_plans.length - 1
    ) {
      setActiveDayIndex(activeDayIndex + 1);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (level) => {
    const normalizedLevel = level?.toLowerCase() || "";
    if (normalizedLevel === "easy") return "success";
    if (normalizedLevel === "medium") return "warning";
    if (normalizedLevel === "hard") return "danger";
    return "secondary";
  };

  // Reset learning path
  const resetLearningPath = () => {
    setLearningPathData(null);
    setLearningPathError(null);
    setActiveDayIndex(0);
    setExpandedDayQuestions({});
  };

  return (
    <div className={`exam-result-wrapper ${isDarkMode ? "dark-mode" : ""}`}>
      {/* Result Header */}
      <div className="result-header">
        <div
          className="result-grade-circle"
          style={{ borderColor: gradeInfo.color }}
        >
          <span className="grade-letter" style={{ color: gradeInfo.color }}>
            {gradeInfo.grade}
          </span>
        </div>
        <h1 className="result-title1">Exam Completed!</h1>
        <p className="result-subtitle">{gradeInfo.label}</p>
      </div>

      {/* Score Card */}
      <Card className="score-card">
        <Card.Body>
          <Row>
            <Col md={4} className="score-section">
              <div className="score-circle">
                <div className="score-value">{examStats.percentage}%</div>
                <div className="score-label">Score</div>
              </div>
            </Col>
            <Col md={8}>
              <Row className="stats-row">
                <Col xs={6} md={3}>
                  <div className="stat-box correct">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span className="stat-number">
                      {examStats.correctAnswers}
                    </span>
                    <span className="stat-text">Correct</span>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="stat-box incorrect">
                    <FontAwesomeIcon icon={faTimesCircle} />
                    <span className="stat-number">
                      {examStats.incorrectAnswers}
                    </span>
                    <span className="stat-text">Incorrect</span>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="stat-box unanswered">
                    <FontAwesomeIcon icon={faMinusCircle} />
                    <span className="stat-number">{examStats.unanswered}</span>
                    <span className="stat-text">Skipped</span>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="stat-box time">
                    <FontAwesomeIcon icon={faClock} />
                    <span className="stat-number">
                      {formatTime(examStats.totalTimeSpent)}
                    </span>
                    <span className="stat-text">Time</span>
                  </div>
                </Col>
              </Row>

              <div className="marks-info">
                <div className="marks-item">
                  <FontAwesomeIcon icon={faTrophy} className="me-2" />
                  <span>
                    Marks Obtained: <strong>{examStats.obtainedMarks}</strong> /{" "}
                    {examStats.totalMarks}
                  </span>
                </div>
                <div className="marks-item">
                  <FontAwesomeIcon icon={faListOl} className="me-2" />
                  <span>
                    Questions: <strong>{examStats.totalQuestions}</strong>
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Topic Analysis */}
      <Card className="analysis-card">
        <Card.Header>
          <FontAwesomeIcon icon={faChartBar} className="me-2" />
          Topic-wise Analysis
        </Card.Header>
        <Card.Body>
          {topicAnalysis.map((topic, index) => (
            <div key={index} className="topic-row">
              <div className="topic-info">
                <span className="topic-name">{topic.topic}</span>
                <span className="topic-score">
                  {topic.correct}/{topic.total} ({topic.percentage}%)
                </span>
              </div>
              <ProgressBar
                now={parseInt(topic.percentage)}
                variant={
                  parseInt(topic.percentage) >= 70
                    ? "success"
                    : parseInt(topic.percentage) >= 40
                      ? "warning"
                      : "danger"
                }
                className="topic-progress"
              />
            </div>
          ))}
        </Card.Body>
      </Card>

      {/* Detailed Results Toggle */}
      <div className="details-toggle">
        <Button
          variant={showDetails ? "primary" : "outline-primary"}
          onClick={() => setShowDetails(!showDetails)}
        >
          <FontAwesomeIcon icon={faBook} className="me-2" />
          {showDetails ? "Hide Detailed Results" : "View Detailed Results"}
        </Button>
      </div>

      {/* Detailed Question Results with Evaluation Feedback */}
      {showDetails && (
        <Card className="details-card">
          <Card.Header>
            <FontAwesomeIcon icon={faListOl} className="me-2" />
            Question-wise Results & Evaluation
          </Card.Header>
          <Card.Body className="p-0">
            <Accordion>
              {questionResults.map((result, index) => (
                <Accordion.Item
                  eventKey={index.toString()}
                  key={index}
                  className="question-result-item"
                >
                  <Accordion.Header>
                    <div className="question-result-header">
                      <span className="question-number-badge">
                        Q{index + 1}
                      </span>
                      <span className="question-preview">
                        <MarkdownWithMath content={result.question} />
                      </span>
                      <div className="question-quick-stats">
                        <Badge
                          bg={getScoreColor(result.marks, result.maxMarks)}
                        >
                          {result.marks}/{result.maxMarks}
                        </Badge>
                        <span className="time-badge">
                          <FontAwesomeIcon icon={faClock} className="me-1" />
                          {formatTime(result.timeSpent)}
                        </span>
                      </div>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    {/* Full Question */}
                    {/* <div className="evaluation-section">
                      <h6 className="section-title">
                        <FontAwesomeIcon icon={faBook} className="me-2" />
                        Question
                      </h6>
                      <p className="question-full-text"></p>
                      <MarkdownWithMath content={result.question} />
                    </div> */}

                    {/* Question Image */}
                    {result.question_image && (
                      <div className="evaluation-section">
                        <h6 className="section-title">
                          <FontAwesomeIcon icon={faImage} className="me-2" />
                          Question Image
                        </h6>
                        <img
                          src={getImageSrc(result.question_image)}
                          alt={`Question ${index + 1}`}
                          className="question-result-image"
                          style={{
                            maxWidth: "100%",
                            borderRadius: "8px",
                            marginTop: "8px",
                          }}
                        />
                      </div>
                    )}

                    {/* Score Breakdown */}
                    {result.evaluation && (
                      <>
                        {/* <div className="evaluation-section score-section">
                          <h6 className="section-title">
                            <FontAwesomeIcon icon={faStar} className="me-2" />
                            Score
                          </h6>
                          <div className="score-display">
                            <span className={`score-value text-${getScoreColor(result.evaluation.score, result.evaluation.maxMarks)}`}>
                              {result.evaluation.score}
                            </span>
                            <span className="score-separator">/</span>
                            <span className="max-score">{result.evaluation.maxMarks}</span>
                          </div>
                          {result.evaluation.scoreBreakdown && (
                            <div className="score-breakdown">
                              {typeof result.evaluation.scoreBreakdown === "string" ? (
                                <Badge bg="light" text="dark" className="breakdown-badge">
                                  {result.evaluation.scoreBreakdown}
                                </Badge>
                              ) : (
                                Object.entries(result.evaluation.scoreBreakdown).map(([key, value]) => (
                                  <Badge key={key} bg="light" text="dark" className="breakdown-badge">
                                    {key}: {value}
                                  </Badge>
                                ))
                              )}
                            </div>
                          )}
                        </div> */}

                        {/* Error Type */}
                        {result.evaluation.errorType && (
                          <div className="evaluation-section error-section">
                            <h6 className="section-title text-danger">
                              <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                className="me-2"
                              />
                              Error Type
                            </h6>
                            <Badge bg="danger" className="error-type-badge">
                              {result.evaluation.errorType}
                            </Badge>
                          </div>
                        )}

                        {/* Mistakes Made */}
                        {result.evaluation.mistakesMade && (
                          <div className="evaluation-section mistakes-section">
                            <h6 className="section-title text-warning">
                              <FontAwesomeIcon
                                icon={faTimesCircle}
                                className="me-2"
                              />
                              Mistakes Made
                            </h6>
                            {typeof result.evaluation.mistakesMade ===
                            "string" ? (
                              <p className="mistakes-text">
                                {result.evaluation.mistakesMade}
                              </p>
                            ) : Array.isArray(result.evaluation.mistakesMade) &&
                              result.evaluation.mistakesMade.length > 0 ? (
                              <ul className="mistakes-list">
                                {result.evaluation.mistakesMade.map(
                                  (mistake, mIndex) => (
                                    <li key={mIndex} className="mistake-item">
                                      {mistake}
                                    </li>
                                  ),
                                )}
                              </ul>
                            ) : null}
                          </div>
                        )}

                        {/* Gap Analysis */}
                        {result.evaluation.gapAnalysis && (
                          <div className="evaluation-section gap-section">
                            <h6 className="section-title text-info">
                              <FontAwesomeIcon
                                icon={faChartBar}
                                className="me-2"
                              />
                              Gap Analysis
                            </h6>
                            <p className="gap-analysis-text">
                              {result.evaluation.gapAnalysis}
                            </p>
                          </div>
                        )}

                        {/* Concepts Required */}
                        {result.evaluation.conceptsRequired && (
                          <div className="evaluation-section concepts-section">
                            <h6 className="section-title text-primary">
                              <FontAwesomeIcon
                                icon={faGraduationCap}
                                className="me-2"
                              />
                              Concepts to Review
                            </h6>
                            {typeof result.evaluation.conceptsRequired ===
                            "string" ? (
                              <p className="concepts-text">
                                {result.evaluation.conceptsRequired}
                              </p>
                            ) : Array.isArray(
                                result.evaluation.conceptsRequired,
                              ) &&
                              result.evaluation.conceptsRequired.length > 0 ? (
                              <div className="concepts-tags">
                                {result.evaluation.conceptsRequired.map(
                                  (concept, cIndex) => (
                                    <Badge
                                      key={cIndex}
                                      bg="primary"
                                      className="concept-badge"
                                    >
                                      {typeof concept === "string"
                                        ? concept.trim()
                                        : concept}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}

                        {/* Additional Comments */}
                        {result.evaluation.additionalComments && (
                          <div className="evaluation-section comments-section">
                            <h6 className="section-title text-success">
                              <FontAwesomeIcon
                                icon={faLightbulb}
                                className="me-2"
                              />
                              Feedback & Tips
                            </h6>
                            <p className="additional-comments">
                              {result.evaluation.additionalComments}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Fallback for questions without evaluation */}
                    {!result.evaluation && (
                      <div className="no-evaluation-message">
                        <FontAwesomeIcon
                          icon={faMinusCircle}
                          className="me-2"
                        />
                        No detailed evaluation available for this question.
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Card.Body>
        </Card>
      )}

      {/* Learning Path Section */}
      {!learningPathData && (
        <div className="learning-path-cta">
          <Card className="learning-path-cta-card">
            <Card.Body>
              <div className="cta-content">
                <div className="cta-icon">
                  <FontAwesomeIcon icon={faRoad} />
                </div>
                <div className="cta-text">
                  <h4>Personalized Learning Path</h4>
                  <p>
                    Get an AI-generated study plan based on your exam
                    performance to improve your weak areas.
                  </p>
                </div>
                <Button
                  variant="success"
                  size="lg"
                  className="generate-path-btn"
                  onClick={() => setShowLearningPathModal(true)}
                  disabled={learningPathLoading || !apiResponse?.exam_id}
                >
                  {learningPathLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faBrain} className="me-2" />
                      Generate Customised Learning Path
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Learning Path Error */}
      {learningPathError && (
        <Card className="learning-path-error-card">
          <Card.Body>
            <div className="error-content">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="error-icon"
              />
              <div>
                <h5>Failed to Generate Learning Path</h5>
                <p>{learningPathError}</p>
              </div>
              <Button
                variant="outline-danger"
                onClick={() => setShowLearningPathModal(true)}
              >
                Try Again
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Learning Path Results */}
      {learningPathData && (
        <div className="learning-path-results">
          <Card className="learning-path-card">
            <Card.Header className="learning-path-header">
              <div className="header-left">
                <FontAwesomeIcon icon={faRoad} className="me-2" />
                Your Personalized Learning Path
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={resetLearningPath}
              >
                <FontAwesomeIcon icon={faRedo} className="me-1" />
                Regenerate
              </Button>
            </Card.Header>
            <Card.Body>
              {/* Gap Analysis Summary */}
              {learningPathData.gap_analysis && (
                <div className="gap-analysis-summary">
                  <h5 className="gap-title">
                    <FontAwesomeIcon icon={faChartBar} className="me-2" />
                    Gap Analysis
                  </h5>
                  {learningPathData.gap_analysis.summary && (
                    <p className="gap-summary-text">
                      {learningPathData.gap_analysis.summary}
                    </p>
                  )}
                  {learningPathData.gap_analysis.weak_concepts &&
                    learningPathData.gap_analysis.weak_concepts.length > 0 && (
                      <div className="weak-concepts">
                        <span className="weak-label">Areas to Focus:</span>
                        <div className="concept-badges">
                          {learningPathData.gap_analysis.weak_concepts.map(
                            (concept, idx) => (
                              <Badge
                                key={idx}
                                bg="warning"
                                text="dark"
                                className="concept-badge"
                              >
                                {concept}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Day Navigation */}
              {learningPathData.daily_plans &&
                learningPathData.daily_plans.length > 0 && (
                  <>
                    <div className="day-navigation">
                      <div className="day-nav-header">
                        <h5>
                          <FontAwesomeIcon
                            icon={faCalendarAlt}
                            className="me-2"
                          />
                          {learningPathForm.total_days}-Day Study Plan
                        </h5>
                        <span className="day-counter">
                          Day {activeDayIndex + 1} of{" "}
                          {learningPathData.daily_plans.length}
                        </span>
                      </div>

                      {/* Day Selector Pills */}
                      <div className="day-pills-container">
                        <Button
                          variant="link"
                          className="day-nav-arrow"
                          onClick={goToPreviousDay}
                          disabled={activeDayIndex === 0}
                        >
                          <FontAwesomeIcon icon={faChevronLeft} />
                        </Button>
                        <div className="day-pills">
                          {learningPathData.daily_plans.map((_, idx) => (
                            <button
                              key={idx}
                              className={`day-pill ${idx === activeDayIndex ? "active" : ""}`}
                              onClick={() => setActiveDayIndex(idx)}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                        <Button
                          variant="link"
                          className="day-nav-arrow"
                          onClick={goToNextDay}
                          disabled={
                            activeDayIndex ===
                            learningPathData.daily_plans.length - 1
                          }
                        >
                          <FontAwesomeIcon icon={faChevronRight} />
                        </Button>
                      </div>
                    </div>

                    {/* Active Day Content */}
                    {(() => {
                      const activeDay =
                        learningPathData.daily_plans[activeDayIndex];
                      if (!activeDay) return null;

                      return (
                        <div className="day-content">
                          <div className="day-header-info">
                            <div className="day-title-section">
                              <span className="day-number-badge">
                                Day {activeDay.day_number || activeDayIndex + 1}
                              </span>
                              <div className="day-topic">
                                <MarkdownWithMath content={activeDay.topic} />
                              </div>
                            </div>
                            {activeDay.expected_time && (
                              <div className="expected-time">
                                <FontAwesomeIcon
                                  icon={faClock}
                                  className="me-1"
                                />
                                {activeDay.expected_time}
                              </div>
                            )}
                          </div>

                          {/* What to Study */}
                          {activeDay.what_to_study && (
                            <div className="study-section">
                              <h6 className="section-label">
                                <FontAwesomeIcon
                                  icon={faBookOpen}
                                  className="me-2"
                                />
                                What to Study
                              </h6>
                              <div className="study-content">
                                <MarkdownWithMath
                                  content={activeDay.what_to_study}
                                />
                              </div>
                            </div>
                          )}

                          {/* Checklist */}
                          {activeDay.checklist &&
                            activeDay.checklist.length > 0 && (
                              <div className="checklist-section">
                                <h6 className="section-label">
                                  <FontAwesomeIcon
                                    icon={faTasks}
                                    className="me-2"
                                  />
                                  Checklist
                                </h6>
                                <ul className="study-checklist">
                                  {activeDay.checklist.map((item, idx) => (
                                    <li key={idx} className="checklist-item">
                                      <FontAwesomeIcon
                                        icon={faCheckCircle}
                                        className="check-icon"
                                      />
                                      <span>
                                        <MarkdownWithMath content={item} />
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {/* Practice Questions */}
                          {activeDay.questions &&
                            activeDay.questions.length > 0 && (
                              <div className="questions-section">
                                <h6 className="section-label">
                                  <FontAwesomeIcon
                                    icon={faQuestion}
                                    className="me-2"
                                  />
                                  Practice Questions (
                                  {activeDay.questions.length})
                                </h6>
                                <div className="practice-questions">
                                  {activeDay.questions.map((question, qIdx) => (
                                    <div
                                      key={qIdx}
                                      className="practice-question-card"
                                    >
                                      <div
                                        className="question-header-row"
                                        onClick={() =>
                                          toggleDayQuestion(
                                            activeDayIndex,
                                            qIdx,
                                          )
                                        }
                                      >
                                        <div className="question-meta">
                                          <span className="question-num">
                                            Q{qIdx + 1}
                                          </span>
                                          <Badge
                                            bg={getDifficultyColor(
                                              question.question_level,
                                            )}
                                            className="difficulty-badge"
                                          >
                                            {question.question_level ||
                                              "Medium"}
                                          </Badge>
                                          {question.topic && (
                                            <Badge
                                              bg="secondary"
                                              className="topic-badge"
                                            >
                                              {question.topic}
                                            </Badge>
                                          )}
                                        </div>
                                        <FontAwesomeIcon
                                          icon={
                                            expandedDayQuestions[
                                              `${activeDayIndex}-${qIdx}`
                                            ]
                                              ? faChevronUp
                                              : faChevronDown
                                          }
                                          className="expand-icon"
                                        />
                                      </div>
                                      <div
                                        className={`question-body ${
                                          expandedDayQuestions[
                                            `${activeDayIndex}-${qIdx}`
                                          ]
                                            ? "expanded"
                                            : ""
                                        }`}
                                      >
                                        <p className="question-text"></p>
                                        <MarkdownWithMath
                                          content={question.question}
                                        />
                                        {question.question_image && (
                                          <div className="question-image-container">
                                            <img
                                              src={getImageSrc(
                                                question.question_image,
                                              )}
                                              alt="Question illustration"
                                              className="question-image"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      );
                    })()}
                  </>
                )}
            </Card.Body>
            {/* Start Learning Button */}
            <Card.Footer className="learning-path-footer">
              <div className="start-learning-cta">
                <div className="cta-info">
                  <FontAwesomeIcon icon={faPlay} className="cta-icon-small" />
                  <span>Ready to start your personalized study journey?</span>
                </div>
                <Button
                  variant="success"
                  size="lg"
                  className="start-learning-btn"
                  onClick={() => {
                    navigate("/learning-path-session", {
                      state: {
                        learningPathData,
                        planId: learningPathId,
                        examId: apiResponse?.exam_id,
                        class_id: metadata?.class_id,
                        subject_id: metadata?.subject_id,
                        topic_ids: metadata?.topic_ids,
                        learningPathForm,
                      },
                    });
                  }}
                >
                  <FontAwesomeIcon icon={faPlay} className="me-2" />
                  Start Learning Now
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </div>
      )}

      {/* Learning Path Modal */}
      <Modal
        show={showLearningPathModal}
        onHide={() => setShowLearningPathModal(false)}
        centered
        className={`learning-path-modal ${isDarkMode ? "dark-mode" : ""}`}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faRoad} className="me-2" />
            Generate Learning Path
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="modal-description">
            Create a personalized study plan tailored to your exam results.
            Specify the number of days and daily study duration.
          </p>
          <Form>
            <Form.Group className="mb-4">
              <Form.Label>
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                Number of Days
              </Form.Label>
              <Form.Select
                name="total_days"
                value={learningPathForm.total_days}
                onChange={handleLearningPathFormChange}
              >
                <option value={3}>3 Days - Quick Review</option>
                <option value={5}>5 Days - Moderate Plan</option>
                <option value={7}>7 Days - Standard Plan</option>
                <option value={10}>10 Days - Comprehensive Plan</option>
                <option value={14}>14 Days - Extended Plan</option>
              </Form.Select>
              <Form.Text className="text-muted">
                How many days do you want your learning plan to span?
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faHourglassHalf} className="me-2" />
                Daily Study Duration (minutes)
              </Form.Label>
              <Form.Select
                name="duration"
                value={learningPathForm.duration}
                onChange={handleLearningPathFormChange}
              >
                <option value="15">15 minutes - Quick Session</option>
                <option value="30">30 minutes - Standard Session</option>
                <option value="45">45 minutes - Extended Session</option>
                <option value="60">60 minutes - Intensive Session</option>
                <option value="90">90 minutes - Deep Study</option>
              </Form.Select>
              <Form.Text className="text-muted">
                How much time can you dedicate to studying each day?
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowLearningPathModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleGenerateLearningPath}
            disabled={learningPathLoading}
          >
            {learningPathLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlay} className="me-2" />
                Generate Plan
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Action Buttons */}
      <div className="action-buttons">
        <Button
          variant="outline-primary"
          onClick={() => navigate("/exam-mode")}
        >
          <FontAwesomeIcon icon={faRedo} className="me-2" />
          Take Another Exam
        </Button>
        <Button variant="primary" onClick={() => navigate("/student-dash")}>
          <FontAwesomeIcon icon={faHome} className="me-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default ExamResult;
