import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  School,
  Home,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code,
  Calculator,
  Radical,
  BookOpen,
  Clock,
  FileText,
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import SessionDetails from './SessionDetails';
import HomeworkDetailsModal from './HomeworkDetailsModal';
import ClassworkDetailsModal from './ClassworkDetailsModal ';
import ExamDetailsModal from './ExamDetailsModal';
import PdfModal from './PdfModal';

const UnifiedSessions = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('self');

  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState(new Set(['self']));

  // Dark mode detection
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Data state
  const [recentSessions, setRecentSessions] = useState([]);
  const [homeworkSubmissions, setHomeworkSubmissions] = useState([]);
  const [classworkSubmissions, setClassworkSubmissions] = useState([]);
  const [examResults, setExamResults] = useState([]);

  // Loading/error state
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingHomework, setLoadingHomework] = useState(false);
  const [loadingClasswork, setLoadingClasswork] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [error, setError] = useState(null);

  // Selection state for self sessions
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  // Selection state for homework
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);

  // Selection state for classwork
  const [selectedClasswork, setSelectedClasswork] = useState(null);
  const [showClassworkModal, setShowClassworkModal] = useState(false);

  // Selection state for exams
  const [selectedExam, setSelectedExam] = useState(null);
  const [showExamModal, setShowExamModal] = useState(false);

  // PDF Modal state
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('');

  const navigate = useNavigate();

// Detect dark mode changes - OPTIMIZED to prevent forced reflow
useEffect(() => {
  // Initial dark mode check from localStorage (more efficient than DOM query)
  const darkModeValue = localStorage.getItem('darkMode') === 'true';
  setIsDarkMode(darkModeValue);

  // Listen for custom dark mode events instead of MutationObserver
  const handleDarkModeChange = (e) => {
    setIsDarkMode(e.detail?.isDarkMode || false);
  };

  // Listen for storage events (for cross-tab synchronization)
  const handleStorageChange = (e) => {
    if (e.key === 'darkMode') {
      setIsDarkMode(e.newValue === 'true');
    }
  };

  window.addEventListener('darkModeChange', handleDarkModeChange);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('darkModeChange', handleDarkModeChange);
    window.removeEventListener('storage', handleStorageChange);
  };
}, []);

  // Fetch based on active tab
  useEffect(() => {
    // Mark the current tab as loaded
    setLoadedTabs(prev => new Set([...prev, activeTab]));

    if (activeTab === 'self') {
      fetchRecentSessions();
    } else if (activeTab === 'classwork') {
      fetchClassworkSubmissions();
    } else if (activeTab === 'exams') {
      fetchExamResults();
    } else {
      fetchHomeworkSubmissions();
    }
  }, [activeTab]);

  // Fetch recent sessions (self)
  const fetchRecentSessions = async () => {
    try {
      setLoadingSessions(true);
      setError(null);
      const response = await axiosInstance.get('/sessiondata/');

      if (response.data && response.data.status === 'success' && Array.isArray(response.data.sessions)) {
        const allGapData = response.data.sessions.flatMap(session => {
          try {
            const parsed = typeof session.session_data === 'string' ? JSON.parse(session.session_data) : session.session_data;
            return parsed?.gap_analysis_data || [];
          } catch (e) {
            console.warn("Failed to parse session data:", session.session_data);
            return [];
          }
        });
        setRecentSessions(allGapData);
      } else {
        setRecentSessions([]);
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      setError('Failed to fetch session data');
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch classwork submissions
  const fetchClassworkSubmissions = async () => {
    try {
      setLoadingClasswork(true);
      setError(null);
      const response = await axiosInstance.get('/student-classwork-submissions/');
      const submissionsArray = Array.isArray(response.data) ? response.data : [];

      const processed = submissionsArray.map((item, idx) => ({
        submission_id: item.classwork_code || `CW-${idx + 1}`,
        submission_date: item.submission_date,
        submitted_file: item.submitted_file,
        worksheet_id: item.classwork_code,
        classwork_code: item.classwork_code,
        total_score: item.score ?? 0,
        score: item.score ?? 0,
        max_total_score: item.max_possible_score ?? 0,
        max_possible_score: item.max_possible_score ?? 0,
        overall_percentage: item.percentage ?? 0,
        percentage: item.percentage ?? 0,
        grade: item.grade ?? 'N/A',
        questions: item.questions || [],
        homework_type: 'classwork',
        raw: item
      }));

      setClassworkSubmissions(processed);
    } catch (error) {
      console.error("Error fetching classwork submissions:", error);
      setError('Failed to fetch classwork submissions');
    } finally {
      setLoadingClasswork(false);
    }
  };

  // Fetch homework submissions
  const fetchHomeworkSubmissions = async () => {
    try {
      setLoadingHomework(true);
      setError(null);
      const response = await axiosInstance.get('/homework-submission/');
      if (!response.data) {
        setHomeworkSubmissions([]);
        return;
      }

      const submissionsArray = Array.isArray(response.data) ? response.data : [];

      const processedSubmissions = submissionsArray.map(item => {
        if (!item.feedback) {
          return {
            submission_id: item.id,
            submission_date: item.submission_date,
            submitted_file: item.submitted_file,
            homework: item.homework,
            result_json: item.result_json,
            worksheet_id: item.homework || `HW-${item.id}`,
            total_score: item.score || 0,
            max_total_score: item.max_possible_score ?? item.max_possible_socre ?? 10,
            overall_percentage: item.score || 0,
            grade: item.score >= 80 ? 'A' : item.score >= 60 ? 'B' : 'C',
            homework_type: 'homework'
          };
        }

        try {
          const parsedFeedback = JSON.parse(item.feedback);
          return {
            ...parsedFeedback,
            submission_id: item.id,
            submission_date: item.submission_date || parsedFeedback.submission_timestamp,
            submitted_file: item.submitted_file,
            homework: item.homework,
            homework_type: item.homework_type || 'homework',
            worksheet_id: parsedFeedback.worksheet_id || item.homework || `HW-${item.id}`,
            total_score: parsedFeedback.total_score ?? item.score ?? 0,
            max_total_score: parsedFeedback.max_total_score ?? item.max_possible_score ?? item.max_possible_socre ?? 10,
            overall_percentage: parsedFeedback.overall_percentage ?? item.score ?? 0,
            grade: parsedFeedback.grade ?? 'N/A'
          };
        } catch (e) {
          console.error("Error parsing feedback for item:", item.id, e);
          return {
            submission_id: item.id,
            submission_date: item.submission_date,
            submitted_file: item.submitted_file,
            homework: item.homework,
            worksheet_id: item.homework || `HW-${item.id}`,
            total_score: item.score || 0,
            max_total_score: item.max_possible_score ?? item.max_possible_socre ?? 10,
            overall_percentage: item.score || 0,
            grade: 'N/A',
            homework_type: 'homework'
          };
        }
      });

      const homeworkItems = processedSubmissions.filter(submission => {
        const worksheetId = (submission.worksheet_id || submission.homework || '').toString().toLowerCase();
        return submission.homework_type === 'homework' ||
               worksheetId.includes('hw') ||
               worksheetId.includes('homework') ||
               worksheetId.includes('hps');
      });

      setHomeworkSubmissions(homeworkItems);
    } catch (error) {
      console.error("Error fetching homework submissions:", error);
      setError('Failed to fetch homework submissions');
    } finally {
      setLoadingHomework(false);
    }
  };

  // Fetch exam results
  const fetchExamResults = async () => {
    try {
      setLoadingExams(true);
      setError(null);
      const response = await axiosInstance.get('/student-results/');

      if (!response.data) {
        setExamResults([]);
        return;
      }

      // The API returns an object with results array for students
      const results = response.data.results || [];
      setExamResults(results);
    } catch (error) {
      console.error("Error fetching exam results:", error);
      setError('Failed to fetch exam results');
    } finally {
      setLoadingExams(false);
    }
  };

  // Get filtered data based on active tab
  const getFilteredData = () => {
    if (activeTab === 'self') {
      return recentSessions;
    }
    if (activeTab === 'classwork') {
      return classworkSubmissions;
    }
    if (activeTab === 'exams') {
      return examResults;
    }
    return homeworkSubmissions;
  };

  // Get count for tab badges - only show if tab has been loaded
  const getTabCount = (tabType) => {
    if (!loadedTabs.has(tabType)) {
      return null; // Don't show count if tab hasn't been loaded yet
    }

    if (tabType === 'self') {
      return recentSessions.length;
    }
    if (tabType === 'classwork') {
      return classworkSubmissions.length;
    }
    if (tabType === 'exams') {
      return examResults.length;
    }
    return homeworkSubmissions.length;
  };

  // Icon/color helpers
  const getSessionIcon = (subject, answeringType) => {
    if (subject && subject.toLowerCase().includes('math')) {
      return Calculator;
    } else if ((subject && subject.toLowerCase().includes('code')) || (subject && subject.toLowerCase().includes('computer'))) {
      return Code;
    } else if (answeringType === 'solve') {
      return Radical;
    } else {
      return BookOpen;
    }
  };

  const getSessionColor = (subject, answeringType) => {
    if (subject && subject.toLowerCase().includes('math')) {
      return '#34A853';
    } else if ((subject && subject.toLowerCase().includes('code')) || (subject && subject.toLowerCase().includes('computer'))) {
      return '#4285F4';
    } else if (subject && subject.toLowerCase().includes('physics')) {
      return '#FBBC05';
    } else if (subject && subject.toLowerCase().includes('chemistry')) {
      return '#EA4335';
    } else if (subject && subject.toLowerCase().includes('biology')) {
      return '#8E44AD';
    } else {
      return '#00A0E3';
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now - date;
      const diffSec = Math.round(diffMs / 1000);
      const diffMin = Math.round(diffSec / 60);
      const diffHour = Math.round(diffMin / 60);
      const diffDay = Math.round(diffHour / 24);
      if (diffSec < 60) return `${diffSec} sec ago`;
      if (diffMin < 60) return `${diffMin} min ago`;
      if (diffHour < 24) return `${diffHour} hr ago`;
      return `${diffDay} day ago`;
    } catch (e) {
      console.error("Error formatting time:", e);
      return 'recently';
    }
  };

  const getSessionTitle = (session) => {
    if (session.subject) {
      const title = `${session.subject} - ${session.answering_type === 'correct' ? 'Exercise' : 'Solved Examples'}`;
      return title.length > 25 ? title.substring(0, 22) + '...' : title;
    }
    return 'Session';
  };

  // Homework/classwork card helpers
  const getStatusInfo = (submission) => {
    const percentage = submission.overall_percentage || submission.percentage || 0;
    if (percentage >= 80) {
      return { color: '#34A853', status: 'Excellent' };
    } else if (percentage >= 60) {
      return { color: '#FBBC05', status: 'Good' };
    } else {
      return { color: '#EA4335', status: 'Needs Improvement' };
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Helper function to get grade color
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': case 'A+': return 'bg-green-100 text-green-800';
      case 'B': case 'B+': return 'bg-blue-100 text-blue-800';
      case 'C': case 'C+': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-red-100 text-red-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get percentage color
  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-blue-100 text-blue-800';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Helper to extract PDF URL from answer_sheet_snapshot (handles multiple formats)
  const getAnswerSheetUrl = (snapshot) => {
    if (!snapshot) return null;
    if (typeof snapshot === 'string') return snapshot;
    if (typeof snapshot === 'object' && !Array.isArray(snapshot) && snapshot.file_url) {
      return snapshot.file_url;
    }
    if (Array.isArray(snapshot) && snapshot.length > 0 && snapshot[0].file_url) {
      return snapshot[0].file_url;
    }
    return null;
  };

  const handleViewAnswerSheet = (e, result) => {
    e.stopPropagation();
    const pdfUrl = getAnswerSheetUrl(result.answer_sheet_snapshot);
    if (pdfUrl) {
      setSelectedPdfUrl(pdfUrl);
      setSelectedPdfTitle(
        `Answer Sheet - ${result.exam_name || 'Exam'}`
      );
      setPdfModalOpen(true);
    }
  };

  const handleClosePdfModal = () => {
    setPdfModalOpen(false);
    setSelectedPdfUrl('');
    setSelectedPdfTitle('');
  };

  // Render recent session card (self tab)
  const renderSessionCard = (session, index) => {
    const SessionIcon = getSessionIcon(session.subject, session.answering_type);
    const sessionColor = getSessionColor(session.subject, session.answering_type);

    return (
      <div key={index} className="w-full sm:w-1/2 lg:w-1/3 p-2">
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-all duration-200 flex items-center gap-4"
          onClick={() => {
            setSelectedSession(session);
            setShowSessionDetails(true);
          }}
          style={{ borderLeftWidth: '4px', borderLeftColor: sessionColor }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: sessionColor }}
          >
            <SessionIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-semibold text-[#0B1120] truncate">{getSessionTitle(session)}</h5>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">{formatTimeAgo(session.date)}</span>
              <span className="text-xs text-gray-600">
                Score: <strong className="text-[#0B1120]">{session.student_score}</strong>
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    );
  };

  // Render homework submission card
  const renderHomeworkCard = (submission, index) => {
    const statusInfo = getStatusInfo(submission);
    const worksheetId = submission.worksheet_id || submission.homework || `HW-${submission.submission_id}`;

    return (
      <div key={index} className="w-full sm:w-1/2 lg:w-1/3 p-2">
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          style={{ borderLeftWidth: '4px', borderLeftColor: statusInfo.color }}
        >
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-[#0B1120] mb-1">
              {worksheetId}
            </h5>
            <div className="mb-3">
              <span className="text-xs text-gray-400 block">
                {formatDate(submission.submission_date)}
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  setSelectedHomework(submission);
                  setShowHomeworkModal(true);
                }}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render classwork submission card
  const renderClassworkCard = (submission, index) => {
    const statusInfo = getStatusInfo(submission);
    const worksheetId = submission.classwork_code || submission.worksheet_id || `CW-${submission.submission_id}`;

    return (
      <div key={index} className="w-full sm:w-1/2 lg:w-1/3 p-2">
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          style={{ borderLeftWidth: '4px', borderLeftColor: statusInfo.color }}
        >
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-[#0B1120] mb-1">
              {worksheetId}
            </h5>
            <div className="mb-3">
              <span className="text-xs text-gray-400 block">
                {formatDate(submission.submission_date)}
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  setSelectedClasswork(submission);
                  setShowClassworkModal(true);
                }}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render exam result card
  const renderExamCard = (result, index) => {
    const percentage = result.overall_percentage || 0;
    const statusInfo = getStatusInfo(result);

    return (
      <div key={index} className="w-full sm:w-1/2 lg:w-1/3 p-2">
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          style={{ borderLeftWidth: '4px', borderLeftColor: statusInfo.color }}
        >
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-[#0B1120] mb-1">
              {result.exam_name || 'Exam'}
            </h5>
            <div className="mb-2">
              <span className="text-xs text-gray-400 block">
                {result.class_section || 'N/A'} | {result.exam_type || 'N/A'}
              </span>
              <div className="flex gap-2 mt-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getGradeColor(result.grade)}`}>
                  Grade {result.grade || 'N/A'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPercentageColor(percentage)}`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="mt-2">
              <span className="text-xs text-gray-400">
                <strong className="text-[#0B1120]">Score:</strong> {result.total_marks_obtained || 0} / {result.total_max_marks || 0}
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  setSelectedExam(result);
                  setShowExamModal(true);
                }}
              >
                View Details
              </button>
              {getAnswerSheetUrl(result.answer_sheet_snapshot) && (
                <button
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white transition-colors"
                  onClick={e => handleViewAnswerSheet(e, result)}
                >
                  View Answer Sheet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Grid data + loading
  const filteredData = getFilteredData();
  const isLoading =
    (activeTab === 'self' && loadingSessions) ||
    (activeTab === 'classwork' && loadingClasswork) ||
    (activeTab === 'exams' && loadingExams) ||
    (activeTab === 'homework' && loadingHomework);

  const tabs = [
    { key: 'self', label: 'Self', icon: User },
    { key: 'classwork', label: 'Classwork', icon: School },
    { key: 'exams', label: 'Exams', icon: FileText },
    { key: 'homework', label: 'Homework', icon: Home },
  ];

  return (
    <div className="w-full px-4 py-4">
      <h3 className="text-lg font-bold text-[#0B1120] flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-[#00A0E3]" />
        Learning Activity
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = getTabCount(tab.key);

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#00A0E3] text-white'
                  : 'text-gray-500 hover:text-[#00A0E3] hover:bg-gray-50'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
              {count !== null && (
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-[#00A0E3] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#00A0E3] hover:bg-[#0080B8] text-white transition-colors"
              onClick={() => {
                if (activeTab === 'self') fetchRecentSessions();
                else if (activeTab === 'classwork') fetchClassworkSubmissions();
                else if (activeTab === 'exams') fetchExamResults();
                else fetchHomeworkSubmissions();
              }}
            >
              Retry
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {activeTab === 'self'
              ? 'You have not attempted any questions in recent sessions.'
              : activeTab === 'exams'
              ? 'No exam results found.'
              : `No ${activeTab} submissions found.`}
          </div>
        ) : (
          <div className="flex flex-wrap -mx-2">
            {activeTab === 'self' &&
              filteredData.map((session, index) => renderSessionCard(session, index))
            }
            {activeTab === 'homework' &&
              filteredData.map((submission, index) => renderHomeworkCard(submission, index))
            }
            {activeTab === 'classwork' &&
              filteredData.map((submission, index) => renderClassworkCard(submission, index))
            }
            {activeTab === 'exams' &&
              filteredData.map((result, index) => renderExamCard(result, index))
            }
          </div>
        )}
      </div>

      {/* Session Details Modal (Self tab) */}
      {selectedSession && (
        <SessionDetails
          show={showSessionDetails}
          onHide={() => setShowSessionDetails(false)}
          session={selectedSession}
        />
      )}

      {/* Homework Details Modal */}
      {selectedHomework && (
        <HomeworkDetailsModal
          show={showHomeworkModal}
          onHide={() => setShowHomeworkModal(false)}
          submission={selectedHomework}
        />
      )}

      {/* Classwork Details Modal */}
      {selectedClasswork && (
        <ClassworkDetailsModal
          show={showClassworkModal}
          onHide={() => setShowClassworkModal(false)}
          submission={selectedClasswork}
        />
      )}

      {/* Exam Details Modal */}
      {selectedExam && (
        <ExamDetailsModal
          show={showExamModal}
          onHide={() => setShowExamModal(false)}
          result={selectedExam}
        />
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
};

export default UnifiedSessions;
