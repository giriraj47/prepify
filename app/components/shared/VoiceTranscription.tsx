"use client";

import { useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

interface VoiceTranscriptionButtonProps {
  onTranscript: (transcript: string) => void;
  onInterimTranscript?: (interim: string) => void;
  onListeningChange?: (listening: boolean) => void;
  className?: string;
}

/**
 * A reusable microphone button that handles Azure Speech-to-Text integration.
 * It uses react-speech-recognition with an Azure Cognitive Services polyfill.
 */
export function VoiceTranscriptionButton({
  onTranscript,
  onInterimTranscript,
  onListeningChange,
  className = "",
}: VoiceTranscriptionButtonProps) {
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  // Notify parent of listening state changes
  useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

  // Notify parent of interim transcript changes
  useEffect(() => {
    if (listening && onInterimTranscript) {
      onInterimTranscript(transcript);
    }
  }, [transcript, listening, onInterimTranscript]);

  // When listening stops, send the final transcript to the parent and reset
  useEffect(() => {
    if (!listening && transcript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [listening, transcript, onTranscript, resetTranscript]);

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      // Re-apply the polyfill before starting to guarantee a fresh Azure Speech connection
      if (typeof window !== "undefined") {
        import("web-speech-cognitive-services").then(({ createSpeechServicesPonyfill }) => {
          const rawRegion = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION || "";
          const region = rawRegion.trim().toLowerCase().replace(/\s+/g, "");
          const key = (process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY || "").trim();

          // Azure keys are typically 32-character hex strings. 
          // GUIDs with hyphens are usually Resource IDs, not keys.
          if (key && (key.includes("-") || key.length !== 32)) {
            console.warn("VoiceTranscription: The provided Azure Speech Key looks like a Resource ID or GUID instead of a 32-character API key. This may cause connection failures.");
          }

          if (region && key) {
            const ponyfillFactory = createSpeechServicesPonyfill({
              credentials: {
                region: region,
                subscriptionKey: key,
              },
            });
            
            // Apply the polyfill
            const PolyfilledSpeechRecognition = ponyfillFactory.SpeechRecognition;
            
            // Some versions of the ponyfill might be missing the stop() method on the instance level
            // but have abort(). We ensure a stop() method exists to prevent library crashes.
            if (PolyfilledSpeechRecognition.prototype && !PolyfilledSpeechRecognition.prototype.stop) {
              PolyfilledSpeechRecognition.prototype.stop = function() {
                this.abort();
              };
            }
            
            SpeechRecognition.applyPolyfill(PolyfilledSpeechRecognition);
          }
          
          SpeechRecognition.startListening({ 
            continuous: true, 
            language: "en-US",
            interimResults: true 
          });
        });
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`pointer-events-auto inline-flex h-11 w-11 items-center justify-center transition ${
        listening
          ? "rounded-full bg-[#064e3b] hover:bg-[#065f46]"
          : "rounded-2xl bg-[#0f172a] text-[#44e2cd] shadow-[0_20px_40px_-24px_rgba(68,226,205,0.65)] hover:bg-[#1a2332]"
      } ${className}`}
      title={listening ? "Stop recording" : "Start voice input"}
    >
      {listening ? (
        <div className="h-3.5 w-3.5 rounded-[2px] bg-[#10b981]" />
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2Zm-5 7.5a1 1 0 0 0 1-1V16h-2v1.5a1 1 0 0 0 1 1Zm0-14a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0V5a1 1 0 0 1 1-1Z" />
        </svg>
      )}
    </button>
  );
}

/**
 * A dancing waveform component to provide visual feedback during recording.
 */
export function VoiceWaveform({ isVisible, className = "" }: { isVisible: boolean; className?: string }) {
  if (!isVisible) return null;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-5 items-end gap-[3px]">
        {[12, 16, 20, 14, 18, 12, 16].map((height, i) => (
          <div
            key={i}
            className="animate-waveform w-[3px] rounded-full bg-[#10b981]"
            style={{
              height: `${height}px`,
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
      <span className="text-sm font-medium tracking-wide text-[#10b981]">
        Recording...
      </span>
    </div>
  );
}
