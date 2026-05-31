import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import SeniorsPanel from "./SeniorsPanel";
import SeniorDetail from "./SeniorDetail";
import { clarityAPI } from "../../api";

export default function ClarityView({ initialQuery = "", user, onTalkToMentor }) {
  const [mentors,        setMentors]        = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [inputValue,     setInputValue]     = useState("");
  const [fetchLoading,   setFetchLoading]   = useState(false);
  const [fetchError,     setFetchError]     = useState("");
  const [activeQuery,    setActiveQuery]    = useState(initialQuery);

  // Fetch on mount / when query changes
  useEffect(() => {
    const q =
      initialQuery && initialQuery.trim().length > 2
        ? initialQuery.trim()
        : "How do I get an AI/ML internship from VNIT Metallurgy with no prior experience?";
    setActiveQuery(q);
    setSelectedMentor(null);
    fetchMentors(q);
  }, [initialQuery]);

  // Auto-select top match once results arrive
  useEffect(() => {
    if (mentors.length > 0 && !selectedMentor) {
      setSelectedMentor(mentors[0]);
    }
  }, [mentors]);

  const fetchMentors = async (query) => {
    setFetchLoading(true);
    setFetchError("");
    try {
      const edu  = user?.education?.[0] || {};
      const data = await clarityAPI.match({
        query,
        college: edu.institutionName || edu.institution || "VNIT Nagpur",
        branch:  edu.field           || "Metallurgy",
        year:    edu.year            || "Y3",
        goal:    user?.interests?.[0]|| "AI/ML Internship",
      });
      setMentors(data.mentors || []);
    } catch (e) {
      setFetchError(e.message || "Failed to fetch mentors");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSend = () => {
    const q = inputValue.trim();
    if (q.length < 3) return;
    setActiveQuery(q);
    setInputValue("");
    setSelectedMentor(null);
    fetchMentors(q);
  };

  const edu = user?.education?.[0] || {};
  const contextLine = [
    edu.institutionName || edu.institution || "VNIT Nagpur",
    edu.field || "Metallurgy",
    edu.year  || "Y3",
    edu.cgpa  ? `CGPA ${edu.cgpa}` : null,
    user?.interests?.[0] ? `Goal: ${user.interests[0]}` : "Goal: AI/ML",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ background: "#13121A", fontFamily: "Inter, sans-serif", minHeight: 0 }}
    >
      {/* ── Left: Main content ── */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ borderRight: "1px solid #211F2B" }}
      >
        {/* Question header */}
        <div
          className="px-6 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #211F2B" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "linear-gradient(135deg,#7567C9,#5a52a8)" }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: "#ECEAF3", fontFamily: "Fraunces, serif" }}
              >
                A
              </span>
            </div>
            <div>
              <p
                className="text-sm font-semibold leading-snug"
                style={{ color: "#ECEAF3", fontFamily: "Fraunces, serif" }}
              >
                {activeQuery}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "#5F576F", fontFamily: "Inter, sans-serif" }}
              >
                Context: {contextLine}
              </p>
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {fetchLoading ? (
              <motion.div
                key="loading"
                className="flex flex-col items-center justify-center h-full gap-3"
                style={{ color: "#5F576F" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                <p className="text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                  Finding seniors from your exact background…
                </p>
              </motion.div>
            ) : fetchError ? (
              <motion.div
                key="error"
                className="flex items-center justify-center h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xs" style={{ color: "#f87171", fontFamily: "Inter, sans-serif" }}>
                  {fetchError}
                </p>
              </motion.div>
            ) : selectedMentor ? (
              <motion.div
                key={selectedMentor.id || selectedMentor.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Verified Answer banner */}
                <div
                  className="flex items-center gap-2 px-6 py-2.5 flex-shrink-0"
                  style={{
                    borderBottom: "1px solid #211F2B",
                    background: "rgba(61,190,130,0.04)",
                  }}
                >
                  <CheckCircle size={13} style={{ color: "#3DBE82" }} />
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "#3DBE82", fontFamily: "Inter, sans-serif" }}
                  >
                    Verified Answer · {selectedMentor.name}
                  </span>
                </div>

                {/* Senior detail fills the rest */}
                <div className="flex-1 overflow-hidden">
                  <SeniorDetail
                    mentor={selectedMentor}
                    user={user}
                    onClose={() => setSelectedMentor(null)}
                    onTalkToMentor={onTalkToMentor}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xs" style={{ color: "#5F576F", fontFamily: "Inter, sans-serif" }}>
                  No matching seniors found. Try a different question below.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid #211F2B" }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: "#1A1823", border: "1px solid #322E40" }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a follow-up question…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#ECEAF3", fontFamily: "Inter, sans-serif" }}
            />
            <button
              onClick={handleSend}
              disabled={fetchLoading}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg,#7567C9,#5a52a8)",
                opacity: fetchLoading ? 0.6 : 1,
              }}
            >
              {fetchLoading ? (
                <Loader2
                  size={13}
                  style={{ color: "#13121A", animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Send size={13} style={{ color: "#13121A" }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Matched Seniors panel (always visible) ── */}
      <div
        className="flex flex-col overflow-hidden flex-shrink-0"
        style={{ width: "300px", background: "#0D0C12" }}
      >
        {fetchLoading ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: "#5F576F" }}
          >
            <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
            <p className="text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
              Finding your seniors…
            </p>
          </div>
        ) : mentors.length > 0 ? (
          <SeniorsPanel
            mentors={mentors}
            selectedId={selectedMentor?.id}
            onSelect={(mentor) => setSelectedMentor(mentor)}
          />
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center"
            style={{ color: "#5F576F" }}
          >
            <p className="text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
              {activeQuery
                ? "No matching seniors found. Try a different question."
                : "Ask a question to find matched seniors."}
            </p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}
