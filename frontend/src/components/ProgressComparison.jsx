import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Loader2, Zap } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

// Transform API data to graph format
const transformApiData = (graphData) => {
  if (!graphData || graphData.length === 0) return [];

  return graphData.map((item, index) => {
    const isBelowTarget = item.actual < item.target;

    return {
      day: item.day,
      label: item.label,
      icon: index === 0 ? '\u{1F680}' : '\u{1F4DA}',
      color: '#00A0E3',
      targetPoints: item.target,
      actualPoints: item.actual,
      isBelowTarget,
      bufferFloor: 50,
      timeBuffer: 70
    };
  });
};

const ProgressComparison = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [particles, setParticles] = useState([]);
  const canvasRef = useRef(null);

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get('/learning-path-graph/');
        const plansData = response.data.plans || [];
        setPlans(plansData);

        // Select the most recent plan by default (first in the array)
        if (plansData.length > 0) {
          setSelectedPlanId(plansData[0].plan_id);
        }
      } catch (err) {
        console.error('Error fetching learning path graph:', err);
        setError(err.message || 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Update progress data when selected plan changes
  useEffect(() => {
    if (selectedPlanId && plans.length > 0) {
      const selectedPlan = plans.find(p => p.plan_id === selectedPlanId);
      if (selectedPlan) {
        const transformedData = transformApiData(selectedPlan.graph);
        setProgressData(transformedData);
      }
    }

    // Generate particle effects
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 15 + 5,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, [selectedPlanId, plans]);

  // Draw the gamified graph
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
    const padding = { top: 45, right: 35, bottom: 70, left: 55 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    // Dynamic Y-axis range based on data
    const minPoints = 0;
    const maxPoints = 100;
    const pointsRange = maxPoints - minPoints;

    const pointsToY = (points) => {
      // Clamp points to valid range
      const clampedPoints = Math.max(minPoints, Math.min(maxPoints, points));
      return padding.top + graphHeight - ((clampedPoints - minPoints) / pointsRange) * graphHeight;
    };

    // Define safe zone threshold (points below target line to be considered "safe")
    const safeZoneThreshold = 8; // 8 points below target is the danger threshold

    // Draw animated grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (graphHeight / 5) * i;
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Y-axis labels with glow
      const pointsLabel = Math.round(maxPoints - (pointsRange / 5) * i);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${pointsLabel}%`, padding.left - 10, y + 4);
    }

    // Calculate graph points
    const targetGraphPoints = progressData.map((d, i) => ({
      x: padding.left + (i / Math.max(progressData.length - 1, 1)) * graphWidth,
      y: pointsToY(d.targetPoints),
      data: d
    }));

    const actualGraphPoints = progressData.map((d, i) => ({
      x: padding.left + (i / Math.max(progressData.length - 1, 1)) * graphWidth,
      y: pointsToY(d.actualPoints),
      data: d
    }));

    // Draw glowing area under actual line
    if (actualGraphPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(actualGraphPoints[0].x, actualGraphPoints[0].y);

      for (let i = 1; i < actualGraphPoints.length; i++) {
        const xc = (actualGraphPoints[i].x + actualGraphPoints[i - 1].x) / 2;
        const yc = (actualGraphPoints[i].y + actualGraphPoints[i - 1].y) / 2;
        ctx.quadraticCurveTo(actualGraphPoints[i - 1].x, actualGraphPoints[i - 1].y, xc, yc);
      }
      ctx.lineTo(actualGraphPoints[actualGraphPoints.length - 1].x, actualGraphPoints[actualGraphPoints.length - 1].y);
      ctx.lineTo(actualGraphPoints[actualGraphPoints.length - 1].x, height - padding.bottom);
      ctx.lineTo(actualGraphPoints[0].x, height - padding.bottom);
      ctx.closePath();

      const areaGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      areaGradient.addColorStop(0, 'rgba(0, 160, 227, 0.4)');
      areaGradient.addColorStop(0.4, 'rgba(0, 160, 227, 0.25)');
      areaGradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)');
      ctx.fillStyle = areaGradient;
      ctx.fill();
    }

    // ============================================
    // SAFE ZONE BAND - Highlighted area BELOW target line only
    // ============================================
    if (targetGraphPoints.length > 1) {
      // Upper bound is the target line itself
      const upperBoundPoints = progressData.map((d, i) => ({
        x: padding.left + (i / Math.max(progressData.length - 1, 1)) * graphWidth,
        y: pointsToY(d.targetPoints)
      }));

      // Lower bound is the danger threshold (safeZoneThreshold points below target)
      const lowerBoundPoints = progressData.map((d, i) => ({
        x: padding.left + (i / Math.max(progressData.length - 1, 1)) * graphWidth,
        y: pointsToY(d.targetPoints - safeZoneThreshold)
      }));

      // Draw the safe zone band (filled area between target line and lower bound)
      ctx.beginPath();

      // Start from the first point on target line
      ctx.moveTo(upperBoundPoints[0].x, upperBoundPoints[0].y);

      // Draw smooth curve along target line (left to right)
      for (let i = 1; i < upperBoundPoints.length; i++) {
        const xc = (upperBoundPoints[i].x + upperBoundPoints[i - 1].x) / 2;
        const yc = (upperBoundPoints[i].y + upperBoundPoints[i - 1].y) / 2;
        ctx.quadraticCurveTo(upperBoundPoints[i - 1].x, upperBoundPoints[i - 1].y, xc, yc);
      }
      ctx.lineTo(upperBoundPoints[upperBoundPoints.length - 1].x, upperBoundPoints[upperBoundPoints.length - 1].y);

      // Draw smooth curve along lower bound (right to left)
      ctx.lineTo(lowerBoundPoints[lowerBoundPoints.length - 1].x, lowerBoundPoints[lowerBoundPoints.length - 1].y);
      for (let i = lowerBoundPoints.length - 2; i >= 0; i--) {
        const xc = (lowerBoundPoints[i].x + lowerBoundPoints[i + 1].x) / 2;
        const yc = (lowerBoundPoints[i].y + lowerBoundPoints[i + 1].y) / 2;
        ctx.quadraticCurveTo(lowerBoundPoints[i + 1].x, lowerBoundPoints[i + 1].y, xc, yc);
      }
      ctx.lineTo(upperBoundPoints[0].x, upperBoundPoints[0].y);
      ctx.closePath();

      // Fill the safe zone with a soft gradient
      const safeZoneGradient = ctx.createLinearGradient(0, upperBoundPoints[0].y, 0, lowerBoundPoints[0].y);
      safeZoneGradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      safeZoneGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.45)');
      safeZoneGradient.addColorStop(1, 'rgba(16, 185, 129, 0.35)');
      ctx.fillStyle = safeZoneGradient;
      ctx.fill();

      // Draw subtle border for safe zone (lower edge - DANGER THRESHOLD)
      ctx.beginPath();
      ctx.moveTo(lowerBoundPoints[0].x, lowerBoundPoints[0].y);
      for (let i = 1; i < lowerBoundPoints.length; i++) {
        const xc = (lowerBoundPoints[i].x + lowerBoundPoints[i - 1].x) / 2;
        const yc = (lowerBoundPoints[i].y + lowerBoundPoints[i - 1].y) / 2;
        ctx.quadraticCurveTo(lowerBoundPoints[i - 1].x, lowerBoundPoints[i - 1].y, xc, yc);
      }
      ctx.lineTo(lowerBoundPoints[lowerBoundPoints.length - 1].x, lowerBoundPoints[lowerBoundPoints.length - 1].y);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Draw the TARGET center line (solid, prominent)
      ctx.beginPath();
      ctx.moveTo(targetGraphPoints[0].x, targetGraphPoints[0].y);
      for (let i = 1; i < targetGraphPoints.length; i++) {
        const xc = (targetGraphPoints[i].x + targetGraphPoints[i - 1].x) / 2;
        const yc = (targetGraphPoints[i].y + targetGraphPoints[i - 1].y) / 2;
        ctx.quadraticCurveTo(targetGraphPoints[i - 1].x, targetGraphPoints[i - 1].y, xc, yc);
      }
      ctx.lineTo(targetGraphPoints[targetGraphPoints.length - 1].x, targetGraphPoints[targetGraphPoints.length - 1].y);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
      ctx.shadowBlur = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw ACTUAL line with gradient and glow
    if (actualGraphPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(actualGraphPoints[0].x, actualGraphPoints[0].y);

      for (let i = 1; i < actualGraphPoints.length; i++) {
        const xc = (actualGraphPoints[i].x + actualGraphPoints[i - 1].x) / 2;
        const yc = (actualGraphPoints[i].y + actualGraphPoints[i - 1].y) / 2;
        ctx.quadraticCurveTo(actualGraphPoints[i - 1].x, actualGraphPoints[i - 1].y, xc, yc);
      }
      ctx.quadraticCurveTo(
        actualGraphPoints[actualGraphPoints.length - 2].x,
        actualGraphPoints[actualGraphPoints.length - 2].y,
        actualGraphPoints[actualGraphPoints.length - 1].x,
        actualGraphPoints[actualGraphPoints.length - 1].y
      );

      const lineGradient = ctx.createLinearGradient(
        actualGraphPoints[0].x, 0,
        actualGraphPoints[actualGraphPoints.length - 1].x, 0
      );
      lineGradient.addColorStop(0, '#00A0E3');
      lineGradient.addColorStop(0.3, '#ef4444');
      lineGradient.addColorStop(0.6, '#00A0E3');
      lineGradient.addColorStop(1, '#ffd700');

      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
      ctx.shadowBlur = 15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw data points with icons
    actualGraphPoints.forEach((point, i) => {
      const d = point.data;

      // Determine if point is in safe zone (between target and danger threshold below)
      const distanceFromTarget = d.actualPoints - d.targetPoints;
      const isAboveTarget = distanceFromTarget >= 0; // At or above target line
      const isBelowSafeZone = distanceFromTarget < -safeZoneThreshold; // Below danger threshold

      // Determine point color based on zone
      let pointColor;
      let glowColor;
      if (isBelowSafeZone) {
        pointColor = '#ef4444'; // Red - danger, needs improvement
        glowColor = 'rgba(239, 68, 68, 0.8)';
      } else if (isAboveTarget) {
        pointColor = '#ffd700'; // Gold - excellent, at or above target
        glowColor = 'rgba(255, 215, 0, 0.8)';
      } else {
        pointColor = '#10b981'; // Green - in safe zone (below target but above danger)
        glowColor = 'rgba(16, 185, 129, 0.8)';
      }

      // Outer glow ring (larger for emphasis)
      ctx.beginPath();
      ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
      const outerGlowGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 12);
      outerGlowGradient.addColorStop(0, glowColor);
      outerGlowGradient.addColorStop(0.5, glowColor.replace('0.8', '0.3'));
      outerGlowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlowGradient;
      ctx.fill();

      // Main point with border
      ctx.beginPath();
      ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = pointColor;
      ctx.shadowColor = pointColor;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner white dot
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Zone status indicator
      if (isBelowSafeZone) {
        // Warning icon for below safe zone
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
        ctx.shadowBlur = 4;

        ctx.shadowBlur = 0;
      } else if (isAboveTarget) {
        // Show actual score for excellent performance
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.fillText(d.actualPoints + '%', point.x, point.y - 22);
        ctx.shadowBlur = 0;
      }

      // Milestone icon
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(d.icon, point.x, height - padding.bottom + 20);
    });

    // Draw "SAFE ZONE" label on the band
    if (targetGraphPoints.length > 1) {
      const midIndex = Math.floor(targetGraphPoints.length / 2);
      const midPoint = targetGraphPoints[midIndex];

      ctx.save();
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText('SAFE ZONE', midPoint.x, midPoint.y + 4);
      ctx.restore();
    }

    // X-axis milestone labels
    progressData.forEach((d, i) => {
      const x = actualGraphPoints[i].x;
      const lines = d.label.split('\n');

      ctx.fillStyle = 'rgba(226, 232, 240, 0.95)';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';

      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, x, height - padding.bottom + 35 + lineIndex * 13);
      });

      // Day number
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '9px Arial';
      ctx.fillText(`Day ${d.day}`, x, height - padding.bottom + 60);
    });

  }, [progressData]);

  // Calculate stats
  const latestData = progressData[progressData.length - 1] || {
    actualPoints: 0,
    targetPoints: 0
  };

  const totalTasks = progressData.length;
  const completedTasks = progressData.filter(d => d.actualPoints >= d.targetPoints).length;

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get selected plan details
  const selectedPlan = plans.find(p => p.plan_id === selectedPlanId);

  // Loading state
  if (loading) {
    return (
      <div className="relative min-h-[400px] bg-gradient-to-br from-[#0B1120] to-gray-900 rounded-xl p-6 overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
          <Loader2 className="w-10 h-10 text-[#00A0E3] animate-spin mb-4" />
          <p className="text-gray-300 text-lg">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative min-h-[400px] bg-gradient-to-br from-[#0B1120] to-gray-900 rounded-xl p-6 overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
          <p className="text-red-400 text-lg font-semibold">Failed to load progress data</p>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // No plans available
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <span className="text-5xl mb-4" role="img" aria-label="robot">&#129302;</span>
        <p className="text-gray-600 text-center text-lg mb-6">Take an exam to unlock your personalized learning path!</p>
        <Link
          to="/exam-mode"
          className="inline-flex items-center gap-2 bg-[#00A0E3] hover:bg-[#0080B8] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Zap className="w-5 h-5" /> Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-[400px] bg-gradient-to-br from-[#0B1120] to-gray-900 rounded-xl p-6 overflow-hidden">
      {/* Floating particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute pointer-events-none animate-pulse opacity-40"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            fontSize: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`
          }}
        >
          &#10024;
        </div>
      ))}

      {/* Header with Plan Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#00A0E3]/20 text-[#00A0E3] px-4 py-2 rounded-full">
            <TrendingUp className="w-5 h-5" />
            <span className="font-bold text-sm">Smart Exam Tracker</span>
          </div>
        </div>

        {/* Plan Selector */}
        {plans.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="plan-select" className="text-gray-300 text-sm font-medium">Select Plan:</label>
            <select
              id="plan-select"
              value={selectedPlanId || ''}
              onChange={(e) => setSelectedPlanId(Number(e.target.value))}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3]"
            >
              {plans.map((plan) => (
                <option key={plan.plan_id} value={plan.plan_id}>
                  Plan #{plan.plan_id} - {formatDate(plan.created_at)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label="mascot">&#129302;</span>
          <div className="bg-gray-800/80 text-gray-200 text-xs px-3 py-2 rounded-lg border border-gray-700">
            <span>Keep going! You're doing great!</span>
          </div>
        </div>
      </div>

      {/* Main Graph */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>&#128200;</span>
          Your Epic Journey
        </h3>

        <div className="relative w-full" style={{ height: '350px' }}>
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 h-[3px] bg-emerald-500 rounded-full"></span>
            <span className="text-gray-300 text-xs">Target Line</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 h-[3px] bg-gradient-to-r from-[#00A0E3] to-yellow-400 rounded-full"></span>
            <span className="text-gray-300 text-xs">Your Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full"></span>
            <span className="text-gray-300 text-xs">In Safe Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="text-gray-300 text-xs">Needs Improvement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressComparison;
