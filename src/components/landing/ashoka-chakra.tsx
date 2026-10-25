/**
 * Ashoka Chakra — 24-spoke SVG.
 * Used as the brand mark on the landing page.
 * - Hero variant: large, slowly rotating, gold-on-cream
 * - Compact variant: small logo, static (for header/sidebar)
 *
 * Anatomy: outer ring + 24 evenly-spaced spokes + small hub.
 * Designed to read as the national emblem without being a literal copy.
 */
import { motion } from "framer-motion";

type Props = {
  size?: number;
  className?: string;
  /** false = static (default for compact). true = slow forward rotation. */
  animate?: boolean;
  /** stroke color (tailwind currentColor by default) */
  color?: string;
};

export function AshokaChakra({ size = 220, className = "", animate = true, color = "currentColor" }: Props) {
  const spokes = 24;
  const radius = 48;
  const cx = 50;
  const cy = 50;
  // Pre-compute spoke endpoints for cleaner JSX
  const spokeLines = Array.from({ length: spokes }, (_, i) => {
    const angle = (i * 360) / spokes;
    const rad = (angle * Math.PI) / 180;
    const x2 = cx + radius * Math.cos(rad);
    const y2 = cy + radius * Math.sin(rad);
    return { angle, x2, y2 };
  });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ color }}
      initial={animate ? { rotate: 0 } : undefined}
      animate={animate ? { rotate: 360 } : undefined}
      transition={animate ? { duration: 120, repeat: Infinity, ease: "linear" } : undefined}
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth="1.5" opacity="0.95" />
      <circle cx={cx} cy={cy} r={radius - 3} fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />

      {/* 24 spokes */}
      {spokeLines.map((s, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={s.x2} y2={s.y2}
          stroke={color}
          strokeWidth="0.7"
          opacity="0.85"
        />
      ))}

      {/* Inner small ring (hub) */}
      <circle cx={cx} cy={cy} r="6" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r="2.2" fill={color} opacity="0.95" />

      {/* Dharmachakra arcs at tips of spokes (small accent every 3 spokes) */}
      {spokeLines.filter((_, i) => i % 3 === 0).map((s, i) => (
        <circle
          key={`tip-${i}`}
          cx={s.x2} cy={s.y2}
          r="0.9" fill={color} opacity="0.6"
        />
      ))}
    </motion.svg>
  );
}
