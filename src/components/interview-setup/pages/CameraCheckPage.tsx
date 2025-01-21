import { CameraCheckStep } from "../../interview-setup/CameraCheckStep";
import { bg_01 } from "@/assets/images";
import { StepPage } from "./StepPage";

interface CameraCheckPageProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  error: string | null;
  onNext: () => void;
}

export const CameraCheckPage = ({
  videoRef,
  error,
  onNext,
}: CameraCheckPageProps) => {
  return (
    <StepPage onNext={onNext} showPrevious={false}>
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-blue-100/20 p-8">
        <CameraCheckStep videoRef={videoRef} error={error} />
      </div>
    </StepPage>
  );
};
