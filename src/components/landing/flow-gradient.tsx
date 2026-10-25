/**
 * Flow gradient background — a few large, blurred, slow-moving orbs.
 * Goal: subtle ambient warmth without being flashy.
 * Used as fixed background behind the landing page hero/sections.
 */
import { motion } from "framer-motion";

export function FlowGradient() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-paper">
      {/* Top-left orb — soft gold */}
      <motion.div
        className="absolute -top-32 -left-40 h-[480px] w-[480px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(180,138,52,0.18), rgba(180,138,52,0) 70%)" }}
        initial={{ x: 0, y: 0 }}
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Top-right orb — saffron tint */}
      <motion.div
        className="absolute -top-20 right-[-10rem] h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(212,153,73,0.16), rgba(212,153,73,0) 70%)" }}
        initial={{ x: 0, y: 0 }}
        animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Middle-left orb — soft jade (for variety) */}
      <motion.div
        className="absolute top-[40%] -left-32 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(82,127,98,0.10), rgba(82,127,98,0) 70%)" }}
        initial={{ x: 0, y: 0 }}
        animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bottom-right orb — warm ochre */}
      <motion.div
        className="absolute bottom-[-8rem] right-[-12rem] h-[560px] w-[560px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(170,121,55,0.14), rgba(170,121,55,0) 70%)" }}
        initial={{ x: 0, y: 0 }}
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Faint grid overlay (academic / blueprint feel) */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
