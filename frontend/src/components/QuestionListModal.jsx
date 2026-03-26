// src/components/QuestionListModal.jsx
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import MarkdownWithMath from "./MarkdownWithMath";
import {
  ClipboardCheck,
  CheckCircle,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { useAlert } from "./AlertBox";
import Tutorial from "./Tutorial";
import { useTutorial } from "../contexts/TutorialContext";

const parseMCQOptions = (questionText) => {
  if (!questionText || typeof questionText !== "string") return [];

  const optionsMap = new Map();

  if (questionText.includes("\\\\\\n")) {
    const parts = questionText.split("\\\\\\n");

    parts.forEach((part) => {
      const trimmed = part.trim();
      const match = /^\(([a-d])\)\s*(.+)$/i.exec(trimmed);
      if (match) {
        const key = match[1].toLowerCase();

        if (!optionsMap.has(key)) {
          let optionText = match[2].trim();
          optionText = optionText.replace(/\\+$/, "");
          optionText = optionText.replace(/\\/g, "");

          optionsMap.set(key, optionText);
        }
      }
    });

    if (optionsMap.size > 0) {
      return Array.from(optionsMap.entries()).map(([key, text]) => ({
        key,
        text,
      }));
    }
  }

  const optionRegex = /\(([a-d])\)\s*([^\(]+?)(?=\([a-d]\)|$)/gi;
  let match;
  while ((match = optionRegex.exec(questionText)) !== null) {
    const key = match[1].toLowerCase();

    if (!optionsMap.has(key)) {
      let optionText = match[2]
        .replace(/\\\\/g, "")
        .replace(/\s+/g, " ")
        .trim();
      optionText = optionText.replace(/\\+$/, "");
      optionText = optionText.replace(/\\/g, "");

      optionsMap.set(key, optionText);
    }
  }

  return Array.from(optionsMap.entries()).map(([key, text]) => ({
    key,
    text,
  }));
};

const removeOptionsFromQuestion = (questionText) => {
  if (!questionText || typeof questionText !== "string") return "";

  if (questionText.includes("\\\\\\n")) {
    const parts = questionText.split("\\\\\\n");
    let cleanQuestion = parts[0].trim();
    cleanQuestion = cleanQuestion.replace(/\\+$/, "");
    return cleanQuestion;
  }

  const optionStartIndex = questionText.search(/\(a\)\s*/i);
  if (optionStartIndex > 0) {
    let cleanQuestion = questionText.substring(0, optionStartIndex).trim();
    cleanQuestion = cleanQuestion.replace(/\\+$/, "");
    return cleanQuestion;
  }

  return questionText.trim();
};

const hasMCQOptions = (questionText) => {
  if (!questionText) return false;

  if (
    questionText.includes("\\\\\\n(a)") ||
    questionText.includes("\\\\\\n(b)")
  ) {
    return true;
  }

  return /\(a\)\s*/.test(questionText);
};

const QuestionListModal = ({
  show,
  onHide,
  questionList = [],
  onQuestionClick,
  isMultipleSelect = false,
  onMultipleSelectSubmit,
  worksheetName = "",
  setName = "",
  mode = "",
  paginationInfo = null,
  onNextPage = null,
  onPrevPage = null,
}) => {
  const navigate = useNavigate();
  const { showAlert, AlertContainer } = useAlert();
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const questionListRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (show) {
      // Small delay to trigger enter animation after mount
      requestAnimationFrame(() => setIsVisible(true));
      setIsClosing(false);
    }
  }, [show]);

  useEffect(() => {
    if (questionListRef.current && questionList.length > 0) {
      questionListRef.current.scrollTop = 0;
    }
  }, [questionList]);

  const {
    shouldShowTutorialForPage,
    continueTutorialFlow,
    startTutorialFromToggle,
    startTutorialForPage,
    completedPages,
    tutorialFlow,
  } = useTutorial();

  const tutorialSteps = [
    {
      target: ".question-list ",
      content:
        "Each question is displayed as a card. You can see the question text, difficulty level, and sometimes an image or reading context.",
      disableBeacon: true,
    },
    {
      target: ".question-level",
      content:
        "Click on any question card to start solving it! Try clicking on the first question now to continue the tutorial.",
    },
  ];

  const handleTutorialComplete = () => {
    console.log("QuestionListModal tutorial completed");
  };

  const handleQuestionClick = (questionData, index) => {
    const isTeacherMode = window.location.pathname.includes("teacher-dash");

    if (isTeacherMode || isMultipleSelect) {
      setSelectedQuestions((prev) => {
        const isSelected = prev.includes(index);
        if (isSelected) {
          return prev.filter((i) => i !== index);
        } else {
          if (prev.length < 20) {
            return [...prev, index];
          } else {
            showAlert("You can select up to 20 questions only", "warning");
          }
          return prev;
        }
      });
    } else {
      const selectedQuestion = {
        question: questionData.question,
        image: questionData.question_image
          ? `${questionData.question_image}`
          : null,
        question_id: questionData.question_id || questionData.id || index,
        context: questionData.context || null,
      };

      onQuestionClick(
        selectedQuestion.question,
        index,
        selectedQuestion.image,
        selectedQuestion.question_id,
        selectedQuestion.context,
      );
    }
  };

  const getModalTitle = () => {
    const countText =
      paginationInfo?.count > 0 ? ` (${paginationInfo.count} total)` : "";

    if (setName) {
      return `${setName} - Select up to 20 Questions${countText}`;
    }
    if (worksheetName) {
      return `${worksheetName} - Select up to 20 Questions${countText}`;
    }
    if (paginationInfo?.count > 0) {
      return isMultipleSelect
        ? `Select up to 20 Questions${countText}`
        : `Question List${countText}`;
    }
    return isMultipleSelect ? "Select up to 20 Questions" : "Question List";
  };

  const handleSingleQuestionSubmit = (questionData, index) => {
    console.log("Single question selected:", questionData);

    let imageUrl = null;
    if (questionData.question_image) {
      if (questionData.question_image.startsWith("data:image")) {
        imageUrl = questionData.question_image;
      } else {
        imageUrl = `${questionData.question_image}`;
      }
    }

    const selectedQuestion = {
      question:
        typeof questionData.question === "string"
          ? questionData.question
          : JSON.stringify(questionData.question),
      questionImage: imageUrl,
      questionNumber: index + 1,
      level: questionData.level || "",
      worksheet_name: worksheetName || "",
    };
    if (questionData.context) {
      selectedQuestion.context = questionData.context;
    }

    console.log("Navigating to solve page with:", selectedQuestion);
    navigate("/solve", { state: selectedQuestion });
    onHide();
  };

  const handleMultipleSubmit = () => {
    if (selectedQuestions.length === 0) {
      showAlert("Please select at least one question", "warning");
      return;
    }

    const selectedQuestionData = selectedQuestions.map((index) => {
      const questionData = questionList[index];
      let imageUrl = null;

      if (questionData.question_image) {
        if (questionData.question_image.startsWith("data:image")) {
          imageUrl = questionData.question_image;
        } else {
          imageUrl = `${questionData.question_image}`;
        }
      }

      return {
        ...questionData,
        questionImage: imageUrl,
        questionNumber: index + 1,
        originalIndex: index,
        source: setName || worksheetName || "Selected Questions",
        mode: mode,
      };
    });

    console.log("Submitting selected questions:", selectedQuestionData);

    if (onMultipleSelectSubmit) {
      onMultipleSelectSubmit(selectedQuestionData, mode);
    }

    onHide();
  };

  const handleSolveWorksheet = () => {
    if (worksheetName && questionList.length > 0) {
      navigate("/solve-worksheet", {
        state: {
          worksheetName,
          questions: questionList,
        },
      });
      onHide();
    }
  };

  const handleModalClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setSelectedQuestions([]);
      setIsClosing(false);
      onHide();
    }, 280);
  };

  const renderQuestionContent = (questionData, questionIndex) => {
    let questionText = "";

    console.log("Full question data:", questionData);

    if (typeof questionData.question === "string") {
      questionText = questionData.question;
      console.log("Question text length:", questionText.length);
      console.log("Full question text:", questionText);
    } else if (
      typeof questionData.question === "object" &&
      questionData.question.text
    ) {
      questionText = questionData.question.text;
    } else {
      return <span>{JSON.stringify(questionData.question)}</span>;
    }

    const isMCQ = hasMCQOptions(questionText);
    console.log("Is MCQ?", isMCQ);

    if (isMCQ) {
      const options = parseMCQOptions(questionText);
      const cleanQuestionText = removeOptionsFromQuestion(questionText);

      console.log("Clean question:", cleanQuestionText);
      console.log("Parsed options:", options);

      return (
        <div>
          <div className="mb-2.5 font-medium">
            <MarkdownWithMath content={cleanQuestionText} />
          </div>

          {options.length > 0 && (
            <div className="mt-3 pl-2 p-2.5 rounded-md bg-[#00A0E3]/5 border-l-[3px] border-[#00A0E3]/30">
              {options.map((option) => (
                <div
                  key={`${questionIndex}-${option.key}`}
                  className="flex items-start gap-1.5 mb-1.5 text-sm leading-relaxed"
                >
                  <span className="font-semibold min-w-[28px] flex-shrink-0 text-gray-500">
                    ({option.key})
                  </span>
                  <div className="flex-1">
                    <MarkdownWithMath content={option.text} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <MarkdownWithMath content={questionText} />;
  };

  const isTeacherMode = window.location.pathname.includes("teacher-dash");
  const isWorksheetMode = !!worksheetName;
  const showSubmitButton =
    (isTeacherMode && isWorksheetMode) || isMultipleSelect;

  if (!show && !isClosing) return null;

  return ReactDOM.createPortal(
    <>
      <AlertContainer />
      {/* Modal Overlay */}
      <div
        className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
          isVisible
            ? "bg-black/50 backdrop-blur-sm"
            : "bg-black/0 backdrop-blur-0"
        }`}
        style={{ zIndex: 999999 }}
      >
        <div
          className={`bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 ${
            isVisible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-[0.88] translate-y-3"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-[#0B1120] truncate pr-4">
              {getModalTitle()}
            </h2>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#00A0E3] hover:bg-[#00A0E3]/5 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  startTutorialForPage("questionListModal");
                }}
                title="Start Tutorial"
              >
                <HelpCircle size={16} />
                <span>Tutorial</span>
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={handleModalClose}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            className="flex-1 overflow-y-auto p-6"
            ref={questionListRef}
            style={{ position: "relative" }}
          >
            {/* Loading Overlay */}
            {paginationInfo?.isLoading && (
              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 rounded-lg">
                <Loader2
                  size={48}
                  className="text-[#00A0E3] animate-spin mb-4"
                />
                <span className="text-base font-semibold text-gray-600">
                  Loading questions...
                </span>
              </div>
            )}
            {Array.isArray(questionList) && questionList.length > 0 ? (
              <ul className="question-list flex flex-col gap-3 list-none p-0 m-0">
                {questionList.map((questionData, index) => (
                  <li
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      selectedQuestions.includes(index)
                        ? "border-[#00A0E3] bg-[#00A0E3]/5 shadow-sm"
                        : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                    } ${isWorksheetMode && !isTeacherMode ? "" : ""}`}
                    onClick={() => handleQuestionClick(questionData, index)}
                  >
                    {(isMultipleSelect ||
                      (isTeacherMode && isWorksheetMode)) && (
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(index)}
                        onChange={() =>
                          handleQuestionClick(questionData, index)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-[#00A0E3] focus:ring-[#00A0E3] flex-shrink-0"
                      />
                    )}
                    <div className="w-8 h-8 rounded-lg bg-[#00A0E3]/10 text-[#00A0E3] flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#0B1120]">
                        {renderQuestionContent(questionData, index)}
                      </div>

                      {questionData.context && (
                        <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                          <BookOpen
                            size={14}
                            className="text-amber-600 mt-0.5 flex-shrink-0"
                          />
                          <span className="text-xs text-amber-700">
                            <MarkdownWithMath content={questionData.context} />
                          </span>
                        </div>
                      )}

                      <div
                        className={`question-level inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                          questionData.level?.toLowerCase() === "easy"
                            ? "bg-green-100 text-green-700"
                            : questionData.level?.toLowerCase() === "hard"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {questionData.level || "MEDIUM"}
                      </div>

                      {questionData.question_image && (
                        <div className="mt-3">
                          <img
                            src={
                              questionData.question_image?.startsWith("http")
                                ? questionData.question_image
                                : `data:image/png;base64,${questionData.question_image}`
                            }
                            alt={`Question ${index + 1}`}
                            className="max-w-full max-h-48 rounded-lg border border-gray-200 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No questions available.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            {/* Pagination Controls */}
            {paginationInfo && paginationInfo.count > 0 && (
              <div className="flex items-center justify-center gap-4 pb-3 mb-3 border-b border-gray-100">
                {/* Previous Button */}
                <button
                  onClick={onPrevPage}
                  disabled={
                    !paginationInfo.previous || paginationInfo.isLoading
                  }
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    paginationInfo.previous && !paginationInfo.isLoading
                      ? "bg-[#00A0E3] hover:bg-[#0080B8] text-white shadow-md hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                {/* Page Info */}
                <div className="flex flex-col items-center gap-1 min-w-[150px]">
                  <span className="text-base font-bold text-[#0B1120] flex items-center gap-2">
                    {paginationInfo.isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Page {paginationInfo.currentPage} of{" "}
                        {paginationInfo.totalPages}
                      </>
                    )}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    Total: {paginationInfo.count} questions
                  </span>
                </div>

                {/* Next Button */}
                <button
                  onClick={onNextPage}
                  disabled={!paginationInfo.next || paginationInfo.isLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    paginationInfo.next && !paginationInfo.isLoading
                      ? "bg-[#00A0E3] hover:bg-[#0080B8] text-white shadow-md hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div>
                {selectedQuestions.length > 0 && (
                  <span className="text-sm text-gray-500 font-medium">
                    {selectedQuestions.length}/20 questions selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {worksheetName && !isTeacherMode && (
                  <button
                    onClick={handleSolveWorksheet}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    <ClipboardCheck size={16} />
                    Solve Worksheet
                  </button>
                )}
                {showSubmitButton && (
                  <button
                    onClick={handleMultipleSubmit}
                    disabled={selectedQuestions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Attempt Selected Questions ({selectedQuestions.length}/20)
                  </button>
                )}
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Component */}
      {shouldShowTutorialForPage("questionListModal") && show && (
        <Tutorial steps={tutorialSteps} onComplete={handleTutorialComplete} />
      )}
    </>,
    document.body,
  );
};

export default QuestionListModal;
