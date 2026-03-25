import React, { useState, useEffect } from 'react';

const ShootingStars = ({ starCount = 20, sparkleCount = 10 }) => {
  const [stars, setStars] = useState([]);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    // Generate shooting stars
    const generatedStars = Array.from({ length: starCount }, (_, index) => ({
      id: `star-${index}`,
      top: Math.random() * window.innerHeight,
      left: Math.random() * window.innerWidth,
      animationDelay: `${Math.random() * 5}s`,
      duration: `${2 + Math.random() * 3}s`
    }));

    // Generate sparkles
    const generatedSparkles = Array.from({ length: sparkleCount }, (_, index) => ({
      id: `sparkle-${index}`,
      top: Math.random() * window.innerHeight,
      left: Math.random() * window.innerWidth,
      animationDelay: `${Math.random() * 5}s`,
      scale: 0.5 + Math.random() * 1.5
    }));

    setStars(generatedStars);
    setSparkles(generatedSparkles);
  }, [starCount, sparkleCount]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes shooting {
          0% { transform: translateX(0) translateY(0); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateX(300px) translateY(300px); opacity: 0; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute w-0.5 h-0.5 bg-[#00A0E3] rounded-full"
          style={{
            top: `${star.top}px`,
            left: `${star.left}px`,
            animationDelay: star.animationDelay,
            animationDuration: star.duration,
            animation: `shooting ${star.duration} ${star.animationDelay} infinite`,
            boxShadow: '0 0 4px 1px rgba(0, 160, 227, 0.6)',
          }}
        />
      ))}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute w-1 h-1 bg-[#00A0E3] rounded-full"
          style={{
            top: `${sparkle.top}px`,
            left: `${sparkle.left}px`,
            animation: `sparkle 3s ${sparkle.animationDelay} infinite`,
            transform: `scale(${sparkle.scale})`,
            boxShadow: '0 0 6px 2px rgba(0, 160, 227, 0.4)',
          }}
        />
      ))}
    </div>
  );
};

export default ShootingStars;
