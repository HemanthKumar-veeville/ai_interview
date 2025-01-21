import { VideoRecorder } from "@/components/VideoRecorder";
import { Chat } from "@/components/Chat";
import { bg_03 } from "@/assets/images";

interface InterviewPageProps {
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  cameraStream: MediaStream | null;
  interviewerStream: MediaStream | null;
  fileId: string;
  isInterviewEnded: boolean;
  onInterviewEnd: () => void;
}

const InterviewPage = ({
  stream,
  screenStream,
  cameraStream,
  interviewerStream,
  fileId,
  isInterviewEnded,
  onInterviewEnd,
}: InterviewPageProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="w-full h-screen fixed inset-0 flex items-center justify-center bg-[#f5f5f5]"
        style={{
          backgroundImage: `url(${bg_03})`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-blue-600/10" />
      </div>

      <div className="relative flex-1 z-10">
        <div
          className={`h-screen ${
            isInterviewEnded
              ? "flex justify-center items-center p-4"
              : "grid grid-cols-[minmax(360px,_400px),1fr] gap-5 p-5"
          }`}
        >
          {!isInterviewEnded && (
            <div className="relative h-full flex items-center">
              <VideoRecorder
                stream={stream}
                screenStream={screenStream}
                cameraStream={cameraStream}
                interviewerStream={interviewerStream}
              />
            </div>
          )}
          <div
            className={`flex flex-col ${
              isInterviewEnded ? "w-full max-w-3xl" : ""
            }`}
          >
            <div className="flex-1 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
              <Chat onInterviewEnd={onInterviewEnd} instanceId={fileId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
