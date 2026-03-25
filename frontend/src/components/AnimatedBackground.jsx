import React, { useMemo } from "react";
import { motion } from "framer-motion";

// Math and Science symbols for the floating animation
const SYMBOLS = [
  // Math symbols
  "\u222B", "\u2211", "\u220F", "\u221A", "\u221E", "\u03C0", "\u03B8", "\u03B1", "\u03B2", "\u03B3", "\u03B4", "\u03BB", "\u03BC", "\u03C3", "\u0394", "\u03A9",
  "\u00B1", "\u00F7", "\u00D7", "\u2260", "\u2248", "\u2264", "\u2265", "\u2202", "\u2207", "\u2208", "\u2209", "\u2282", "\u2283", "\u222A", "\u2229",
  // Science symbols
  "\u269B", "\uD83E\uDDEC", "\uD83D\uDD2C", "\u26A1", "\u2622", "\u2697", "\uD83E\uDDEA", "\uD83D\uDCD0", "\uD83D\uDCCF", "\uD83D\uDD2D",
  // Formulas and expressions
  "E=mc\u00B2", "F=ma", "a\u00B2+b\u00B2", "sin", "cos", "tan", "log", "ln", "lim", "dx",
  "H\u2082O", "CO\u2082", "O\u2082", "NaCl", "Fe", "Au", "Ag", "Cu",
  // Geometric shapes
  "\u25B3", "\u25A1", "\u25CB", "\u25C7", "\u2B21", "\u2B22",
  // Numbers
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
];

// Color palette for symbols
const COLORS = [
  "rgba(0, 160, 227, 0.6)",   // Blue accent
  "rgba(0, 128, 184, 0.6)",   // Blue hover
  "rgba(0, 160, 227, 0.5)",   // Blue lighter
  "rgba(0, 128, 184, 0.5)",   // Blue hover lighter
  "rgba(11, 17, 32, 0.3)",    // Dark accent
  "rgba(0, 160, 227, 0.4)",   // Blue subtle
  "rgba(0, 128, 184, 0.4)",   // Blue hover subtle
  "rgba(11, 17, 32, 0.2)",    // Dark subtle
];

// Generate random number within range
const random = (min, max) => Math.random() * (max - min) + min;

// Generate a random symbol configuration
const generateSymbol = (index, totalSymbols) => {
  const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = random(14, 32);
  const duration = random(15, 35);
  const delay = random(0, 10);

  // Distribute symbols across the viewport
  const startX = random(5, 95);
  const startY = random(100, 120); // Start below viewport
  const endY = random(-20, -5); // End above viewport

  // Add some horizontal drift
  const driftX = random(-30, 30);

  return {
    id: index,
    symbol,
    color,
    size,
    duration,
    delay,
    startX,
    startY,
    endY,
    driftX,
    rotation: random(0, 360),
    rotationEnd: random(-180, 180),
  };
};

const FloatingSymbol = React.memo(({ config, isDarkMode }) => {
  const symbolVariants = {
    animate: {
      y: [`${config.startY}vh`, `${config.endY}vh`],
      x: [`${config.startX}vw`, `${config.startX + config.driftX}vw`],
      rotate: [config.rotation, config.rotation + config.rotationEnd],
      opacity: [0, 0.8, 0.8, 0],
      scale: [0.5, 1, 1, 0.5],
    },
  };

  return (
    <motion.div
      style={{
        position: "absolute",
        fontSize: `${config.size}px`,
        color: isDarkMode ? config.color : config.color.replace("0.6", "0.4").replace("0.5", "0.3"),
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontWeight: config.symbol.length > 2 ? 500 : 600,
        textShadow: isDarkMode
          ? `0 0 10px ${config.color}, 0 0 20px ${config.color.replace("0.6", "0.3")}`
          : `0 0 8px ${config.color.replace("0.6", "0.2")}`,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 0,
        willChange: "transform, opacity",
      }}
      variants={symbolVariants}
      animate="animate"
      transition={{
        duration: config.duration,
        delay: config.delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {config.symbol}
    </motion.div>
  );
});

FloatingSymbol.displayName = "FloatingSymbol";

// Glowing orb component for ambient lighting effect
const GlowingOrb = React.memo(({ index, isDarkMode }) => {
  const colors = [
    "rgba(0, 160, 227, 0.15)",
    "rgba(0, 128, 184, 0.12)",
    "rgba(0, 160, 227, 0.12)",
    "rgba(0, 128, 184, 0.15)",
  ];

  const size = random(200, 400);
  const x = random(10, 90);
  const y = random(10, 90);
  const color = colors[index % colors.length];

  return (
    <motion.div
      style={{
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: isDarkMode
          ? `radial-gradient(circle, ${color} 0%, transparent 70%)`
          : `radial-gradient(circle, ${color.replace("0.15", "0.08").replace("0.12", "0.06")} 0%, transparent 70%)`,
        filter: "blur(40px)",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
        x: [0, random(-50, 50), 0],
        y: [0, random(-50, 50), 0],
      }}
      transition={{
        duration: random(8, 15),
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
});

GlowingOrb.displayName = "GlowingOrb";

// Grid pattern overlay
const GridPattern = React.memo(({ isDarkMode }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: isDarkMode
          ? `linear-gradient(rgba(0, 160, 227, 0.03) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0, 160, 227, 0.03) 1px, transparent 1px)`
          : `linear-gradient(rgba(0, 128, 184, 0.04) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0, 128, 184, 0.04) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }}
    />
  );
});

GridPattern.displayName = "GridPattern";

// Particle burst effect on interaction
const ParticleBurst = React.memo(({ x, y, onComplete }) => {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i * 30) * (Math.PI / 180),
      distance: random(30, 80),
      size: random(4, 8),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })),
  []);

  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          style={{
            position: "absolute",
            width: particle.size,
            height: particle.size,
            borderRadius: "50%",
            backgroundColor: particle.color,
            boxShadow: `0 0 6px ${particle.color}`,
          }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos(particle.angle) * particle.distance,
            y: Math.sin(particle.angle) * particle.distance,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
          onAnimationComplete={particle.id === 0 ? onComplete : undefined}
        />
      ))}
    </div>
  );
});

ParticleBurst.displayName = "ParticleBurst";

function AnimatedBackground({ isDarkMode = false, symbolCount = 30, showOrbs = true }) {
  // Generate symbols only once on mount
  const symbols = useMemo(
    () => Array.from({ length: symbolCount }, (_, i) => generateSymbol(i, symbolCount)),
    [symbolCount]
  );

  // Generate orbs
  const orbs = useMemo(
    () => Array.from({ length: 4 }, (_, i) => i),
    []
  );

  return (
    <div
      className={`fixed inset-0 overflow-hidden z-0 ${
        isDarkMode
          ? 'bg-gradient-to-br from-[#0B1120] via-[#0B1120]/95 to-[#0B1120]'
          : 'bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]'
      }`}
    >
      {/* Grid pattern */}
      <GridPattern isDarkMode={isDarkMode} />

      {/* Glowing orbs for ambient effect */}
      {showOrbs && orbs.map((index) => (
        <GlowingOrb key={index} index={index} isDarkMode={isDarkMode} />
      ))}

      {/* Floating symbols */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {symbols.map((config) => (
          <FloatingSymbol key={config.id} config={config} isDarkMode={isDarkMode} />
        ))}
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: isDarkMode
            ? 'radial-gradient(ellipse at center, transparent 50%, rgba(11, 17, 32, 0.4) 100%)'
            : 'radial-gradient(ellipse at center, transparent 50%, rgba(248, 250, 252, 0.4) 100%)',
        }}
      />
    </div>
  );
}

export default React.memo(AnimatedBackground);
