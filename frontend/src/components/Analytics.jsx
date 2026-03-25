import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import axiosInstance from '../api/axiosInstance';
import { Loader2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Analytics = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAverageScores = async () => {
      try {
        const response = await axiosInstance.get('/average-score/');
        const data = response.data;

        // Transform backend data: keys are chapter numbers, values are scores
        const chapterNumbers = Object.keys(data).sort((a, b) => Number(a) - Number(b));
        const labels = chapterNumbers.map(num => `Chapter ${num}`);
        const scores = chapterNumbers.map(num => Number(data[num]));

        setChartData({
          labels,
          datasets: [
            {
              label: 'Average Score (%)',
              data: scores,
              backgroundColor: '#00A0E3',
              borderColor: '#0B1120',
              borderWidth: 1,
              borderRadius: 6,
              hoverBackgroundColor: '#0080B8'
            }
          ]
        });
      } catch (error) {
        setChartData({
          labels: [],
          datasets: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAverageScores();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#0B1120',
          font: { weight: 'bold' }
        }
      },
      title: {
        display: true,
        text: 'Student Progress by Chapter',
        color: '#0B1120',
        font: { size: 20, weight: 'bold' },
        padding: 20
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#0B1120' }
      },
      y: {
        beginAtZero: true,
        max: 10,
        grid: { color: 'rgba(0, 160, 227, 0.1)' },
        ticks: {
          color: '#0B1120',
          callback: value => `${value}%`
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-[#0B1120] text-center mb-6">Analytics Dashboard</h2>
        <div className="bg-white rounded-xl shadow-md p-6" style={{ minHeight: 400 }}>
          {loading ? (
            <div className="flex justify-center items-center" style={{ height: 300 }}>
              <Loader2 className="w-8 h-8 text-[#00A0E3] animate-spin" />
            </div>
          ) : (
            <Bar data={chartData} options={options} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
