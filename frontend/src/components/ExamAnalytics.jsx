///ExamAnalytics.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from './AuthContext';
import StudentExamDetails from './StudentExamDetails';
import PdfModal from './PdfModal';

// FIXED: Correct import for jsPDF with autoTable
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExamAnalytics = () => {
  const navigate = useNavigate();
  const { role } = useContext(AuthContext);

  // State management
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [examStats, setExamStats] = useState(null);
  const [studentOwnResults, setStudentOwnResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [editingRow, setEditingRow] = useState(null);
  const [editedMarks, setEditedMarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(null);

  // Modal state for student details
  const [selectedStudentResult, setSelectedStudentResult] = useState(null);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);

  // Delete exam state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // PDF Modal state
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('');

  useEffect(() => {
    if (role === 'teacher') {
      fetchTeacherExams();
    } else if (role === 'student') {
      fetchStudentResults();
    }
  }, [role]);

  const fetchTeacherExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/exam-details/');
      setExams(response.data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError(error.response?.status === 403
        ? 'Access denied. Only teachers can view this page.'
        : 'Failed to fetch exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamResults = async (examId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/student-results/?exam_id=${examId}`);
      setStudentResults(response.data.student_results || []);
      setExamStats({
        examName: response.data.exam,
        examType: response.data.exam_type,
        classSection: response.data.class_section,
        totalStudents: response.data.total_students
      });
      setViewMode('details');
    } catch (error) {
      console.error('Error fetching exam results:', error);
      setError('Failed to fetch exam results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/student-results/');
      setStudentOwnResults(response.data.results || []);
    } catch (error) {
      console.error('Error fetching student results:', error);
      setError('Failed to fetch your results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRowClick = (studentResult) => {
    // Prevent modal from opening if clicking on edit buttons
    if (editingRow === studentResult.student_result_id) {
      return;
    }

    // Transform the data to match the expected format
    const transformedData = {
      result_id: studentResult.student_result_id,
      exam_name: selectedExam.name,
      exam_type: selectedExam.exam_type,
      class_section: examStats?.classSection || 'N/A',
      student_fullname: studentResult.student_fullname,
      student_name: studentResult.student_name,
      roll_number: studentResult.roll_number,
      total_marks_obtained: studentResult.total_marks_obtained,
      total_max_marks: studentResult.total_max_marks,
      overall_percentage: studentResult.overall_percentage,
      grade: studentResult.grade,
      strengths: studentResult.strengths,
      areas_for_improvement: studentResult.areas_for_improvement,
      detailed_analysis: studentResult.detailed_analysis,
      remedial_action: studentResult.remedial_action
    };

    setSelectedStudentResult(transformedData);
    setShowStudentDetailsModal(true);
  };

  const handleCloseStudentDetails = () => {
    setSelectedStudentResult(null);
    setShowStudentDetailsModal(false);
  };

  // Helper to extract PDF URL from answer_sheet_snapshot (handles multiple formats)
  const getAnswerSheetUrl = (snapshot) => {
    if (!snapshot) return null;

    // Case 1: Direct string URL
    if (typeof snapshot === 'string') {
      return snapshot;
    }

    // Case 2: Object with file_url property
    if (typeof snapshot === 'object' && !Array.isArray(snapshot) && snapshot.file_url) {
      return snapshot.file_url;
    }

    // Case 3: Array of objects with file_url
    if (Array.isArray(snapshot) && snapshot.length > 0 && snapshot[0].file_url) {
      return snapshot[0].file_url;
    }

    return null;
  };

  // PDF Modal handlers
  const handleViewAnswerSheet = (e, result) => {
    e.stopPropagation();
    const pdfUrl = getAnswerSheetUrl(result.answer_sheet_snapshot);
    if (pdfUrl) {
      setSelectedPdfUrl(pdfUrl);
      setSelectedPdfTitle(`Answer Sheet - ${result.student_fullname || result.student_name || 'Student'}`);
      setPdfModalOpen(true);
    }
  };

  // Helper to check if answer sheet exists
  const hasAnswerSheet = (result) => {
    return !!getAnswerSheetUrl(result.answer_sheet_snapshot);
  };
const getQuestionPaperUrl = (exam) => {
  const first = exam?.question_paper_snapshot?.[0];

  if (typeof first === "string") {
    return first.trim();
  }

  if (typeof first === "object" && first !== null) {
    return first.file_url?.trim();
  }

  return null;
};

  // Helper to check if question paper exists
  const hasQuestionPaper = (exam) => {
  const snapshot = exam?.question_paper_snapshot;

  if (!Array.isArray(snapshot) || snapshot.length === 0) return false;

  const firstItem = snapshot[0];

  if (typeof firstItem === "string") {
    console.log("Checking question paper URL:", firstItem);
    return firstItem.trim().length > 0;
  }
  if (typeof firstItem === "object" && firstItem !== null) {
    return !!firstItem.file_url;
  }
    return false;
  };

  // Handler to view question paper
  const handleViewQuestionPaper = () => {
  const url = getQuestionPaperUrl(selectedExam);

  if (!url) return;
  setSelectedPdfUrl(encodeURI(url)); // also fixes spaces
  setSelectedPdfTitle(`Question Paper - ${selectedExam.name}`);
  setPdfModalOpen(true);

  };

  const handleClosePdfModal = () => {
    setPdfModalOpen(false);
    setSelectedPdfUrl('');
    setSelectedPdfTitle('');
  };

  const handleExamSelect = (exam) => {
    setSelectedExam(exam);
    fetchExamResults(exam.id);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedExam(null);
    setStudentResults([]);
    setExamStats(null);
    setEditingRow(null);
    setUpdateSuccess(null);
  };

  const handleEditClick = (e, result) => {
    e.stopPropagation();
    setEditingRow(result.student_result_id);
    setEditedMarks(result.total_marks_obtained.toString());
    setUpdateSuccess(null);
    setError(null);
  };

  const handleCancelEdit = (e) => {
    if (e) e.stopPropagation();
    setEditingRow(null);
    setEditedMarks('');
    setUpdateSuccess(null);
    setError(null);
  };

  const handleSaveMarks = async (e, studentResultId, maxMarks) => {
    if (e) e.stopPropagation();

    const marksValue = Number(editedMarks);

    if (isNaN(marksValue)) {
      setError('Please enter a valid number for marks');
      return;
    }

    if (marksValue < 0) {
      setError('Marks cannot be negative');
      return;
    }

    if (marksValue > maxMarks) {
      setError(`Marks cannot exceed maximum marks (${maxMarks})`);
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const formData = new FormData();
      formData.append('student_result_id', studentResultId);
      formData.append('updated_marks', marksValue);

      let response = await axiosInstance.post('/update-student-result/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUpdateSuccess('Successfully updated marks!');
      await fetchExamResults(selectedExam.id);
      setEditingRow(null);
      setEditedMarks('');
      setTimeout(() => setUpdateSuccess(null), 3000);

    } catch (error) {
      console.error('Error updating marks:', error);
      let errorMessage = 'Failed to update marks. ';
      if (error.response?.status === 404) {
        errorMessage += 'API endpoint not found.';
      } else if (error.response?.status === 403) {
        errorMessage += 'Access denied.';
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else {
        errorMessage += 'Please try again.';
      }
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      setError(null);
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Exam Analytics Report', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Exam: ${selectedExam.name}`, 20, 35);
      doc.text(`Type: ${selectedExam.exam_type}`, 20, 42);
      doc.text(`Class: ${examStats?.classSection}`, 20, 49);
      doc.text(`Total Students: ${examStats?.totalStudents}`, 20, 56);
      doc.text(`Average: ${selectedExam.average_score.toFixed(2)}%`, 20, 63);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);

      const tableData = studentResults.map((result, index) => [
        index + 1,
        `${result.student_fullname || 'N/A'}\nRoll: ${result.roll_number || 'N/A'}`,
        result.total_marks_obtained || 0,
        result.total_max_marks || 0,
        `${result.overall_percentage?.toFixed(2) || 0}%`,
        result.grade || 'N/A',
        result.strengths || 'N/A',
        result.areas_for_improvement || 'N/A'
      ]);

      autoTable(doc, {
        startY: 80,
        head: [['#', 'Full Name', 'Marks', 'Max', '%', 'Grade', 'Strengths', 'Improvements']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 160, 227], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 35 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 40, fontSize: 7 },
          7: { cellWidth: 40, fontSize: 7 }
        }
      });

      const filename = `${selectedExam.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

    } catch (error) {
      console.error('PDF generation error:', error);
      setError(`PDF generation failed: ${error.message}`);
    }
  };

  const handleDownloadParentNotesCSV = () => {
    try {
      setError(null);

      // Create CSV content with headers
      const headers = ['Rank','Exam Name','Student Name','Class','Parent Notes'];
      const rows = studentResults.map((result, index) => [
        index + 1,
        selectedExam.name,
        result.student_fullname || result.student_name || 'N/A',
        examStats?.classSection || selectedExam.class_section || 'N/A',
        result.parent_note || 'N/A'
      ]);

      // Escape and format CSV cells properly
      const escapeCSV = (cell) => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedExam.name.replace(/[^a-z0-9]/gi, '_')}_parent_notes.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating CSV:', error);
      setError('Failed to generate parent notes CSV file.');
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A+': '#10b981', 'A': '#16a34a', 'B+': '#00A0E3',
      'B': '#0080B8', 'C+': '#06b6d4', 'C': '#f59e0b',
      'D': '#ef4444', 'F': '#dc2626'
    };
    return colors[grade] || '#6b7280';
  };

  const getPerformanceClass = (percentage) => {
    if (percentage >= 90) return 'text-emerald-600 font-bold';
    if (percentage >= 75) return 'text-blue-600 font-semibold';
    if (percentage >= 60) return 'text-cyan-600';
    if (percentage >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDeleteClick = (e, exam) => {
    e.stopPropagation();
    setExamToDelete(exam);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    try {
      setIsDeleting(true);
      setError(null);
      const formData = new FormData();
      formData.append('exam_id', examToDelete.id);
      await axiosInstance.post('/api/delete-exam/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setExams(prev => prev.filter(e => e.id !== examToDelete.id));
      setShowDeleteConfirm(false);
      setExamToDelete(null);
    } catch (error) {
      console.error('Error deleting exam:', error);
      setError(error.response?.data?.error || 'Failed to delete exam. Please try again.');
      setShowDeleteConfirm(false);
      setExamToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setExamToDelete(null);
  };

  const handleCreateExam = () => {
    if (window.handleExamCorrectionView) {
      window.handleExamCorrectionView();
    } else {
      navigate('/exam-correction');
    }
  };

  if (loading && exams.length === 0 && studentOwnResults.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#00A0E3] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading exam data...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // STUDENT VIEW
  // ========================================
  if (role === 'student') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00A0E3]/10 text-[#00A0E3] rounded-xl flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#0B1120]">My Exam Results</h1>
              <p className="text-gray-500 text-sm">View your exam performance and detailed feedback</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {studentOwnResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <span className="text-5xl mb-4">&#128221;</span>
            <h3 className="text-lg font-semibold text-[#0B1120] mb-2">No Exam Results Yet</h3>
            <p className="text-gray-500">Your exam results will appear here once they are graded by your teacher.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentOwnResults.map((result) => (
              <div
                key={result.result_id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-[#00A0E3]/30 transition-all"
                onClick={() => {
                  setSelectedStudentResult(result);
                  setShowStudentDetailsModal(true);
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[#0B1120] text-lg truncate mr-2">{result.exam_name}</h3>
                  <span className="px-2 py-1 bg-[#00A0E3]/10 text-[#00A0E3] text-xs font-semibold rounded-full whitespace-nowrap">
                    {result.exam_type || 'EXAM'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Score:</span>
                    <span className="font-medium text-[#0B1120]">
                      {Math.round(result.total_marks_obtained || 0)} / {Math.round(result.total_max_marks || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Percentage:</span>
                    <span className={getPerformanceClass(result.overall_percentage || 0)}>
                      {result.overall_percentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Grade:</span>
                    <span className="font-bold" style={{ color: getGradeColor(result.grade) }}>
                      {result.grade || 'N/A'}
                    </span>
                  </div>
                </div>
                <button className="w-full mt-4 text-center text-[#00A0E3] hover:text-[#0080B8] text-sm font-semibold py-2 border border-[#00A0E3]/20 rounded-lg hover:bg-[#00A0E3]/5 transition-colors">
                  View Detailed Report &rarr;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Student Details Modal */}
        {showStudentDetailsModal && selectedStudentResult && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCloseStudentDetails}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-[#0B1120]">Exam Details - {selectedStudentResult.exam_name}</h2>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-xl" onClick={handleCloseStudentDetails}>&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <StudentExamDetails
                  studentResultId={selectedStudentResult.result_id}
                  studentName="Me"
                  examName={selectedStudentResult.exam_name}
                  isTeacherView={false}
                  summaryData={selectedStudentResult}
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors" onClick={handleCloseStudentDetails}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // TEACHER LIST VIEW
  // ========================================
  if (role === 'teacher' && viewMode === 'list') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00A0E3]/10 text-[#00A0E3] rounded-xl flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#0B1120]">Exam Analytics</h1>
              <p className="text-gray-500 text-sm">View and analyze all your exam results</p>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-[#00A0E3] hover:bg-[#0080B8] text-white px-5 py-2.5 rounded-lg font-medium transition-colors" onClick={handleCreateExam}>
            <span>+</span> Create New Exam
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <span className="text-5xl mb-4">&#128221;</span>
            <h3 className="text-lg font-semibold text-[#0B1120] mb-2">No Exams Created Yet</h3>
            <p className="text-gray-500 mb-6">Create your first exam to start grading and analyzing student performance.</p>
            <button className="flex items-center gap-2 bg-[#00A0E3] hover:bg-[#0080B8] text-white px-6 py-3 rounded-lg font-medium transition-colors" onClick={handleCreateExam}>
              <span>+</span> Create First Exam
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <div key={exam.id} className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-[#00A0E3]/30 transition-all" onClick={() => handleExamSelect(exam)}>
                <button
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  onClick={(e) => handleDeleteClick(e, exam)}
                  title="Delete Exam"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
                <div className="flex items-center justify-between mb-3 pr-8">
                  <h3 className="font-semibold text-[#0B1120] text-lg truncate mr-2">{exam.name}</h3>
                  <span className="px-2 py-1 bg-[#00A0E3]/10 text-[#00A0E3] text-xs font-semibold rounded-full whitespace-nowrap">{exam.exam_type}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Class:</span>
                    <span className="font-medium text-[#0B1120]">{exam.class_section}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Students:</span>
                    <span className="font-medium text-[#0B1120]">{exam.total_students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Score:</span>
                    <span className={getPerformanceClass(exam.average_score)}>
                      {exam.average_score.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{formatDate(exam.created_at)}</span>
                  </div>
                  {exam.processed_at && (
                    <div className="flex justify-between">
                      <span>Processed:</span>
                      <span>{formatDate(exam.processed_at)}</span>
                    </div>
                  )}
                </div>
                <button className="w-full mt-4 text-center text-[#00A0E3] hover:text-[#0080B8] text-sm font-semibold py-2 border border-[#00A0E3]/20 rounded-lg hover:bg-[#00A0E3]/5 transition-colors">
                  View Details &rarr;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && examToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCancelDelete}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#0B1120] mb-2">Delete Exam</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Are you sure you want to delete <strong>"{examToDelete.name}"</strong>? This will permanently remove the exam and all associated student results. This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Delete Exam
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // TEACHER DETAILS VIEW
  // ========================================
  if (role === 'teacher' && viewMode === 'details' && selectedExam) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-[#00A0E3] hover:text-[#0080B8] font-medium text-sm transition-colors" onClick={handleBackToList}>
              &larr; Back
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#0B1120]">{selectedExam.name}</h1>
              <p className="text-gray-500 text-sm">
                {examStats?.classSection} &bull; {examStats?.totalStudents} Students &bull; {selectedExam.exam_type}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasQuestionPaper(selectedExam) && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-[#00A0E3] text-gray-700 hover:text-[#00A0E3] rounded-lg text-sm font-medium transition-colors"
                onClick={handleViewQuestionPaper}
                title="View Question Paper"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>Question Paper</span>
              </button>
            )}
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-[#00A0E3] text-gray-700 hover:text-[#00A0E3] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              onClick={handleDownloadParentNotesCSV}
              disabled={studentResults.length === 0}
              title="Download Parent Notes CSV"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <polyline points="9 15 12 18 15 15"/>
              </svg>
              <span>Parent Note</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              onClick={handleDownloadPDF}
              disabled={studentResults.length === 0}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {updateSuccess && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{updateSuccess}</span>
          </div>
        )}

        {studentResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <span className="text-5xl mb-4">&#128202;</span>
            <h3 className="text-lg font-semibold text-[#0B1120] mb-2">No Results Available</h3>
            <p className="text-gray-500">Results are still being processed or no submissions were found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Marks</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Max</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">%</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Strengths</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Areas for Improvement</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Answer Sheet</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentResults.map((result, index) => (
                    <tr
                      key={result.student_result_id}
                      onClick={() => handleStudentRowClick(result)}
                      className="hover:bg-[#00A0E3]/5 cursor-pointer transition-colors"
                      title="Click to view detailed evaluation"
                    >
                      <td className="px-3 py-3 text-gray-600">{index + 1}</td>
                      <td className="px-3 py-3">
                        <span className="font-medium text-[#0B1120]">{result.roll_number || result.student_name || 'N/A'}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {editingRow === result.student_result_id ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent"
                              value={editedMarks}
                              onChange={(e) => setEditedMarks(e.target.value)}
                              min="0"
                              max={result.total_max_marks}
                              step="0.5"
                              disabled={isUpdating}
                            />
                          </div>
                        ) : (
                          <span>{result.total_marks_obtained || 0}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">{result.total_max_marks || 0}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          (result.overall_percentage || 0) >= 75 ? 'bg-emerald-100 text-emerald-700' :
                          (result.overall_percentage || 0) >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {result.overall_percentage?.toFixed(2) || 0}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: getGradeColor(result.grade) }}>
                          {result.grade || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-[200px] text-xs text-gray-600 line-clamp-2">{result.strengths || 'N/A'}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-[200px] text-xs text-gray-600 line-clamp-2">{result.areas_for_improvement || 'N/A'}</div>
                      </td>
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {hasAnswerSheet(result) ? (
                          <button
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#00A0E3]/10 text-[#00A0E3] hover:bg-[#00A0E3]/20 rounded-md text-xs font-medium transition-colors"
                            onClick={(e) => handleViewAnswerSheet(e, result)}
                            title="View Answer Sheet"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {editingRow === result.student_result_id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                              onClick={(e) => handleSaveMarks(e, result.student_result_id, result.total_max_marks)}
                              disabled={isUpdating}
                              title="Save"
                            >
                              {isUpdating ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </button>
                            <button className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors disabled:opacity-50" onClick={handleCancelEdit} disabled={isUpdating} title="Cancel">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#00A0E3]/10 text-gray-400 hover:text-[#00A0E3] transition-colors" onClick={(e) => handleEditClick(e, result)} title="Edit marks">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teacher Details Modal */}
        {showStudentDetailsModal && selectedStudentResult && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCloseStudentDetails}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-[#0B1120]">Detailed Evaluation - {selectedStudentResult.student_fullname || selectedStudentResult.student_name}</h2>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-xl" onClick={handleCloseStudentDetails}>&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <StudentExamDetails
                  studentResultId={selectedStudentResult.result_id}
                  studentName={selectedStudentResult.student_fullname || selectedStudentResult.student_name}
                  examName={selectedExam.name}
                  isTeacherView={true}
                  summaryData={selectedStudentResult}
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  className="px-5 py-2 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg font-medium transition-colors"
                  onClick={() => {
                    if (window.downloadStudentExamPDF) {
                      window.downloadStudentExamPDF();
                    } else {
                      alert('PDF download function not available. Please try again.');
                    }
                  }}
                >
                  Download PDF
                </button>
                <button className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors" onClick={handleCloseStudentDetails}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Viewer Modal */}
        <PdfModal
          isOpen={pdfModalOpen}
          onClose={handleClosePdfModal}
          pdfUrl={selectedPdfUrl}
          title={selectedPdfTitle}
        />
      </div>
    );
  }

  return null;
};

export default ExamAnalytics;
