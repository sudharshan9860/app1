import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, ArrowUp, ArrowDown, Minus, Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const ProgressGraph = ({ username }) => {
  const [progressData, setProgressData] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [trend, setTrend] = useState('neutral');
  const [percentageChange, setPercentageChange] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  // Fetch progress data from API
  useEffect(() => {
    const fetchProgressData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get('/learning-path-graph/');

        if (response.data && response.data.plans && response.data.plans.length > 0) {
          setPlans(response.data.plans);
          processPlansData(response.data.plans, 0);
        } else {
          setError('No learning path data available');
          setProgressData([]);
        }
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError('Failed to load progress data');
        setProgressData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();
  }, [username]);

  // Process plans data for the selected plan
  const processPlansData = (plansData, planIndex) => {
    if (!plansData || plansData.length === 0) return;

    const selectedPlan = plansData[planIndex];
    if (!selectedPlan || !selectedPlan.graph) return;

    const data = selectedPlan.graph.map((item, index) => ({
      day: item.day,
      points: item.points,
      date: new Date(Date.now() - (selectedPlan.graph.length - 1 - index) * 24 * 60 * 60 * 1000)
    }));

    setProgressData(data);
    setSelectedPlanIndex(planIndex);

    if (data.length >= 2) {
      const recentPoints = data.slice(-3).reduce((sum, d) => sum + d.points, 0);
      const olderPoints = data.slice(0, Math.min(3, data.length)).reduce((sum, d) => sum + d.points, 0);

      if (olderPoints === 0 && recentPoints === 0) {
        setTrend('neutral');
        setPercentageChange(0);
      } else if (olderPoints === 0) {
        setTrend('up');
        setPercentageChange(100);
      } else {
        const change = ((recentPoints - olderPoints) / olderPoints) * 100;
        setPercentageChange(Math.abs(change).toFixed(1));
        if (change > 5) setTrend('up');
        else if (change < -5) setTrend('down');
        else setTrend('neutral');
      }
    }
  };

  const handlePlanChange = (e) => {
    const newIndex = parseInt(e.target.value, 10);
    processPlansData(plans, newIndex);
  };

  // Draw the graph
  useEffect(() => {
    if (!canvasRef.current || progressData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const points = progressData.map(d => d.points);
    const maxPoints = Math.max(...points, 10);
    const minPoints = 0;
    const pointsRange = maxPoints - minPoints;

    const graphPoints = progressData.map((d, i) => ({
      x: padding.left + (i / Math.max(progressData.length - 1, 1)) * graphWidth,
      y: padding.top + graphHeight - ((d.points - minPoints) / pointsRange) * graphHeight,
      points: d.points,
      day: d.day,
      date: d.date
    }));

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    if (trend === 'up') {
      gradient.addColorStop(0, 'rgba(0, 160, 227, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 160, 227, 0.02)');
    } else if (trend === 'down') {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
    } else {
      gradient.addColorStop(0, 'rgba(0, 160, 227, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 160, 227, 0.02)');
    }

    if (graphPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(graphPoints[0].x, height - padding.bottom);
      graphPoints.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.lineTo(graphPoints[graphPoints.length - 1].x, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (graphHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const pointsLabel = Math.round(maxPoints - (pointsRange / 4) * i);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(pointsLabel.toString(), padding.left - 8, y + 3);
    }

    if (graphPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(graphPoints[0].x, graphPoints[0].y);

      for (let i = 1; i < graphPoints.length; i++) {
        const xc = (graphPoints[i].x + graphPoints[i - 1].x) / 2;
        const yc = (graphPoints[i].y + graphPoints[i - 1].y) / 2;
        ctx.quadraticCurveTo(graphPoints[i - 1].x, graphPoints[i - 1].y, xc, yc);
      }
      ctx.quadraticCurveTo(
        graphPoints[graphPoints.length - 2].x,
        graphPoints[graphPoints.length - 2].y,
        graphPoints[graphPoints.length - 1].x,
        graphPoints[graphPoints.length - 1].y
      );

      ctx.strokeStyle = trend === 'up' ? '#00A0E3' : trend === 'down' ? '#ef4444' : '#00A0E3';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    graphPoints.forEach((point, i) => {
      const isLast = i === graphPoints.length - 1;
      const radius = isLast ? 6 : 4;

      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = trend === 'up' ? '#00A0E3' : trend === 'down' ? '#ef4444' : '#00A0E3';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(point.x, point.y, radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      if (isLast) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = trend === 'up' ? 'rgba(0, 160, 227, 0.4)' : trend === 'down' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 160, 227, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';

    if (graphPoints.length > 0) {
      ctx.fillText(`Day ${progressData[0].day}`, graphPoints[0].x, height - 8);
      if (progressData.length > 2) {
        const midIndex = Math.floor(progressData.length / 2);
        ctx.fillText(`Day ${progressData[midIndex].day}`, graphPoints[midIndex].x, height - 8);
      }
      ctx.fillText(`Day ${progressData[progressData.length - 1].day}`, graphPoints[graphPoints.length - 1].x, height - 8);
    }

  }, [progressData, trend]);

  const totalPoints = progressData.reduce((sum, d) => sum + d.points, 0);
  const currentPoints = progressData.length > 0 ? progressData[progressData.length - 1].points : 0;
  const activeDays = progressData.filter(d => d.points > 0).length;
  const selectedPlan = plans[selectedPlanIndex];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading progress...</span>
        </div>
      </div>
    );
  }

  if (error || plans.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#00A0E3]" />
          <span className="text-sm font-semibold text-[#0B1120]">Learning Progress</span>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">{error || 'No learning path data available'}</p>
          <span className="text-xs text-gray-400 mt-1 block">Complete learning path activities to see your progress!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#00A0E3]" />
          <span className="text-sm font-semibold text-[#0B1120]">Learning Progress</span>
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend === 'up'
              ? 'text-green-700 bg-green-50'
              : trend === 'down'
              ? 'text-red-700 bg-red-50'
              : 'text-gray-600 bg-gray-100'
          }`}
        >
          {trend === 'up' ? <ArrowUp className="w-3.5 h-3.5" /> : trend === 'down' ? <ArrowDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          <span>{percentageChange}%</span>
        </div>
      </div>

      {/* Plan Selector */}
      {plans.length > 1 && (
        <div className="mb-3">
          <select
            value={selectedPlanIndex}
            onChange={handlePlanChange}
            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-[#0B1120] focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/20 focus:border-[#00A0E3]"
          >
            {plans.map((plan, index) => (
              <option key={plan.plan_id} value={index}>
                Plan {plan.plan_id} ({plan.total_days} days)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-base font-bold text-[#0B1120]">{totalPoints}</div>
          <div className="text-[0.65rem] text-gray-500">Total Points</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold text-[#0B1120]">{currentPoints}</div>
          <div className="text-[0.65rem] text-gray-500">Latest Points</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold text-[#0B1120]">{activeDays}/{selectedPlan?.total_days || progressData.length}</div>
          <div className="text-[0.65rem] text-gray-500">Active Days</div>
        </div>
      </div>

      {/* Canvas */}
      <div className="w-full" style={{ height: '180px' }}>
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
      </div>

      {/* Footer */}
      <div className="mt-2 text-center">
        <span className="text-[0.65rem] text-gray-400">
          {selectedPlan ? `${selectedPlan.total_days} day learning path` : 'Learning path progress'}
        </span>
      </div>
    </div>
  );
};

export default ProgressGraph;
