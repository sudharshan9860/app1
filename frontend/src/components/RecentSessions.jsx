import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code,
  Calculator,
  Radical,
  BookOpen,
  Clock,
  ChevronRight,
  History
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import SessionDetails from './SessionDetails';

const RecentSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentSessions();
  }, []);

  const fetchRecentSessions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/sessiondata/');
      console.log("All sessions response:", response.data);

      if (response.data && response.data.status === 'success' && Array.isArray(response.data.sessions)) {
        const allGapData = response.data.sessions.flatMap(session => {
          try {
            const parsed = typeof session.session_data === 'string' ? JSON.parse(session.session_data) : session.session_data;
            return parsed.gap_analysis_data || [];
          } catch (e) {
            console.warn("Failed to parse session data:", session.session_data);
            return [];
          }
        });

        setSessions(allGapData);
      } else {
        setError('Unexpected response format');
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      setError('Failed to fetch session data');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueSubjects = () => {
    const subjects = new Set(sessions.map(session => session.subject));
    return Array.from(subjects);
  };

  const getFilteredSessions = () => {
    if (activeTab === 'all') {
      return sessions;
    }
    return sessions.filter(session => session.subject === activeTab);
  };

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

  const getSessionTitle = (session) => {
    if (session.subject) {
      const title = `${session.subject} - ${session.answering_type === 'correct' ? 'Exercise' : 'Solved Examples'}`;
      return title.length > 25 ? title.substring(0, 22) + '...' : title;
    }
    return 'Session';
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  const handleCloseSessionDetails = () => {
    setShowSessionDetails(false);
  };

  const getSessionCountBySubject = (subject) => {
    if (subject === 'all') {
      return sessions.length;
    }
    return sessions.filter(session => session.subject === subject).length;
  };

  const renderTabNav = () => {
    const subjects = getUniqueSubjects();

    return (
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-5">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-[#00A0E3] text-[#00A0E3]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={16} />
          All
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-[#00A0E3] text-white">
            {getSessionCountBySubject('all')}
          </span>
        </button>

        {subjects.map(subject => {
          const Icon = getSessionIcon(subject, 'exercise');
          return (
            <button
              key={subject}
              onClick={() => setActiveTab(subject)}
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === subject
                  ? 'border-[#00A0E3] text-[#00A0E3]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab !== subject ? { color: getSessionColor(subject, 'exercise') } : undefined}
            >
              <Icon size={16} />
              {subject}
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-gray-500 text-white">
                {getSessionCountBySubject(subject)}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <h3 className="text-xl font-semibold text-[#0B1120] flex items-center gap-2 mb-4">
          <Clock size={22} />
          Recent Sessions
        </h3>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-4 border-[#00A0E3] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h3 className="text-xl font-semibold text-[#0B1120] flex items-center gap-2 mb-4">
          <Clock size={22} />
          Recent Sessions
        </h3>
        <div className="text-center py-8 text-red-500">
          {error}
          <div className="mt-2">
            <button
              onClick={fetchRecentSessions}
              className="px-3 py-1.5 text-sm rounded-md border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredSessions = getFilteredSessions();

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold text-[#0B1120] flex items-center gap-2 mb-4">
        <Clock size={22} />
        Recent Sessions
      </h3>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          You did not attempt any questions in the previous sessions.
        </div>
      ) : (
        <>
          {renderTabNav()}

          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sessions found for this filter. Try another category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredSessions.map((session, index) => {
                const Icon = getSessionIcon(session.subject, session.answering_type);
                const color = getSessionColor(session.subject, session.answering_type);
                return (
                  <div
                    key={index}
                    onClick={() => handleSessionClick(session)}
                    className="rounded-lg border bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center p-4"
                    style={{ borderColor: color }}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: color }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 ml-3 min-w-0">
                      <h5 className="font-semibold text-sm text-[#0B1120] truncate">{getSessionTitle(session)}</h5>
                      <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                        <span>{formatTimeAgo(session.date)}</span>
                        <span>
                          Score: <strong className="text-[#0B1120]">{session.student_score}</strong>
                        </span>
                      </div>
                      <button
                        className="mt-2 px-2 py-1 text-xs rounded border border-cyan-500 text-cyan-600 hover:bg-cyan-500 hover:text-white transition-colors"
                        onClick={e => {
                          e.stopPropagation();
                          navigate('/gap-analysis-report', { state: { session } });
                        }}
                      >
                        Gap Analysis
                      </button>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Session Details Modal */}
      <SessionDetails
        show={showSessionDetails}
        onHide={handleCloseSessionDetails}
        session={selectedSession}
      />
    </div>
  );
};

export default RecentSessions;
