// src/components/QuestionWiseTable.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { Info, ChevronRight, BarChart3 } from "lucide-react";

const QuestionWiseTable = ({ examId, examName }) => {
  const [questionData, setQuestionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    if (examId) {
      fetchQuestionWiseData();
    }
  }, [examId]);

  const fetchQuestionWiseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.post(
        "api/question-wise-performance/",
        {
          exam_id: examId,
        },
      );

      console.log("Question-wise API Response:", response.data);

      if (response.data.students_question_data) {
        processQuestionData(response.data.students_question_data);
      } else if (response.data.message) {
        setError(response.data.message);
        setQuestionData([]);
      }
    } catch (error) {
      console.error("Error fetching question-wise data:", error);
      setError("Failed to fetch question-wise performance data");
      setQuestionData([]);
    } finally {
      setLoading(false);
    }
  };

  const processQuestionData = (rawData) => {
    // Group by question number
    const questionMap = {};

    rawData.forEach((record) => {
      const qNum = record.question_number;

      if (!questionMap[qNum]) {
        questionMap[qNum] = {
          question_number: qNum,
          max_marks: record.max_marks,
          students: [],
          correct: 0,
          partial: 0,
          wrong: 0,
          total_students: 0,
        };
      }

      questionMap[qNum].students.push({
        student_result_id: record.student_result_id,
        student_fullname: record.student_fullname,
        obtained_marks: record.obtained_marks,
        max_marks: record.max_marks,
        percentage: record.percentage,
      });

      // Classify performance
      const percentage = record.percentage;
      if (percentage >= 90) {
        questionMap[qNum].correct++;
      } else if (percentage >= 40) {
        questionMap[qNum].partial++;
      } else {
        questionMap[qNum].wrong++;
      }

      questionMap[qNum].total_students++;
    });

    // Convert to array and calculate averages
    const processedData = Object.values(questionMap).map((q) => {
      const avgPercentage =
        q.total_students > 0
          ? ((q.correct + q.partial * 0.5) / q.total_students) * 100
          : 0;

      return {
        ...q,
        average_percentage: avgPercentage,
      };
    });

    // Sort by question number
    processedData.sort((a, b) => a.question_number - b.question_number);

    setQuestionData(processedData);
  };

  const toggleExpand = (questionNumber) => {
    setExpandedQuestion(
      expandedQuestion === questionNumber ? null : questionNumber,
    );
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 75) return "#10b981"; // Green
    if (percentage >= 50) return "#f59e0b"; // Orange
    return "#ef4444"; // Red
  };

  const getPerformanceBg = (percentage) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-[#00A0E3] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500">Loading question-wise analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-sm">
        <Info size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (questionData.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-sm">
        <Info size={20} />
        <span>No question-wise data available for this exam.</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="flex items-center gap-2 text-lg font-bold text-[#0B1120]">
          <BarChart3 size={20} className="text-[#00A0E3]" />
          Question-Wise Performance Analysis
        </h3>
        <p className="text-sm text-gray-500 mt-1">Performance breakdown for each question</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-10 px-3 py-3"></th>
              <th className="px-4 py-3 text-left font-semibold text-[#0B1120]">Question #</th>
              <th className="px-4 py-3 text-center font-semibold text-[#0B1120]">Max Marks</th>
              <th className="px-4 py-3 text-center font-semibold text-[#0B1120]">
                Correct<br /><span className="text-xs text-gray-400 font-normal">(&ge;90%)</span>
              </th>
              <th className="px-4 py-3 text-center font-semibold text-[#0B1120]">
                Partial<br /><span className="text-xs text-gray-400 font-normal">(40-89%)</span>
              </th>
              <th className="px-4 py-3 text-center font-semibold text-[#0B1120]">
                Wrong<br /><span className="text-xs text-gray-400 font-normal">(&lt;40%)</span>
              </th>
              <th className="px-4 py-3 text-center font-semibold text-[#0B1120]">Total Students</th>
              <th className="px-4 py-3 text-left font-semibold text-[#0B1120]">Avg Performance</th>
            </tr>
          </thead>
          <tbody>
            {questionData.map((question) => (
              <React.Fragment key={question.question_number}>
                <tr
                  className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(question.question_number)}
                >
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-block transition-transform duration-200 text-gray-400 ${expandedQuestion === question.question_number ? 'rotate-90' : ''}`}>
                      <ChevronRight size={16} />
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <strong className="text-[#0B1120]">Q{question.question_number}</strong>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{question.max_marks}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      {question.correct}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                      {question.partial}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      {question.wrong}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{question.total_students}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${question.average_percentage}%`,
                            backgroundColor: getPerformanceColor(question.average_percentage),
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-bold min-w-[45px] text-right"
                        style={{ color: getPerformanceColor(question.average_percentage) }}
                      >
                        {question.average_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Expanded Row - Student Details */}
                {expandedQuestion === question.question_number && (
                  <tr className="bg-gray-50/50">
                    <td colSpan="8" className="px-6 py-4">
                      <div>
                        <h4 className="text-sm font-semibold text-[#0B1120] mb-3">
                          Students who attempted Q{question.question_number}:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {question.students.map((student) => (
                            <div
                              key={student.student_result_id}
                              className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm"
                            >
                              <div className="text-sm font-medium text-[#0B1120] truncate">
                                {student.student_fullname}
                              </div>
                              <div className="flex items-center justify-between mt-1.5 text-sm">
                                <span className="text-gray-600">
                                  {student.obtained_marks}/{student.max_marks}
                                </span>
                                <span
                                  className="font-bold text-xs"
                                  style={{ color: getPerformanceColor(student.percentage) }}
                                >
                                  ({student.percentage.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      <div className="flex items-center justify-center gap-8 p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Total Questions:</span>
          <span className="font-bold text-[#0B1120]">{questionData.length}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Overall Avg:</span>
          <span
            className="font-bold"
            style={{
              color: getPerformanceColor(
                questionData.reduce((sum, q) => sum + q.average_percentage, 0) /
                  questionData.length,
              ),
            }}
          >
            {(
              questionData.reduce((sum, q) => sum + q.average_percentage, 0) /
              questionData.length
            ).toFixed(1)}
            %
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuestionWiseTable;
