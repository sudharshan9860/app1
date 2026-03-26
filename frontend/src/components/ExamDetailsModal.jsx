// src/components/ExamDetailsModal.jsx - FINAL FIXED VERSION with concept object handling
import React, { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  GraduationCap,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Trophy,
  BarChart3,
  ClipboardCheck,
  Target,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  Maximize2,
  Minimize2,
  X,
  Loader2,
} from "lucide-react";
import MarkdownWithMath from "./MarkdownWithMath";
import axiosInstance from "../api/axiosInstance";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ExamDetailsModal = ({ show, onHide, result }) => {
  // State for questions evaluation
  const [questionsEvaluation, setQuestionsEvaluation] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // Default to fullscreen

  // Auto-load questions when modal opens
  useEffect(() => {
    if (show && result && !questionsEvaluation && !loadingQuestions) {
      fetchQuestionsEvaluation();
    }
  }, [show, result]);

  // Reset questions state when modal is closed or exam changes
  useEffect(() => {
    if (!show) {
      setQuestionsEvaluation(null);
      setShowQuestions(false);
      setQuestionsError(null);
      setLoadingQuestions(false);
    }
  }, [show]);

  useEffect(() => {
    setQuestionsEvaluation(null);
    setShowQuestions(false);
    setQuestionsError(null);
    setLoadingQuestions(false);
  }, [result?.result_id, result?.student_id, result?.id]);

  // Helper function to extract concept name from string or object
  const getConceptName = (concept) => {
    if (typeof concept === "string") return concept;
    if (typeof concept === "object" && concept !== null) {
      return concept.concept_name || concept.name || String(concept);
    }
    return String(concept);
  };

  // Helper function to get concept description
  const getConceptDescription = (concept) => {
    if (typeof concept === "object" && concept !== null) {
      return concept.concept_description || concept.description || null;
    }
    return null;
  };

  // Helper functions
  const getGradeColor = (grade) => {
    switch (grade) {
      case "A":
      case "A+":
        return "text-green-600 bg-green-100";
      case "B":
      case "B+":
        return "text-cyan-600 bg-cyan-100";
      case "C":
      case "C+":
        return "text-amber-600 bg-amber-100";
      case "D":
        return "text-red-600 bg-red-100";
      case "F":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return "green";
    if (percentage >= 60) return "cyan";
    if (percentage >= 40) return "amber";
    return "red";
  };

  const getPercentageBgClass = (percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-cyan-500";
    if (percentage >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getPercentageTextClass = (percentage) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-cyan-600";
    if (percentage >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getPercentageBadgeClass = (percentage) => {
    if (percentage >= 80) return "bg-green-100 text-green-700";
    if (percentage >= 60) return "bg-cyan-100 text-cyan-700";
    if (percentage >= 40) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90)
      return {
        label: "Outstanding",
        colorClass: "text-green-600",
        Icon: Trophy,
      };
    if (percentage >= 80)
      return {
        label: "Excellent",
        colorClass: "text-green-600",
        Icon: CheckCircle,
      };
    if (percentage >= 70)
      return { label: "Very Good", colorClass: "text-cyan-600", Icon: ArrowUp };
    if (percentage >= 60)
      return { label: "Good", colorClass: "text-cyan-600", Icon: CheckCircle };
    if (percentage >= 50)
      return {
        label: "Average",
        colorClass: "text-amber-600",
        Icon: BarChart3,
      };
    if (percentage >= 40)
      return {
        label: "Below Average",
        colorClass: "text-amber-600",
        Icon: ArrowDown,
      };
    return {
      label: "Needs Improvement",
      colorClass: "text-red-600",
      Icon: AlertTriangle,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateString;
    }
  };

  const percentage = result?.overall_percentage || 0;
  const performance = getPerformanceLevel(percentage);
  const PerformanceIcon = performance.Icon;

  const parseListData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string")
      return data
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
    return [];
  };

  const strengths = parseListData(result?.strengths);
  const improvements = parseListData(result?.areas_for_improvement);

  // Fetch questions evaluation
  const fetchQuestionsEvaluation = async () => {
    const studentResultId =
      result?.student_id || result?.result_id || result?.id;

    if (!studentResultId) {
      setQuestionsError("Student result ID not available");
      return;
    }

    try {
      setLoadingQuestions(true);
      setQuestionsError(null);

      const response = await axiosInstance.get("/questions-evaluated/", {
        params: {
          student_result_id: studentResultId,
        },
      });

      console.log("API Response:", response.data);

      if (response.data) {
        let data = response.data;

        if (data.question_data && Array.isArray(data.question_data)) {
          data = data.question_data[0];
        }

        console.log("Processed data:", data);

        setQuestionsEvaluation(data);
        setShowQuestions(true);
      }
    } catch (error) {
      console.error("Error fetching questions evaluation:", error);
      setQuestionsError(
        error.response?.data?.error || "Failed to fetch questions evaluation",
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadPDF = () => {
    // LaTeX to readable text converter
    const convertLatexToText = (text) => {
      if (!text) return "";
      let converted = text;
      converted = converted.replace(/\$\$/g, "");
      converted = converted.replace(/\$/g, "");
      const replacements = {
        "\\^\\{0\\}": "\u2070",
        "\\^0": "\u2070",
        "\\^\\{1\\}": "\u00B9",
        "\\^1": "\u00B9",
        "\\^\\{2\\}": "\u00B2",
        "\\^2": "\u00B2",
        "\\^\\{3\\}": "\u00B3",
        "\\^3": "\u00B3",
        "\\^\\{4\\}": "\u2074",
        "\\^4": "\u2074",
        "\\^\\{5\\}": "\u2075",
        "\\^5": "\u2075",
        "\\^\\{6\\}": "\u2076",
        "\\^6": "\u2076",
        "\\^\\{7\\}": "\u2077",
        "\\^7": "\u2077",
        "\\^\\{8\\}": "\u2078",
        "\\^8": "\u2078",
        "\\^\\{9\\}": "\u2079",
        "\\^9": "\u2079",
        "\\\\alpha": "\u03B1",
        "\\\\beta": "\u03B2",
        "\\\\gamma": "\u03B3",
        "\\\\delta": "\u03B4",
        "\\\\epsilon": "\u03B5",
        "\\\\theta": "\u03B8",
        "\\\\pi": "\u03C0",
        "\\\\sigma": "\u03C3",
        "\\\\omega": "\u03C9",
        "\\\\angle": "\u2220",
        "\\\\circ": "\u00B0",
        "\\\\times": "\u00D7",
        "\\\\div": "\u00F7",
        "\\\\pm": "\u00B1",
        "\\\\neq": "\u2260",
        "\\\\leq": "\u2264",
        "\\\\geq": "\u2265",
        "\\\\approx": "\u2248",
        "\\\\infty": "\u221E",
        "\\\\sum": "\u2211",
        "\\\\sqrt": "\u221A",
        "\\\\perp": "\u22A5",
        "\\\\parallel": "\u2225",
        "\\\\mathrm": "",
        "\\\\frac": "",
        "\\{": "(",
        "\\}": ")",
        "\\\\": "",
      };
      for (const [pattern, replacement] of Object.entries(replacements)) {
        const regex = new RegExp(pattern, "g");
        converted = converted.replace(regex, replacement);
      }
      converted = converted.replace(/frac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)");
      converted = converted.replace(/[{}]/g, "");
      converted = converted.replace(/<[^>]*>/g, "");
      converted = converted.replace(/\s+/g, " ").trim();
      return converted;
    };

    const percentage =
      result?.total_max_marks > 0
        ? (result.total_marks_obtained / result.total_max_marks) * 100
        : 0;

    let performanceLevel = "";
    if (percentage >= 90) performanceLevel = "Excellent";
    else if (percentage >= 75) performanceLevel = "Very Good";
    else if (percentage >= 60) performanceLevel = "Good";
    else if (percentage >= 50) performanceLevel = "Average";
    else if (percentage >= 40) performanceLevel = "Below Average";
    else performanceLevel = "Needs Improvement";

    const parseListData = (data) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (typeof data === "string")
        return data
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      return [];
    };

    const getConceptName = (concept) => {
      if (typeof concept === "string") return concept;
      if (typeof concept === "object" && concept !== null) {
        return concept.concept_name || concept.name || String(concept);
      }
      return String(concept);
    };

    const strengths = parseListData(result?.strengths);
    const improvements = parseListData(result?.areas_for_improvement);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    const checkPageBreak = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`Exam Details Report`, pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(result?.exam_name || "Exam", pageWidth / 2, 30, {
      align: "center",
    });
    yPosition = 50;

    checkPageBreak(30);
    doc.setFillColor(249, 250, 251);
    doc.rect(10, yPosition, pageWidth - 20, 8, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    doc.text("Exam Overview", 15, yPosition + 6);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const overviewData = [
      ["Exam Type:", result?.exam_type || "N/A"],
      ["Class/Section:", result?.class_section || "N/A"],
      [
        "Score:",
        `${result?.total_marks_obtained || 0} / ${result?.total_max_marks || 0}`,
      ],
      ["Percentage:", `${percentage.toFixed(1)}%`],
      ["Performance:", performanceLevel],
    ];

    overviewData.forEach(([label, value]) => {
      checkPageBreak(8);
      doc.text(label, 20, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(value, 80, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 7;
    });
    yPosition += 5;

    if (strengths.length > 0) {
      checkPageBreak(30);
      doc.setFillColor(209, 250, 229);
      doc.rect(10, yPosition, pageWidth - 20, 8, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(6, 95, 70);
      doc.text("Strengths", 15, yPosition + 6);
      yPosition += 12;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      strengths.forEach((strength) => {
        const lines = doc.splitTextToSize(`\u2022 ${strength}`, pageWidth - 40);
        lines.forEach((line) => {
          checkPageBreak(8);
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });
      });
      yPosition += 5;
    }

    if (improvements.length > 0) {
      checkPageBreak(30);
      doc.setFillColor(255, 243, 205);
      doc.rect(10, yPosition, pageWidth - 20, 8, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(217, 119, 6);
      doc.text("Areas for Improvement", 15, yPosition + 6);
      yPosition += 12;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      improvements.forEach((improvement) => {
        const lines = doc.splitTextToSize(
          `\u2022 ${improvement}`,
          pageWidth - 40,
        );
        lines.forEach((line) => {
          checkPageBreak(8);
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });
      });
      yPosition += 10;
    }

    if (questionsEvaluation?.questions_evaluation?.length > 0) {
      checkPageBreak(40);
      doc.setFillColor(220, 240, 255);
      doc.rect(10, yPosition, pageWidth - 20, 8, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 110, 253);
      doc.text("Questions Summary", 15, yPosition + 6);
      yPosition += 15;

      const tableData = questionsEvaluation.questions_evaluation.map(
        (q, index) => [
          q.question_number || `Q${index + 1}`,
          `${q.total_score || 0} / ${q.max_marks || 0}`,
          q.mistakes_made || "None",
          q.gap_analysis || "No gaps identified",
        ],
      );

      autoTable(doc, {
        startY: yPosition,
        margin: { left: 10, right: 10 },
        head: [["Question No.", "Marks", "Mistakes Made", "Gap Analysis"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold",
          halign: "center",
        },
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 25, halign: "center" },
          1: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 60, halign: "left" },
          3: { cellWidth: 80, halign: "left" },
        },
      });
      yPosition = doc.lastAutoTable.finalY + 15;
    }

    if (questionsEvaluation?.questions_evaluation?.length > 0) {
      doc.addPage();
      yPosition = 20;
      doc.setFillColor(102, 126, 234);
      doc.rect(10, yPosition, pageWidth - 20, 10, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Detailed Questions Evaluation", 15, yPosition + 7);
      yPosition += 20;

      questionsEvaluation.questions_evaluation.forEach((question, index) => {
        checkPageBreak(80);
        const qPercentage = question.percentage || 0;
        let statusColor, statusText;
        if (qPercentage === 100) {
          statusColor = [16, 185, 129];
          statusText = "Correct";
        } else if (qPercentage === 0) {
          statusColor = [239, 68, 68];
          statusText = "Incorrect";
        } else {
          statusColor = [245, 158, 11];
          statusText = "Partially Correct";
        }

        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(10, yPosition, pageWidth - 20, 20, 3, 3, "FD");
        doc.setFillColor(102, 126, 234);
        doc.circle(20, yPosition + 10, 6, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(
          `${question.question_number || index + 1}`,
          20,
          yPosition + 12,
          { align: "center" },
        );
        doc.setFillColor(...statusColor);
        doc.roundedRect(35, yPosition + 5, 40, 10, 2, 2, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(statusText, 37, yPosition + 12);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(
          `Score: ${question.total_score || 0}/${question.max_marks || 0}`,
          pageWidth - 50,
          yPosition + 10,
        );
        doc.setFontSize(10);
        doc.setTextColor(...statusColor);
        doc.text(`${qPercentage.toFixed(1)}%`, pageWidth - 50, yPosition + 16);
        yPosition += 25;

        checkPageBreak(30);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Question:", 15, yPosition);
        yPosition += 5;
        doc.setFont("helvetica", "normal");
        const questionText = question.question || "N/A";
        const cleanQuestionText = convertLatexToText(questionText);
        const questionLines = doc.splitTextToSize(
          cleanQuestionText,
          pageWidth - 30,
        );
        questionLines.forEach((line) => {
          checkPageBreak(8);
          doc.text(line, 15, yPosition);
          yPosition += 5;
        });
        yPosition += 3;

        if (
          question.concepts_required &&
          question.concepts_required.length > 0
        ) {
          checkPageBreak(20);
          doc.setFont("helvetica", "bold");
          doc.text("Concepts Required:", 15, yPosition);
          yPosition += 5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          question.concepts_required.forEach((concept) => {
            checkPageBreak(6);
            const conceptName = getConceptName(concept);
            doc.text(`\u2022 ${conceptName}`, 20, yPosition);
            yPosition += 5;
          });
        }
        yPosition += 5;

        if (question.mistakes_made && question.mistakes_made !== "None") {
          checkPageBreak(25);
          doc.setFillColor(254, 226, 226);
          doc.rect(10, yPosition, pageWidth - 20, 8, "F");
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(239, 68, 68);
          doc.text("Mistakes Made:", 15, yPosition + 6);
          yPosition += 12;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          const mistakesText = convertLatexToText(question.mistakes_made);
          const mistakesLines = doc.splitTextToSize(
            mistakesText,
            pageWidth - 40,
          );
          mistakesLines.forEach((line) => {
            checkPageBreak(6);
            doc.text(line, 20, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }

        if (
          question.gap_analysis &&
          question.gap_analysis !== "No gaps identified"
        ) {
          checkPageBreak(25);
          doc.setFillColor(254, 243, 199);
          doc.rect(10, yPosition, pageWidth - 20, 8, "F");
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(245, 158, 11);
          doc.text("Gap Analysis:", 15, yPosition + 6);
          yPosition += 12;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          const gapText = convertLatexToText(question.gap_analysis);
          const gapLines = doc.splitTextToSize(gapText, pageWidth - 40);
          gapLines.forEach((line) => {
            checkPageBreak(6);
            doc.text(line, 20, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }
        yPosition += 5;

        if (index < questionsEvaluation.questions_evaluation.length - 1) {
          doc.setDrawColor(229, 231, 235);
          doc.line(10, yPosition, pageWidth - 10, yPosition);
          yPosition += 10;
        }
      });
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      );
    }

    const filename = `${result?.exam_name?.replace(/[^a-z0-9]/gi, "_") || "Exam"}_Details_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onHide}
      />

      {/* Modal */}
      <div
        className={`relative bg-white flex flex-col ${isFullscreen ? "w-full h-full" : "w-full max-w-5xl max-h-[90vh] rounded-2xl mx-4"} shadow-2xl z-10`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#0B1120] to-slate-800 text-white rounded-t-none shrink-0"
          style={isFullscreen ? {} : { borderRadius: "1rem 1rem 0 0" }}
        >
          <h2 className="text-lg font-bold flex items-center gap-3">
            <FileText size={22} />
            Exam Details - {result?.exam_name || result?.exam || "N/A"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onHide}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Exam Overview */}
          <div className="rounded-xl border border-slate-200 p-6 bg-[#F8FAFC]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-[#00A0E3]" />
                  <div>
                    <span className="text-xs text-slate-500">Exam Type</span>
                    <span className="block px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700 w-fit">
                      {result?.exam_type || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap size={18} className="text-cyan-500" />
                  <div>
                    <span className="text-xs text-slate-500">
                      Class/Section
                    </span>
                    <span className="block font-medium">
                      {result?.class_section || "N/A"}
                    </span>
                  </div>
                </div>
                {result?.roll_number && (
                  <div className="flex items-center gap-3">
                    <ClipboardCheck size={18} className="text-green-500" />
                    <div>
                      <span className="text-xs text-slate-500">
                        Roll Number
                      </span>
                      <span className="block font-medium">
                        {result.roll_number}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-[#00A0E3]" />
                  <div>
                    <span className="text-xs text-slate-500">Score</span>
                    <span className="block font-bold text-lg">
                      {result?.total_marks_obtained || 0} /{" "}
                      {result?.total_max_marks || 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target size={18} className="text-amber-500" />
                  <div>
                    <span className="text-xs text-slate-500">Percentage</span>
                    <span
                      className={`block font-bold text-lg ${getPercentageTextClass(percentage)}`}
                    >
                      {percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PerformanceIcon
                    size={18}
                    className={performance.colorClass}
                  />
                  <div>
                    <span className="text-xs text-slate-500">Performance</span>
                    <span
                      className={`block px-2 py-0.5 rounded text-xs font-semibold w-fit ${
                        percentage >= 70
                          ? "bg-green-100 text-green-700"
                          : percentage >= 50
                            ? "bg-cyan-100 text-cyan-700"
                            : percentage >= 40
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                      }`}
                    >
                      {performance.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Performance Progress */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h6 className="font-semibold text-sm">Overall Performance</h6>
                <span className="text-sm font-bold">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${getPercentageBgClass(percentage)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Strengths and Areas for Improvement */}
          {(strengths.length > 0 || improvements.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strengths.length > 0 && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                  <h5 className="flex items-center gap-2 font-semibold text-green-700 mb-3">
                    <CheckCircle size={18} />
                    Strengths
                  </h5>
                  <ul className="space-y-2">
                    {strengths.map((strength, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-green-800"
                      >
                        <CheckCircle
                          size={14}
                          className="mt-0.5 shrink-0 text-green-500"
                        />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {improvements.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <h5 className="flex items-center gap-2 font-semibold text-amber-700 mb-3">
                    <Lightbulb size={18} />
                    Areas for Improvement
                  </h5>
                  <ul className="space-y-2">
                    {improvements.map((improvement, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-amber-800"
                      >
                        <Lightbulb
                          size={14}
                          className="mt-0.5 shrink-0 text-amber-500"
                        />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Questions Summary Table */}
          {showQuestions &&
            questionsEvaluation?.questions_evaluation?.length > 0 && (
              <div>
                <h5 className="flex items-center gap-2 font-semibold mb-3">
                  <BarChart3 size={18} className="text-[#00A0E3]" />
                  Questions Summary
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-200 px-4 py-2 text-center text-sm font-semibold">
                          Question No.
                        </th>
                        <th className="border border-slate-200 px-4 py-2 text-center text-sm font-semibold">
                          Marks Obtained
                        </th>
                        <th className="border border-slate-200 px-4 py-2 text-center text-sm font-semibold">
                          Total Marks
                        </th>
                        <th className="border border-slate-200 px-4 py-2 text-center text-sm font-semibold">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionsEvaluation.questions_evaluation.map(
                        (question, index) => {
                          const marksObtained = question.total_score || 0;
                          const maxMarks = question.max_marks || 0;
                          const qPercentage = question.percentage || 0;

                          return (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="border border-slate-200 px-4 py-2 text-center font-bold">
                                {question.question_number || `Q${index + 1}`}
                              </td>
                              <td className="border border-slate-200 px-4 py-2 text-center">
                                {marksObtained}
                              </td>
                              <td className="border border-slate-200 px-4 py-2 text-center">
                                {maxMarks}
                              </td>
                              <td className="border border-slate-200 px-4 py-2 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getPercentageBadgeClass(qPercentage)}`}
                                >
                                  {qPercentage.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Detailed Questions Evaluation */}
          {showQuestions && questionsEvaluation && (
            <div>
              <h5 className="flex items-center gap-2 font-semibold mb-3">
                <Eye size={18} className="text-[#00A0E3]" />
                Detailed Questions Evaluation
              </h5>

              {questionsEvaluation.questions_evaluation &&
              questionsEvaluation.questions_evaluation.length > 0 ? (
                questionsEvaluation.questions_evaluation.map(
                  (question, index) => {
                    const marksObtained = question.total_score || 0;
                    const maxMarks = question.max_marks || 0;
                    const qPercentage = question.percentage || 0;

                    return (
                      <div
                        key={index}
                        className="mb-4 rounded-xl border border-slate-200 overflow-hidden"
                      >
                        {/* Question Header */}
                        <div
                          className={`flex items-center justify-between px-4 py-3 ${
                            qPercentage >= 75
                              ? "bg-green-50 border-b border-green-200"
                              : qPercentage >= 50
                                ? "bg-amber-50 border-b border-amber-200"
                                : "bg-red-50 border-b border-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 font-bold">
                              <ClipboardCheck
                                size={16}
                                className="text-[#00A0E3]"
                              />
                              {question.question_number || `Q${index + 1}`}
                            </div>
                            {question.error_type === "no_error" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
                                <CheckCircle size={12} />
                                Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                                <AlertTriangle size={12} />
                                {question.error_type || "Error"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-lg font-bold">
                                {marksObtained}
                              </span>
                              <span className="text-slate-400 mx-0.5">/</span>
                              <span className="text-slate-500">{maxMarks}</span>
                              <span className="block text-xs text-slate-400">
                                marks
                              </span>
                            </div>
                            <div
                              className={`text-lg font-bold ${getPercentageTextClass(qPercentage)}`}
                            >
                              {qPercentage.toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="p-4 space-y-4">
                          {/* Question Text */}
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                              <Target size={14} className="text-[#00A0E3]" />
                              Question:
                            </div>
                            <div className="pl-5 text-sm">
                              <MarkdownWithMath
                                content={
                                  question.question || "Question not available"
                                }
                              />
                            </div>
                          </div>

                          {/* Concepts Required */}
                          {question.concepts_required &&
                            question.concepts_required.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                                  <Lightbulb
                                    size={14}
                                    className="text-amber-500"
                                  />
                                  Concepts Required:
                                </div>
                                <div className="flex flex-wrap gap-2 pl-5">
                                  {question.concepts_required.map(
                                    (concept, idx) => {
                                      const conceptName =
                                        getConceptName(concept);
                                      const conceptDescription =
                                        getConceptDescription(concept);
                                      return (
                                        <div key={idx}>
                                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-700">
                                            {conceptName}
                                          </span>
                                          {conceptDescription && (
                                            <div className="mt-1 text-xs text-slate-500 pl-1">
                                              <MarkdownWithMath
                                                content={conceptDescription}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Mistakes and Gap Analysis */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {question.mistakes_made &&
                              question.mistakes_made !== "None" && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                  <div className="flex items-center gap-2 font-semibold text-red-700 text-sm mb-2">
                                    <AlertTriangle size={14} />
                                    Mistakes Made:
                                  </div>
                                  <div className="text-sm text-red-800">
                                    <MarkdownWithMath
                                      content={question.mistakes_made}
                                    />
                                  </div>
                                  {question.mistake_section &&
                                    question.mistake_section !== "N/A" && (
                                      <div className="mt-2 text-xs text-red-500">
                                        Section: {question.mistake_section}
                                      </div>
                                    )}
                                </div>
                              )}

                            {question.gap_analysis &&
                              question.gap_analysis !==
                                "No gaps identified" && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                  <div className="flex items-center gap-2 font-semibold text-amber-700 text-sm mb-2">
                                    <CheckCircle size={14} />
                                    Gap Analysis:
                                  </div>
                                  <div className="text-sm text-amber-800">
                                    <MarkdownWithMath
                                      content={question.gap_analysis}
                                    />
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )
              ) : (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                  <AlertTriangle size={16} />
                  No questions evaluation data available.
                </div>
              )}
            </div>
          )}

          {/* Detailed Analysis Section */}
          {result?.detailed_analysis && (
            <div className="rounded-xl border border-slate-200 p-5">
              <h4 className="font-semibold mb-3">Detailed Analysis</h4>
              <p className="text-sm text-slate-600">
                {result.detailed_analysis}
              </p>
            </div>
          )}

          {/* Error displaying questions */}
          {questionsError && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertTriangle size={16} />
              {questionsError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 shrink-0">
          <button
            onClick={onHide}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Close
          </button>

          {showQuestions && questionsEvaluation && (
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              Download PDF
            </button>
          )}

          {loadingQuestions && (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#00A0E3] opacity-70 cursor-not-allowed"
            >
              <Loader2 size={16} className="animate-spin" />
              Loading Questions...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamDetailsModal;
