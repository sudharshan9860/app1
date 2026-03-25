// src/components/HomeworkDetailsModal.jsx
import React, { useMemo } from 'react';
import {
  Calendar, BookOpen, TrendingUp, CheckCircle, XCircle,
  AlertTriangle, Lightbulb, Brain, Calculator, MessageCircle,
  Pencil, Star, StarHalf, GraduationCap, ClipboardCheck, X
} from 'lucide-react';
import MarkdownWithMath from './MarkdownWithMath';

const HomeworkDetailsModal = ({ show, onHide, submission }) => {
  const questions = useMemo(() => submission?.result_json?.questions || [], [submission]);

  // Calculate total score and percentage
  const totalScore = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.total_score || 0), 0);
  }, [questions]);

  const maxPossibleScore = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.max_score || q.max_marks || 0), 0);
  }, [questions]);

  const overallPercentage = useMemo(() => {
    if (maxPossibleScore === 0) return 0;
    return Math.round((totalScore / maxPossibleScore) * 100);
  }, [totalScore, maxPossibleScore]);

  // Helper function to determine grade based on percentage
  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 30) return 'D';
    return 'F';
  };

  // Helper function to get grade color
  const getGradeColorClass = (grade) => {
    switch (grade) {
      case 'A': case 'A+': return 'text-green-600 bg-green-100';
      case 'B': case 'B+': return 'text-blue-600 bg-blue-100';
      case 'C': case 'C+': return 'text-yellow-600 bg-yellow-100';
      case 'D': case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper function to get category/error type icon and color
  const getCategoryInfo = (category) => {
    const categoryLower = (category || '').toLowerCase();

    if (categoryLower.includes('partially-')) {
      return { icon: StarHalf, colorClass: 'text-blue-600 bg-blue-100', label: 'Partially Correct' };
    } else if (categoryLower.includes('correct') || categoryLower.includes('no_error')) {
      return { icon: CheckCircle, colorClass: 'text-green-600 bg-green-100', label: 'Correct' };
    } else if (categoryLower.includes('calculation') || categoryLower.includes('numerical')) {
      return { icon: Calculator, colorClass: 'text-red-600 bg-red-100', label: 'Calculation Error' };
    } else if (categoryLower.includes('conceptual')) {
      return { icon: Brain, colorClass: 'text-yellow-600 bg-yellow-100', label: 'Conceptual Error' };
    } else if (categoryLower.includes('logical')) {
      return { icon: AlertTriangle, colorClass: 'text-yellow-600 bg-yellow-100', label: 'Logical Error' };
    } else {
      return { icon: AlertTriangle, colorClass: 'text-gray-600 bg-gray-100', label: category || 'Unknown' };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return dateString;
    }
  };

  const grade = getGrade(overallPercentage);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onHide}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#00A0E3] text-white rounded-t-xl">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              Homework Details - {submission?.worksheet_id || submission?.homework || 'N/A'}
            </h2>
          </div>
          <button onClick={onHide} className="p-1 hover:bg-white/20 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Submission Overview */}
          <div className="mb-6 p-4 bg-[#F8FAFC] rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-[#0B1120]">
                  <Calendar className="w-4 h-4 text-[#00A0E3]" />
                  <strong>Submitted On:</strong>{" "}
                  {formatDate(submission?.submission_timestamp || submission?.submission_date)}
                </p>
                {submission?.class && (
                  <p className="flex items-center gap-2 text-sm text-[#0B1120]">
                    <GraduationCap className="w-4 h-4 text-[#00A0E3]" />
                    <strong>Class:</strong> {submission.class} |
                    <strong className="ml-2">Board:</strong> {submission.board || 'CBSE'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-[#0B1120]">
                  <TrendingUp className="w-4 h-4 text-[#00A0E3]" />
                  <strong>Overall Score:</strong>{" "}
                  <span className="font-bold">{totalScore}</span> / {maxPossibleScore}
                  <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getGradeColorClass(grade)}`}>
                    Grade {grade}
                  </span>
                </p>
                {submission?.difficulty_level && (
                  <p className="flex items-center gap-2 text-sm text-[#0B1120]">
                    <ClipboardCheck className="w-4 h-4 text-yellow-500" />
                    <strong>Difficulty:</strong>{" "}
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      submission.difficulty_level === 'Hard' ? 'text-red-600 bg-red-100' :
                      submission.difficulty_level === 'Medium' ? 'text-yellow-600 bg-yellow-100' : 'text-green-600 bg-green-100'
                    }`}>
                      {submission.difficulty_level}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            {questions.length > 0 && (
              <div className="flex justify-around mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <ClipboardCheck className="w-5 h-5 text-[#00A0E3] mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Total Questions</p>
                  <p className="font-bold text-[#0B1120]">{questions.length}</p>
                </div>
                <div className="text-center">
                  <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Avg. Score</p>
                  <p className="font-bold text-[#0B1120]">
                    {questions.length > 0 ? Math.round(totalScore / questions.length * 10) / 10 : 0}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Questions Section */}
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[#0B1120] mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Question-wise Analysis
          </h3>

          {questions.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              <AlertTriangle className="w-4 h-4" />
              No questions found in this submission.
            </div>
          ) : (
            questions.map((q, index) => {
              const categoryInfo = getCategoryInfo(q.answer_category || q.error_type);
              const CategoryIcon = categoryInfo.icon;
              const concepts = q.concept_required || q.concepts_required || [];
              const questionScore = q.total_score || 0;
              const questionMaxScore = q.max_score || q.max_marks || 0;

              return (
                <div key={index} className="mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  {/* Question Header */}
                  <div className="p-3 bg-[#F8FAFC] border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 font-semibold text-[#0B1120]">
                        <BookOpen className="w-4 h-4 text-[#00A0E3]" />
                        Question {index + 1}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${categoryInfo.colorClass}`}>
                          <CategoryIcon className="w-3.5 h-3.5" />
                          {categoryInfo.label}
                        </span>
                        <span className="font-bold text-sm text-[#0B1120]">
                          {questionScore} / {questionMaxScore} marks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Question Details */}
                  <div className="p-4">
                    {/* Question Text */}
                    {(q.question_text || q.question) && (
                      <div className="mb-3 p-3 bg-[#F8FAFC] rounded-lg">
                        <h6 className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <BookOpen className="w-4 h-4" />
                          Question:
                        </h6>
                        <div className="pl-3">
                          <MarkdownWithMath content={q.question_text || q.question} />
                        </div>
                      </div>
                    )}

                    {/* Concepts Required */}
                    {concepts.length > 0 && (
                      <div className="mb-3">
                        <strong className="flex items-center gap-2 text-sm text-gray-500">
                          <Brain className="w-4 h-4" />
                          Concepts Required:
                        </strong>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {concepts.map((concept, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                              <MarkdownWithMath content={concept} />
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Corrections/Mistakes */}
                    {(q.correction_comment || q.mistakes_made) && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <strong className="flex items-center gap-2 text-sm text-red-700">
                          <Pencil className="w-4 h-4" />
                          Corrections Needed:
                        </strong>
                        <MarkdownWithMath content={q.correction_comment || q.mistakes_made} />
                      </div>
                    )}

                    {/* Feedback/Comments */}
                    {(q.comment || q.gap_analysis) && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <strong className="flex items-center gap-2 text-sm text-blue-700">
                          <MessageCircle className="w-4 h-4" />
                          Teacher's Feedback:
                        </strong>
                        <MarkdownWithMath content={q.comment || q.gap_analysis} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <button
            onClick={onHide}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeworkDetailsModal;
