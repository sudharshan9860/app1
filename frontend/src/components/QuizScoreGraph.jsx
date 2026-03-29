import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Zap, Trophy, Target, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import axiosInstance from "../api/axiosInstance";
import mascotGif from "../assets/newbot.gif";

/* -- constants -- */
const TARGET_ZONE_MIN = 75;
const DANGER_ZONE_MAX = 35;
const DEFAULT_SUBJECT = "Mathematics";

// NELO brand colours — fixed 4-slot palette
// Slot 0 = most recent attempt, slot 3 = oldest of the 4 shown
const NELO_COLORS = [
  "#4F8EF7", // Blue   — 1st (most recent)
  "#F5A623", // Orange — 2nd
  "#1AA05C", // Green  — 3rd
  "#D0232A", // Red    — 4th (oldest shown)
];

const MAX_ATTEMPTS = 4;

const getQuizColor = (idx) => NELO_COLORS[idx % NELO_COLORS.length];

/* -- truncate long chapter names for X-axis -- */
const TruncatedTick = ({ x, y, payload }) => {
  const maxLen = 14;
  const text =
    payload.value.length > maxLen
      ? payload.value.slice(0, maxLen) + "..."
      : payload.value;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={8}
        textAnchor="end"
        transform="rotate(-35)"
        fill="rgba(100,116,139,0.8)"
        fontSize={10}
        fontWeight={600}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {text}
      </text>
    </g>
  );
};

/* -- overlapping nested bars -- */
const OverlappingBars = (props) => {
  const { x, y, width, height, payload } = props;
  if (!height || height <= 0 || !payload) return null;

  const sorted = payload._sortedAttempts || [];
  const maxScore = payload._maxScore || 1;
  const baseline = y + height;

  return (
    <g>
      {sorted.map((att, i) => {
        const barH = (att.score_pct / maxScore) * height;
        if (barH <= 0) return null;
        const barY = baseline - barH;
        const shrink = i * 5;
        const barW = Math.max(width - shrink, 10);
        const barX = x + (width - barW) / 2;
        const r = Math.min(barW / 3, 6);
        const gradId = `obg-${att.colorHex}-${i}`;

        return (
          <g key={i}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={att.color} stopOpacity={1} />
                <stop offset="100%" stopColor={att.color} stopOpacity={0.72} />
              </linearGradient>
            </defs>
            <path
              d={`
                M${barX},${baseline}
                L${barX},${barY + r}
                Q${barX},${barY} ${barX + r},${barY}
                L${barX + barW - r},${barY}
                Q${barX + barW},${barY} ${barX + barW},${barY + r}
                L${barX + barW},${baseline}
                Z
              `}
              fill={`url(#${gradId})`}
            />
            <rect
              x={barX + 1}
              y={barY + r}
              width={Math.max(barW * 0.1, 2)}
              height={Math.max(barH - r, 0)}
              fill="rgba(255,255,255,0.15)"
              rx={1}
            />
          </g>
        );
      })}
    </g>
  );
};

/* -- custom tooltip -- */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const entry = payload[0]?.payload;
  const attempts = entry?._attempts || [];
  const latestScore =
    attempts.length > 0 ? attempts[attempts.length - 1].score_pct : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#0B1120]">{label}</span>
        <span className="text-sm font-bold text-[#00A0E3]">{latestScore}%</span>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}
      </div>

      <div className="border-t border-gray-100 my-2" />

      {attempts.map((att, i) => {
        const isLatest = i === attempts.length - 1;
        const improvement =
          i > 0 ? att.score_pct - attempts[i - 1].score_pct : null;
        return (
          <div
            key={i}
            className={`flex items-center gap-2 py-1 text-xs ${isLatest && attempts.length > 1 ? "bg-blue-50 -mx-2 px-2 rounded" : ""}`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: att.color }}
            />
            <span className="text-gray-600 flex-1">
              {att.quizLabel}
              {isLatest && attempts.length > 1 ? " (Latest)" : ""}
            </span>
            <span className="text-gray-700 font-medium">
              {att.correct}/{att.total} <strong>{att.score_pct}%</strong>
              {improvement !== null && improvement !== 0 && (
                <span
                  className={`ml-1 ${improvement > 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {improvement > 0 ? "\u2191" : "\u2193"}
                  {Math.abs(improvement)}%
                </span>
              )}
            </span>
          </div>
        );
      })}

      <div className="border-t border-gray-100 my-2" />
      <div className="flex justify-end">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${latestScore >= TARGET_ZONE_MIN ? "bg-green-100 text-green-700" : latestScore <= DANGER_ZONE_MAX ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
        >
          {latestScore >= TARGET_ZONE_MIN
            ? "On Target"
            : latestScore <= DANGER_ZONE_MAX
              ? "Needs Work"
              : "Improving"}
        </span>
      </div>
    </div>
  );
};

/* ======================================
   COMPONENT
   ====================================== */
const QuizScoreGraph = ({ quizMode = "board" }) => {
  const [rawQuizzes, setRawQuizzes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await axiosInstance.fetchQuizzes();
        const quizzes = Array.isArray(data) ? data : data.quizzes || [];
        setRawQuizzes(quizzes.length > 0 ? quizzes : null);
      } catch (e) {
        console.error("Quiz score fetch error:", e);
        setError("Failed to load score data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* -- Extract unique subjects from all quizzes -- */
  const subjects = useMemo(() => {
    if (!rawQuizzes) return [];
    const subjectSet = new Set();
    rawQuizzes.forEach((quiz) => {
      const subject = quiz.graph_data?.subject || DEFAULT_SUBJECT;
      if (quizMode === "jee_foundation") {
        // JEE Foundation toggle → show only JEE_FOUNDATION_MATH entries
        if (subject === "JEE_FOUNDATION_MATH") subjectSet.add(subject);
      } else {
        // Board toggle → exclude JEE_FOUNDATION_MATH entries
        if (subject !== "JEE_FOUNDATION_MATH") subjectSet.add(subject);
      }
    });
    return [...subjectSet].sort();
  }, [rawQuizzes, quizMode]);

  // Auto-select first subject when data loads
  useEffect(() => {
    if (subjects.length > 0 && selectedSubject === null) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  // Reset when quiz mode toggles so auto-select picks correct first subject
  useEffect(() => {
    setSelectedSubject(null);
  }, [quizMode]);

  /* -- Filter quizzes by selected subject, then build chart -- */
  const { chartData, quizLabels, quizColorMap, stats } = useMemo(() => {
    if (!rawQuizzes || !selectedSubject)
      return { chartData: [], quizLabels: [], quizColorMap: {}, stats: null };

    const allFiltered = rawQuizzes.filter((quiz) => {
      const subject = quiz.graph_data?.subject || DEFAULT_SUBJECT;
      return subject === selectedSubject;
    });

    if (allFiltered.length === 0)
      return { chartData: [], quizLabels: [], quizColorMap: {}, stats: null };

    // Keep only the 4 most recent attempts (last MAX_ATTEMPTS from the array)
    // The backend returns quizzes in chronological order (oldest first),
    // so we slice from the end.
    const filtered = allFiltered.slice(-MAX_ATTEMPTS);

    // Label them relative to how many total attempts exist, so "Test 40" still
    // reads correctly even though we only render 4 bars per chapter.
    const totalOffset = allFiltered.length - filtered.length;
    const labels = filtered.map((_, i) => `Test ${totalOffset + i + 1}`);

    const colorMap = {};
    // Index into NELO_COLORS by position within the 4 shown (0 = newest shown)
    // We want: newest attempt → Blue (index 0), next → Orange (1), etc.
    // filtered[0] is the oldest of the 4 shown, filtered[3] is the newest.
    filtered.forEach((_, i) => {
      // Reverse so newest = index 0 in the palette
      const paletteIdx = filtered.length - 1 - i;
      colorMap[labels[i]] = NELO_COLORS[paletteIdx];
    });

    const chapterMap = {};
    filtered.forEach((quiz, qIdx) => {
      const breakdown = quiz.graph_data?.chapter_breakdown || [];
      const quizLabel = labels[qIdx];
      breakdown.forEach((ch) => {
        if (!chapterMap[ch.chapter]) chapterMap[ch.chapter] = [];
        chapterMap[ch.chapter].push({
          quizLabel,
          correct: ch.correct,
          total: ch.total,
          score_pct: ch.score_pct,
          color: colorMap[quizLabel],
          colorHex: colorMap[quizLabel].replace("#", ""),
        });
      });
    });

    const data = Object.entries(chapterMap).map(([chapter, attempts]) => {
      const maxScore = Math.max(...attempts.map((a) => a.score_pct));
      const sortedAttempts = [...attempts].sort(
        (a, b) => b.score_pct - a.score_pct,
      );
      return {
        chapter,
        _maxScore: maxScore,
        _attempts: attempts,
        _sortedAttempts: sortedAttempts,
      };
    });

    const activeLabels = labels.filter((q) =>
      data.some((entry) => entry._attempts.some((a) => a.quizLabel === q)),
    );

    const allScores = data.flatMap((d) => d._attempts.map((a) => a.score_pct));
    const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0;

    return {
      chartData: data,
      quizLabels: activeLabels,
      quizColorMap: colorMap,
      stats: {
        totalQuizzes: allFiltered.length, // total ever, not just 4 shown
        chapters: data.length,
        bestScore,
      },
    };
  }, [rawQuizzes, selectedSubject]);

  const statCards = stats
    ? [
        {
          label: "Tests",
          value: stats.totalQuizzes,
          icon: BarChart3,
          color: "#00A0E3",
        },
        {
          label: "Chapters",
          value: stats.chapters,
          icon: Target,
          color: "#f97316",
        },
        {
          label: "Best Score",
          value: `${stats.bestScore.toFixed(1)}%`,
          icon: Trophy,
          color: "#22c55e",
        },
      ]
    : [];

  if (loading) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-3 border-[#00A0E3] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Loading your progress...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }
  if (!rawQuizzes) {
    return (
      <div
        className={`flex items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <img
          src={mascotGif}
          alt="Study Buddy"
          className="w-20 h-20 object-contain"
        />
        <div className="flex flex-col gap-2">
          <p className="text-gray-600 text-sm">
            Take a Test to unlock your subject-wise score chart!
          </p>
          <Link
            to="/quiz-mode"
            className="inline-flex items-center gap-2 bg-[#00A0E3] hover:bg-[#0080B8] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors w-fit"
          >
            <Zap className="w-4 h-4" /> Start First Quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 relative overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h3 className="text-sm sm:text-base font-bold text-[#0B1120]">
          Subject-wise Score Breakdown
        </h3>
        {subjects.length > 1 && (
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-[#0B1120] bg-white focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/30 focus:border-[#00A0E3] w-full sm:w-auto"
            value={selectedSubject || ""}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 sm:px-3 py-2"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-bold text-[#0B1120] truncate">
                  {s.value}
                </span>
                <span className="block text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider">
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-2 sm:p-4 -mx-2 sm:mx-0 overflow-x-auto">
        <div className="h-[280px] sm:h-[320px] min-w-[480px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                barCategoryGap="20%"
              >
                <defs>
                  <linearGradient
                    id="targetZoneGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} />
                    <stop
                      offset="100%"
                      stopColor="#22c55e"
                      stopOpacity={0.04}
                    />
                  </linearGradient>
                  <linearGradient
                    id="dangerZoneGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.04} />
                    <stop
                      offset="100%"
                      stopColor="#ef4444"
                      stopOpacity={0.12}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 5"
                  vertical={false}
                  stroke="rgba(148,163,184,0.18)"
                />

                <ReferenceArea
                  y1={0}
                  y2={DANGER_ZONE_MAX}
                  fill="url(#dangerZoneGrad)"
                  fillOpacity={1}
                  ifOverflow="extendDomain"
                />
                <ReferenceArea
                  y1={TARGET_ZONE_MIN}
                  y2={100}
                  fill="url(#targetZoneGrad)"
                  fillOpacity={1}
                  ifOverflow="extendDomain"
                />

                <ReferenceLine
                  y={DANGER_ZONE_MAX}
                  stroke="#ef4444"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  label={{
                    value: `${DANGER_ZONE_MAX}%`,
                    position: "right",
                    fill: "#ef4444",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <ReferenceLine
                  y={TARGET_ZONE_MIN}
                  stroke="#22c55e"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  label={{
                    value: `${TARGET_ZONE_MIN}%`,
                    position: "right",
                    fill: "#22c55e",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />

                <XAxis
                  dataKey="chapter"
                  tick={<TruncatedTick />}
                  axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
                  tickLine={false}
                  interval={0}
                />

                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{
                    fontSize: 11,
                    fontWeight: 600,
                    fill: "rgba(100,116,139,0.7)",
                  }}
                  axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
                  tickLine={false}
                  label={{
                    value: "Score (%)",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    style: {
                      fontSize: 11,
                      fontWeight: 600,
                      textAnchor: "middle",
                      fill: "rgba(100,116,139,0.6)",
                    },
                  }}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(0,0,0,0.03)", radius: 4 }}
                />

                <Bar
                  dataKey="_maxScore"
                  shape={<OverlappingBars />}
                  maxBarSize={64}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No test data for {selectedSubject}
            </div>
          )}
        </div>

        {/* ── Attempt colour legend ── */}
        {quizLabels.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-4 pt-3 border-t border-gray-100">
            {quizLabels.map((label, i) => {
              const totalShown = quizLabels.length;
              // Position from newest: quizLabels last item = newest attempt
              const posFromNewest = totalShown - 1 - i;
              const attemptLabel =
                posFromNewest === 0
                  ? "Latest attempt"
                  : posFromNewest === 1
                    ? "2nd latest"
                    : posFromNewest === 2
                      ? "3rd latest"
                      : "4th latest";
              return (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-gray-600"
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ background: quizColorMap[label] }}
                  />
                  <span
                    className="font-medium"
                    style={{ color: quizColorMap[label] }}
                  >
                    {attemptLabel}
                  </span>
                  <span className="text-gray-400">({label})</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Zone legend ── */}
        <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-sm bg-green-500/20 border border-green-500/30" />
            <span>Target Zone</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/30" />
            <span>Danger Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizScoreGraph;
