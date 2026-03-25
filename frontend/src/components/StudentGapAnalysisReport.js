import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const StudentGapAnalysisReport = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const sessionFromState = location.state?.session;

  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  // Initial fetch if sessionFromState exists or to fetch available sessions
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (sessionFromState) {
          const response = await axiosInstance.post(`/gap-analysis-report/`, sessionFromState);
          setGapData(response.data);
        } else {
          const response = await axiosInstance.get(`/allsessionsdata/`);
          console.log('Fetched sessions:', response.data.sessions);
          setSessions(response.data.sessions || []);
        }
      } catch (err) {
        setError('Failed to fetch session or gap analysis data.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [sessionFromState]);

  // Manual trigger when "Run Gap Analysis" button is clicked
  const runGapAnalysis = async () => {
    if (!selectedSession) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post(`/gap-analysis-report/`, selectedSession);
      setGapData(response.data);
    } catch (err) {
      setError('Failed to fetch gap analysis data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px] text-gray-500 text-lg">
      Loading...
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center min-h-[200px] text-red-500 text-lg">
      {error}
    </div>
  );

  // If session is not passed and no gap data yet
  if (!sessionFromState && !gapData && sessions.length > 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-[#0B1120] mb-6">Select a Session for Gap Analysis</h2>
        <select
          onChange={(e) => {
            const selected = sessions.find(s => s.timestamp == e.target.value); // <= safer matching
            setSelectedSession(selected);
          }}
          defaultValue=""
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent"
        >
          <option value="" disabled>Select a session</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.timestamp}>
              {session.title || `Session ${session.timestamp}`} - {session.date}
            </option>
          ))}
        </select>

        {/* {console.log('Selected session:', selectedSession)} */}
        <div className="mt-4">
          <button
            onClick={runGapAnalysis}
            disabled={!selectedSession}
            className="bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run Gap Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!gapData) return (
    <div className="flex items-center justify-center min-h-[200px] text-gray-400 text-lg">
      No data found.
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-[#0B1120] mb-6">Gap Analysis Report</h2>
      <pre className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-auto text-sm text-gray-700">
        {JSON.stringify(gapData, null, 2)}
      </pre>
    </div>
  );
};

export default StudentGapAnalysisReport;
