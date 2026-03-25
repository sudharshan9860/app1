import React, { useContext, useState, useMemo } from 'react';
import { Card, Row, Col, Button, Modal } from 'react-bootstrap';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { ProgressContext } from '../contexts/ProgressContext';
import StudyStreak from './StudyStreak';
import SubjectProgress from './SubjectProgress';
import { Trophy, TrendingUp, Award, Gift, Clock, HelpCircle } from 'lucide-react';
import { useAlert } from './AlertBox';

const ProgressDashboard = () => {
  const { showAlert, AlertContainer } = useAlert();
  const {
    getProgressSummary,
    redeemReward,
    getWeeklyStudyData
  } = useContext(ProgressContext);

  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState('questions'); // 'questions' or 'time'

  // Get progress data with all study time stats
  const progressData = getProgressSummary() || {
    streak: 0,
    longestStreak: 0,
    totalStudyDays: 0,
    weeklySummary: { dailyLogs: {} },
    points: 0,
    badges: [],
    totalQuestions: 0,
    correctQuestions: 0,
    accuracy: 0,
    totalStudyTime: 0,
    dailyStudyTime: 0,
    weeklyStudyData: []
  };

  // Get weekly study data for charts
  const weeklyStudyData = useMemo(() => {
    // Find most recent week data
    const recentWeeks = progressData.weeklyStudyData || [];
    const mostRecentWeek = recentWeeks.length > 0
      ? recentWeeks[recentWeeks.length - 1]
      : { dailyData: [] };

    // Format for chart display
    return mostRecentWeek.dailyData || [];
  }, [progressData.weeklyStudyData]);

  // Format day names for better display
  const formatDayName = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Prepare data for chart
  const chartData = useMemo(() => {
    return weeklyStudyData.map(day => ({
      ...day,
      dayName: formatDayName(day.date),
      date: day.date,
      studyTime: day.studyTime || 0,
      questionsAttempted: day.questionsAttempted || 0
    }));
  }, [weeklyStudyData]);

  // Rewards section
  const availableRewards = [
    {
      name: 'Extra Practice Session',
      cost: 100,
      description: 'Unlock additional practice questions',
      Icon: TrendingUp
    },
    {
      name: 'Hint Token',
      cost: 50,
      description: 'Get a helpful hint for challenging questions',
      Icon: Award
    },
    {
      name: 'Bonus Question',
      cost: 75,
      description: 'Earn an extra challenge question',
      Icon: Trophy
    }
  ];

  // Handle reward redemption
  const handleRedeemReward = (rewardName) => {
    try {
      const redeemedReward = redeemReward(rewardName);
      if (redeemedReward) {
        showAlert(`Successfully redeemed: ${redeemedReward.name}`, "success");
        setShowRedeemModal(false);
      }
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <>
      <AlertContainer />
      <div className="space-y-6 p-4">
      {/* Study Streak Section */}
      <div>
        <StudyStreak />
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h5 className="text-lg font-semibold text-[#0B1120] m-0">Performance Overview</h5>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center mb-3">
              <h5 className="text-sm font-medium text-gray-500">Accuracy</h5>
              <h3 className="text-2xl font-bold text-[#00A0E3]">
                {progressData.accuracy.toFixed(2)}%
              </h3>
            </div>
            <div className="text-center mb-3">
              <h5 className="text-sm font-medium text-gray-500">Total Questions</h5>
              <h3 className="text-2xl font-bold text-emerald-500">
                {progressData.totalQuestions}
              </h3>
            </div>
            <div className="text-center mb-3">
              <h5 className="text-sm font-medium text-gray-500">Study Time</h5>
              <h3 className="text-2xl font-bold text-cyan-500">
                {progressData.totalStudyTime} mins
              </h3>
            </div>
          </div>
          <div className="flex justify-between text-gray-400 text-sm mt-2">
            <span>
              Correct Answers: {progressData.correctQuestions}
            </span>
            <span>
              Today's Study Time: {progressData.dailyStudyTime} mins
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h5 className="text-lg font-semibold text-[#0B1120] m-0">Weekly Study Progress</h5>
          <div className="flex gap-1">
            <button
              className={`px-3 py-1.5 text-sm rounded-l-md border transition-colors ${
                activeChartTab === 'questions'
                  ? 'bg-[#00A0E3] text-white border-[#00A0E3]'
                  : 'bg-white text-[#00A0E3] border-[#00A0E3] hover:bg-blue-50'
              }`}
              onClick={() => setActiveChartTab('questions')}
            >
              <HelpCircle size={14} className="inline mr-1.5" />
              Questions
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-r-md border transition-colors ${
                activeChartTab === 'time'
                  ? 'bg-[#00A0E3] text-white border-[#00A0E3]'
                  : 'bg-white text-[#00A0E3] border-[#00A0E3] hover:bg-blue-50'
              }`}
              onClick={() => setActiveChartTab('time')}
            >
              <Clock size={14} className="inline mr-1.5" />
              Study Time
            </button>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            {activeChartTab === 'questions' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="questionsAttempted"
                  name="Questions Attempted"
                  fill="#82ca9d"
                />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="studyTime"
                  stroke="#8884d8"
                  name="Study Time (mins)"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Progress */}
      <div>
        <SubjectProgress />
      </div>

      {/* Badges and Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Badges Section */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 font-semibold text-[#0B1120]">Earned Badges</div>
            <div className="p-6">
              <div className="flex flex-wrap justify-center gap-4">
                {progressData.badges.length > 0 ? (
                  progressData.badges.map((badge, index) => (
                    <div
                      key={index}
                      className="text-center w-[120px]"
                    >
                      <div
                        className="text-5xl"
                        style={{
                          color: badge.type === 'gold' ? '#FFD700' :
                                 badge.type === 'silver' ? '#C0C0C0' : '#CD7F32'
                        }}
                      >
                        <Trophy size={48} />
                      </div>
                      <p className="mt-2 text-sm text-[#0B1120]">{badge.name}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center w-full text-gray-400">No badges earned yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 font-semibold text-[#0B1120] flex items-center gap-2">
              <Gift size={18} className="text-[#00A0E3]" />
              Rewards
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#0B1120]">Points</h3>
                  <div className="text-2xl font-bold text-[#00A0E3]">{progressData.points} Points</div>
                </div>
                <button
                  className="px-4 py-2 bg-[#00A0E3] text-white text-sm rounded-lg hover:bg-[#0080B8] transition-colors"
                  onClick={() => setShowRedeemModal(true)}
                >
                  Redeem Rewards
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Redemption Modal */}
      <Modal show={showRedeemModal} onHide={() => setShowRedeemModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Redeem Rewards</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableRewards.map((reward, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center text-center h-full">
                <reward.Icon
                  size={32}
                  className="mb-3 text-[#00A0E3]"
                />
                <h5 className="font-semibold text-[#0B1120] mb-1">{reward.name}</h5>
                <p className="text-gray-400 text-sm mb-2">{reward.description}</p>
                <p className="font-bold text-[#0B1120]">{reward.cost} Points</p>
                <button
                  className={`mt-auto px-4 py-2 rounded-lg border text-sm transition-colors ${
                    progressData.points < reward.cost
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white'
                  }`}
                  disabled={progressData.points < reward.cost}
                  onClick={() => handleRedeemReward(reward.name)}
                >
                  Redeem
                </button>
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </div>
    </>
  );
};

export default ProgressDashboard;
