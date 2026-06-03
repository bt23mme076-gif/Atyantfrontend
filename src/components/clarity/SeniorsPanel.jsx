import SeniorCard from "./SeniorCard";

export default function SeniorsPanel({ mentors, selectedId, onSelect }) {
  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ width: "100%" }}
    >
      {/* Panel Header */}
      <div className="px-4 pt-5 pb-4 flex-shrink-0">
        <p
          className="text-xs font-bold tracking-[0.15em] uppercase"
          style={{ color: "#978FAB", fontFamily: "Inter, sans-serif" }}
        >
          Matched Seniors
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 px-3 pb-4 overflow-y-auto">
        {mentors.map((mentor, i) => (
          <div key={mentor.id}>
            <SeniorCard
              mentor={mentor}
              isSelected={selectedId === mentor.id}
              onClick={() => onSelect(mentor)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
