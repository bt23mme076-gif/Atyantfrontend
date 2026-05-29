import { motion } from "framer-motion";
import SeniorCard from "./SeniorCard";

export default function SeniorsPanel({ mentors, selectedId, onSelect }) {
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.1 }}
      className="flex flex-col h-full overflow-y-auto"
      style={{ width: "300px", minWidth: "300px" }}
    >
      {/* Panel Header */}
      <div className="px-4 pt-5 pb-4 flex-shrink-0">
        <p
          className="text-xs font-bold tracking-[0.15em] uppercase"
          style={{ color: "#737373", fontFamily: "Inter, sans-serif" }}
        >
          Matched Seniors
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 px-3 pb-4 overflow-y-auto">
        {mentors.map((mentor, i) => (
          <motion.div
            key={mentor.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 320, damping: 28 }}
          >
            <SeniorCard
              mentor={mentor}
              isSelected={selectedId === mentor.id}
              onClick={() => onSelect(mentor)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
