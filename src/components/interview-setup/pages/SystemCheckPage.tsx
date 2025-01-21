import { SystemCheckStep } from "../../interview-setup/SystemCheckStep";
import { bg_03 } from "@/assets/images";
import { StepPage } from "./StepPage";

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
  return (
    <StepPage
      title="System Check"
      description="Final verification of your system settings"
      onNext={onNext}
      onPrevious={onPrevious}
      nextButtonText="Start Interview"
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
