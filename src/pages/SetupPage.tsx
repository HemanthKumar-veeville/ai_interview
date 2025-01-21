import { PreInterviewCheck } from "@/components/PreInterviewCheck";
import { bg_01, bg_02, bg_03 } from "@/assets/images";
import { useState } from "react";

// Define the possible setup steps
export type SetupStep = "camera" | "audio" | "system" | "complete";

interface SetupPageProps {
  onComplete: () => Promise<void>;
  startRecording: (stream: MediaStream) => Promise<void>;
}

const SetupPage = ({ onComplete, startRecording }: SetupPageProps) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>("camera");

  const handleStepChange = (step: SetupStep) => {
    setCurrentStep(step);
    if (step === "complete") {
      onComplete();
    }
  };
  console.log({ currentStep });
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background Container */}
      <div
        className="w-full h-screen fixed inset-0 flex items-center justify-center bg-[#f5f5f5]"
        style={{
          backgroundImage: `url(${currentStep === "camera" ? bg_01 : bg_02})`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content Container */}
      <div className="relative flex-1 flex items-center justify-center z-10">
        <div className="w-full max-w-4xl mx-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <PreInterviewCheck
              onComplete={onComplete}
              startRecording={startRecording}
              currentStep={currentStep}
              onStepChange={handleStepChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
