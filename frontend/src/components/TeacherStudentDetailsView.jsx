// src/components/TeacherStudentDetailsView.jsx

import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import StudentExamDetails from './StudentExamDetails';

const TeacherStudentDetailsView = () => {
  const { examId, studentResultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { studentName, examName, rollNumber } = location.state || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[#0B1120] hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student List
        </button>
        <span className="text-sm text-gray-500">
          Exam Analytics / {examName} / {studentName} (Roll: {rollNumber})
        </span>
      </div>

      <StudentExamDetails
        studentResultId={parseInt(studentResultId)}
        studentName={studentName}
        examName={examName}
        isTeacherView={true}
      />
    </div>
  );
};

export default TeacherStudentDetailsView;
