// src/components/ClassworkDetailsModal.jsx
import React from 'react';
import { GraduationCap, Calendar, TrendingUp, CheckCircle, XCircle, AlertTriangle, Lightbulb, Brain, X } from 'lucide-react';
import MarkdownWithMath from './MarkdownWithMath';

const ClassworkDetailsModal = ({ show, onHide, submission }) => {
  const questions = submission?.questions || [];

  // Helper function to get grade color
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': case 'A+': return 'text-green-600 bg-green-100';
      case 'B': case 'B+': return 'text-blue-600 bg-blue-100';
      case 'C': case 'C+': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-red-600 bg-red-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper function to get error type icon and color
  const getErrorTypeInfo = (errorType) => {
    switch (errorType) {
      case 'no_error':
        return { icon: CheckCircle, colorClass: 'text-green-600 bg-green-100', label: 'No error' };
      case 'calculation_error':
        return { icon: XCircle, colorClass: 'text-red-600 bg-red-100', label: 'Calculation Error' };
      case 'conceptual_error':
        return { icon: Brain, colorClass: 'text-yellow-600 bg-yellow-100', label: 'Conceptual Error' };
      case 'logical_error':
        return { icon: AlertTriangle, colorClass: 'text-yellow-600 bg-yellow-100', label: 'Logical Error' };
      default:
        return { icon: AlertTriangle, colorClass: 'text-gray-600 bg-gray-100', label: errorType };
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onHide}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#00A0E3] text-white rounded-t-xl">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              Classwork Details - {submission?.classwork_code || submission?.worksheet_id}
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
              <div>
                <p className="flex items-center gap-2 text-sm text-[#0B1120]">
                  <Calendar className="w-4 h-4 text-[#00A0E3]" />
                  <strong>Submitted On:</strong>{" "}
                  {submission?.submission_date
                    ? new Date(submission.submission_date).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm text-[#0B1120]">
                  <TrendingUp className="w-4 h-4 text-[#00A0E3]" />
                  <strong>Overall Score:</strong>{" "}
                  <span className="font-bold">{submission?.score || 0}</span> / {submission?.max_possible_score || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[#0B1120] mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Question-wise Analysis
          </h3>

          {questions.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              No questions found in this submission.
            </div>
          ) : (
            questions.map((q, index) => {
              const errorInfo = getErrorTypeInfo(q.error_type);
              const ErrorIcon = errorInfo.icon;

              return (
                <div key={index} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                  {/* Question Header */}
                  <div className="p-3 bg-[#F8FAFC] border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-[#0B1120]">
                        Question {q.question_number || index + 1}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${errorInfo.colorClass}`}>
                          <ErrorIcon className="w-3.5 h-3.5" />
                          {errorInfo.label}
                        </span>
                        <span className="font-bold text-sm text-[#0B1120]">
                          {q.total_score} / {q.max_marks} marks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Question Details */}
                  <div className="p-4">
                    {/* Concepts Required */}
                    {q.concepts_required && q.concepts_required.length > 0 && (
                      <div className="mb-3">
                        <strong className="text-sm text-gray-500">Concepts Required:</strong>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {q.concepts_required.map((concept, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mistakes Made */}
                    {q.mistakes_made && q.mistakes_made !== "Question not attempted" && (
                      <div className="mb-3">
                        <strong className="text-sm text-red-600">Mistakes Made:</strong>
                        <MarkdownWithMath content={q.mistakes_made} />
                      </div>
                    )}

                    {/* Gap Analysis */}
                    {q.gap_analysis && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <strong className="flex items-center gap-2 text-sm text-blue-800">
                          <Brain className="w-4 h-4" />
                          Feedback:
                        </strong>
                        <MarkdownWithMath content={q.gap_analysis} />
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

export default ClassworkDetailsModal;
