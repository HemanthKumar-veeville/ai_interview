import { AudioCheckStep } from "../../interview-setup/AudioCheckStep";
import { bg_02 } from "@/assets/images";
import { StepPage } from "./StepPage";

interface AudioCheckPageProps {
  microphoneLevel: number;
  onNext: () => void;
  onPrevious: () => void;
}

export const AudioCheckPage = ({
  microphoneLevel,
  onNext,
  onPrevious,
}: AudioCheckPageProps) => {
  return (
    <StepPage
      title="Audio Check"
      description="Test your microphone and ensure clear audio quality"
      onNext={onNext}
      onPrevious={onPrevious}
      className="text-gray-800"
      titleClassName="text-3xl font-bold text-blue-600"
      descriptionClassName="text-gray-600"
    >
      <div className="w-full max-w-xl mx-auto">
        <AudioCheckStep microphoneLevel={microphoneLevel} />
      </div>
    </StepPage>
  );
};
