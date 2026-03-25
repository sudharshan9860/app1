///QuestionEvaluationCard.jsx
import React from 'react';
import MarkdownWithMath from '../MarkdownWithMath';

const QuestionEvaluationCard = ({ questionNumber, questionData, isTeacherView }) => {
  // Safe property access
  const question = questionData?.question || 'Question not available';
  const errorType = questionData?.error_type || 'unattempted';
  const totalScore = questionData?.total_score || 0;
  const maxMarks = questionData?.max_marks || 0;
  const percentage = questionData?.percentage || 0;
  const mistakesMade = questionData?.mistakes_made || 'N/A';
  const gapAnalysis = questionData?.gap_analysis || 'N/A';
  const mistakeSection = questionData?.mistake_section || 'N/A';
  const hasDiagram = questionData?.has_diagram || 'no';
  const conceptsRequired = questionData?.concepts_required || [];

  // Get status color based on error type
  const getStatusColor = (status) => {
    const colors = {
      'correct': '#10b981',
      'no_error': '#10b981',
      'partially-correct': '#f59e0b',
      'incorrect': '#ef4444',
      'conceptual_error': '#ef4444',
      'numerical_error': '#f59e0b',
      'incomplete': '#f59e0b',
      'unattempted': '#6b7280'
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      'no_error': 'Correct',
      'correct': 'Correct',
      'partially-correct': 'Partially Correct',
      'incorrect': 'Incorrect',
      'conceptual_error': 'Conceptual Error',
      'numerical_error': 'Numerical Error',
      'incomplete': 'Incomplete',
      'unattempted': 'Unattempted'
    };
    return labels[status?.toLowerCase()] || status;
  };

  const statusColor = getStatusColor(errorType);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with gradient background */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{
          background: `linear-gradient(135deg, ${statusColor}dd 0%, ${statusColor}99 100%)`
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-base">{questionNumber}</span>
          <span className="text-white/90 text-sm font-medium">
            Marks: {totalScore} / {maxMarks}
          </span>
          {hasDiagram === 'yes' && (
            <span className="text-lg" title="Has diagram">{'\uD83D\uDCCA'}</span>
          )}
        </div>
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {getStatusLabel(errorType)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Question Text Section */}
        <div>
          <h6 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {'\uD83D\uDCDD'} Question
          </h6>
          <div className="text-sm text-[#0B1120] leading-relaxed">
            <MarkdownWithMath content={question} />
          </div>
        </div>

        {/* Mistakes Made */}
        {mistakesMade && mistakesMade !== 'N/A' && mistakesMade !== 'No attempt made.' && (
          <div>
            <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-t-lg">
              <span className="text-sm">{'\u26A0\uFE0F'}</span>
              <h6 className="text-sm font-semibold text-red-800">Mistakes Made</h6>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-b-lg border border-t-0 border-gray-100">
              <div className="text-sm text-gray-700"><MarkdownWithMath content={mistakesMade} /></div>
              {mistakeSection && mistakeSection !== 'N/A' && (
                <p className="mt-2 text-sm italic text-gray-500">
                  Section: {mistakeSection}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Gap Analysis */}
        {gapAnalysis && gapAnalysis !== 'N/A' && gapAnalysis !== 'No gaps identified' && (
          <div>
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-t-lg">
              <span className="text-sm">{'\uD83C\uDFAF'}</span>
              <h6 className="text-sm font-semibold text-amber-800">Gap Analysis</h6>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-b-lg border border-t-0 border-gray-100">
              <div className="text-sm text-gray-700">
                <MarkdownWithMath content={gapAnalysis} />
              </div>
            </div>
          </div>
        )}

        {/* Concepts Required */}
        {conceptsRequired && conceptsRequired.length > 0 && (
          <div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-t-lg">
              <span className="text-sm">{'\uD83D\uDCA1'}</span>
              <h6 className="text-sm font-semibold text-blue-800">Concepts Required</h6>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-b-lg border border-t-0 border-gray-100">
              <div className="flex flex-wrap gap-2">
                {conceptsRequired.map((concept, idx) => {
                  // Handle both string and object formats
                  const conceptName = typeof concept === 'string'
                    ? concept
                    : concept?.concept_name || concept?.name || `Concept ${idx + 1}`;
                  const conceptDesc = typeof concept === 'object'
                    ? concept?.concept_description || concept?.description || null
                    : null;

                  return (
                    <div key={idx} className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                      <div className="text-sm font-medium text-[#0B1120]">
                        <MarkdownWithMath content={conceptName} />
                      </div>
                      {conceptDesc && (
                        <div className="text-xs text-gray-500 mt-1">
                          <MarkdownWithMath content={conceptDesc} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Teacher View Additional Options */}
        {isTeacherView && errorType === 'no_error' && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <span className="text-lg">{'\u2705'}</span>
            <span className="text-sm font-medium text-green-700">Student answered correctly - No intervention needed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionEvaluationCard;
