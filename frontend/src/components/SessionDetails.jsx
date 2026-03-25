import React from 'react';
import { Calculator, Code, CalendarDays, MessageSquare, X } from 'lucide-react';
import MarkdownWithMath from './MarkdownWithMath';
import { getImageSrc } from '../utils/imageUtils';

const SessionDetails = ({ show, onHide, session }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  const renderSolutionSteps = (steps) => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return <p>No solution steps available.</p>;
    }

    let stepsArray = steps;

    return (
      <div className="space-y-3">
        {stepsArray.map((step, index) => {
          const stepMatch = step.match(/^Step\s+(\d+):\s+(.*)/i);

          if (stepMatch) {
            const [_, stepNumber, stepContent] = stepMatch;
            return (
              <div key={index} className="pl-4 border-l-2 border-[#00A0E3]">
                <div className="font-semibold text-[#0B1120] text-sm mb-1">Step {stepNumber}:</div>
                <div className="text-gray-700 text-sm">
                  <MarkdownWithMath content={stepContent} />
                </div>
              </div>
            );
          } else {
            return (
              <div key={index} className="pl-4 border-l-2 border-[#00A0E3]">
                <div className="font-semibold text-[#0B1120] text-sm mb-1">Step {index + 1}:</div>
                <div className="text-gray-700 text-sm">
                  <MarkdownWithMath content={step} />
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const formatAIAnswer = (aiAnswer) => {
    if (!aiAnswer) return null;

    if (Array.isArray(aiAnswer)) {
      return aiAnswer.join('\n');
    }

    if (typeof aiAnswer === 'string' && !aiAnswer.startsWith('[')) {
      return aiAnswer;
    }

    if (typeof aiAnswer === 'string' && aiAnswer.startsWith('[') && aiAnswer.endsWith(']')) {
      try {
        const parsed = JSON.parse(aiAnswer);
        if (Array.isArray(parsed)) {
          return parsed.join('\n');
        }
      } catch (e) {
        try {
          let content = aiAnswer.slice(1, -1).trim();

          if (!content || content === "''") {
            return null;
          }

          const items = [];
          const regex = /['"]((?:[^'"\\]|\\.)*)['"](?:\s*,\s*)?/g;
          let match;

          while ((match = regex.exec(content)) !== null) {
            const item = match[1].replace(/\\(.)/g, '$1');
            if (item) {
              items.push(item);
            }
          }

          if (items.length === 0) {
            const simpleItems = content.split(',').map(item => {
              return item.trim().replace(/^['"]|['"]$/g, '');
            }).filter(item => item);

            if (simpleItems.length > 0) {
              return simpleItems.join('\n');
            }
          }

          return items.length > 0 ? items.join('\n') : null;
        } catch (parseError) {
          console.error("Error manually parsing AI answer:", parseError);
          return aiAnswer.slice(1, -1).replace(/['"]/g, '');
        }
      }
    }

    if (typeof aiAnswer === 'object') {
      try {
        return JSON.stringify(aiAnswer, null, 2);
      } catch (e) {
        console.error("Error stringifying AI answer:", e);
      }
    }

    return String(aiAnswer);
  };

  if (!session) {
    return null;
  }

  if (!show) {
    return null;
  }

  const SubjectIcon = session.subject?.toLowerCase().includes('math') ? Calculator : Code;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onHide}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-[#0B1120] flex items-center gap-2">
            <SubjectIcon size={20} className="text-[#00A0E3]" />
            Session Details
          </h3>
          <button onClick={onHide} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Session Header */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-semibold text-[#0B1120]">
                {session.subject} - {session.answering_type === 'correct' ? 'Exercise' : 'Solved Examples'}
              </h4>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <CalendarDays size={16} />
                {formatDate(session.date)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#00A0E3]/10 text-[#0080B8]">
                Class {session.class_name}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                Chapter {session.chapter_number}
              </span>
              {session.student_score !== undefined && (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  session.student_score > 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  Score: {session.student_score}
                </span>
              )}
            </div>
          </div>

          {/* Question Section */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <strong className="text-sm text-[#0B1120]">Question</strong>
            </div>
            <div className="p-4">
              <MarkdownWithMath content={session.question_text} />
              {session.question_image_base64 && session.question_image_base64 !== "No image for question" && (
                <div className="text-center mt-3">
                  <img
                    src={getImageSrc(session.question_image_base64)}
                    alt="Question"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Student Answer Section */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <strong className="text-sm text-[#0B1120]">Your Answer</strong>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                <MarkdownWithMath content={session.student_answer} />
              </pre>
              {session.student_answer_base64 && (
                <div className="text-center mt-3">
                  <img
                    src={session.student_answer_base64.startsWith('data:')
                      ? session.student_answer_base64
                      : `data:image/jpeg;base64,${session.student_answer_base64}`}
                    alt="Student Answer"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}
            </div>
          </div>

          {/* AI Answer Section */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <strong className="text-sm text-[#0B1120]">AI Answer</strong>
            </div>
            <div className="p-4">
              {renderSolutionSteps(session.ai_answer_array)}
            </div>
          </div>

          {/* Teacher's Comment Section */}
          {session.comment && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                <MessageSquare size={16} className="text-gray-500" />
                <strong className="text-sm text-[#0B1120]">Teacher's Comment</strong>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-700">
                  <MarkdownWithMath content={session.comment} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <button
            onClick={onHide}
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
