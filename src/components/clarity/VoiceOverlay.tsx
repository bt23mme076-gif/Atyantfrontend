import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";

interface VoiceOverlayProps {
  isOpen: boolean;
  selectedLang: "en-IN" | "hi-IN";
  setSelectedLang: (lang: "en-IN" | "hi-IN") => void;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

const TEXT = {
  "en-IN": {
    listening: "Listening...",
    speak: "Speak now",
    processing: "Processing...",
    unsupported: "Voice input is not supported on this browser.",
  },
  "hi-IN": {
    listening: "आपकी बात सुन रहे हैं...",
    speak: "बोलिए",
    processing: "प्रोसेस हो रहा है...",
    unsupported: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है।",
  },
};

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({
  isOpen,
  selectedLang,
  setSelectedLang,
  onClose,
  onTranscript,
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>("");
  const hasSentTranscriptRef = useRef<boolean>(false);

  // Speech Recognition management
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const resetSilenceTimer = () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      silenceTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 3000); // 3 seconds of silence
    };

    if (isOpen) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
        setTranscript("");
        latestTranscriptRef.current = "";
        hasSentTranscriptRef.current = false;
        setErrorMessage("");
        resetSilenceTimer();
      };

      recognition.onresult = (event: any) => {
        resetSilenceTimer();
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const combined = finalTranscript || interimTranscript;
        setTranscript(combined);
        latestTranscriptRef.current = combined;

        if (finalTranscript) {
          setIsProcessing(true);
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          hasSentTranscriptRef.current = true;
          onTranscript(finalTranscript);
          setTimeout(() => {
            onClose();
          }, 500);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setIsProcessing(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        hasSentTranscriptRef.current = true; // Prevent submitting partial text on error

        if (event.error === "not-allowed") {
          setErrorMessage(selectedLang === "en-IN" ? "Microphone access blocked. Please enable it in browser settings." : "माइक्रोफ़ोन एक्सेस ब्लॉक है। कृपया ब्राउज़र सेटिंग में इसे चालू करें।");
        } else if (event.error === "no-speech") {
          setErrorMessage(selectedLang === "en-IN" ? "No speech detected. Try speaking again." : "कोई आवाज़ नहीं सुनी गई। फिर से बोलें।");
        } else {
          setErrorMessage(selectedLang === "en-IN" ? `Error: ${event.error}` : `त्रुटि: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Fallback: If recognition finished but did not mark results as final, submit whatever was captured
        if (!hasSentTranscriptRef.current && latestTranscriptRef.current.trim()) {
          setIsProcessing(true);
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          hasSentTranscriptRef.current = true;
          onTranscript(latestTranscriptRef.current);
          setTimeout(() => {
            onClose();
          }, 500);
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (e: any) {
        console.warn("Speech recognition failed to start", e);
        setErrorMessage(selectedLang === "en-IN" ? `Failed to start: ${e.message || e}` : `शुरू करने में विफल: ${e.message || e}`);
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      setIsListening(false);
      setIsProcessing(false);
      setTranscript("");
      setErrorMessage("");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [isOpen, selectedLang, onTranscript, onClose]);

  const currentText = TEXT[selectedLang] || TEXT["en-IN"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          {/* Main Card */}
          <motion.div
            className="w-[420px] h-[340px] p-6 rounded-[28px] flex flex-col items-center justify-between relative bg-white/85 dark:bg-[#111111]/90 border border-white/20 dark:border-white/5 backdrop-blur-[20px] shadow-[0_20px_60px_rgba(124,92,252,0.18)]"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()} // Prevent closing overlay when clicking inside the card
          >
            {/* Top Right Control Row */}
            <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
              <button
                onClick={() =>
                  setSelectedLang(selectedLang === "en-IN" ? "hi-IN" : "en-IN")
                }
                className="px-3 py-1 text-xs font-bold rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                title={
                  selectedLang === "en-IN"
                    ? "Switch to Hindi"
                    : "Switch to English"
                }
              >
                {selectedLang === "en-IN" ? "EN" : "हिंदी"}
              </button>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Central Animated Mic + Concentric Ripple Rings */}
            <div className="relative flex items-center justify-center w-full h-[150px] mt-6">
              {isListening &&
                [0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-[#7C5CFC]/10"
                    style={{
                      width: 96,
                      height: 96,
                    }}
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{
                      scale: 2.5,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeOut",
                    }}
                  />
                ))}

              {/* Centered Mic Icon */}
              <motion.div
                className="w-24 h-24 rounded-full flex items-center justify-center bg-[#7C5CFC] text-white z-10"
                style={{
                  boxShadow: "0 0 50px rgba(124, 92, 252, 0.4)",
                }}
                animate={
                  isListening
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : { scale: 1 }
                }
                transition={
                  isListening
                    ? {
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    : undefined
                }
              >
                <Mic size={36} />
              </motion.div>
            </div>

            {/* Status Title */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#7C5CFC] dark:text-[#A99CEC]">
                {!isSupported
                  ? currentText.unsupported
                  : isProcessing
                  ? currentText.processing
                  : isListening
                  ? currentText.listening
                  : currentText.speak}
              </h3>
            </div>

            {/* Live Transcript / Error Box */}
            <div className="w-full flex justify-center items-center h-14 px-4 overflow-hidden">
              {!isSupported ? (
                <p className="text-red-500 font-medium text-center text-sm">
                  {currentText.unsupported}
                </p>
              ) : errorMessage ? (
                <p className="text-red-500 font-medium text-center text-sm">
                  {errorMessage}
                </p>
              ) : transcript ? (
                <p className="text-neutral-700 dark:text-neutral-200 text-center max-h-14 overflow-y-auto text-sm leading-relaxed font-semibold">
                  “{transcript}”
                </p>
              ) : (
                <p className="text-neutral-400 dark:text-neutral-500 text-center text-xs italic">
                  {selectedLang === "en-IN"
                    ? "Start speaking..."
                    : "बोलना शुरू करें..."}
                </p>
              )}
            </div>

            {/* Randomized Waveform Visualizer (12 bars, 4px gap, gradient rounded) */}
            <div className="flex items-end justify-center gap-1 h-[40px] w-full mb-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-full bg-gradient-to-t from-[#7C5CFC] to-[#9F7AEA]"
                  animate={{
                    height: isListening
                      ? [10, Math.random() * 30 + 10, 10]
                      : 4,
                  }}
                  transition={
                    isListening
                      ? {
                          duration: 0.5 + Math.random() * 0.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                      : { duration: 0.2 }
                  }
                  style={{ width: "4px" }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default VoiceOverlay;
