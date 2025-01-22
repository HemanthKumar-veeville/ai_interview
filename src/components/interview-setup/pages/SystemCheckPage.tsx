import { SystemCheckStep } from "../../interview-setup/SystemCheckStep";
import { bg_03 } from "@/assets/images";
import { StepPage } from "./StepPage";
import { useState, useEffect } from "react";

interface SystemCheckPageProps {
  stream: MediaStream | null;
  onNext: () => Promise<void>;
  onPrevious: () => void;
}

export const SystemCheckPage = ({
  stream,
  onNext,
  onPrevious,
}: SystemCheckPageProps) => {
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Validate all requirements are met
    const validateRequirements = () => {
      if (!stream) return false;

      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      const hasValidVideo =
        videoTracks.length > 0 && videoTracks[0].readyState === "live";
      const hasValidAudio =
        audioTracks.length > 0 && audioTracks[0].readyState === "live";

      return hasValidVideo && hasValidAudio;
    };

    setIsValid(validateRequirements());
  }, [stream]);

  const handleNext = async () => {
    if (!isValid) {
      // You might want to show an error message here
      return;
    }
    await onNext();
  };

  return (
    <StepPage
      title="System Check"
      description="Final verification of your system settings"
      onNext={handleNext}
      onPrevious={onPrevious}
      nextButtonText="Start Interview"
      nextButtonDisabled={!isValid}
      className="text-gray-800"
      titleClassName="text-3xl font-bold text-blue-600"
      descriptionClassName="text-gray-600"
    >
      <div className="w-full max-w-xl mx-auto">
        <SystemCheckStep stream={stream} />
      </div>
    </StepPage>
  );
};
