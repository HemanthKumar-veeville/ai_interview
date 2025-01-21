import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { bg_01 } from "@/assets/images";

interface ConsentPageProps {
  onConsent: () => void;
  showDialog: boolean;
  onDialogChange: (show: boolean) => void;
}

const ConsentPage = ({
  onConsent,
  showDialog,
  onDialogChange,
}: ConsentPageProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background Container */}
      <div
        className="w-full h-screen fixed inset-0 flex items-center justify-center bg-[#f5f5f5]"
        style={{
          backgroundImage: `url(${bg_01})`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content Container */}
      <div className="relative flex-1 flex items-center justify-center p-4 z-10">
        <Card className="w-full max-w-[425px] bg-white border-none shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="space-y-4 pb-3">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-950 bg-clip-text text-transparent text-center">
              Welcome
            </CardTitle>
            <CardDescription className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              This application will record video and audio during your interview
              session. By clicking "I Agree", you consent to being recorded
              during this session.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-2 pb-6">
            <Button
              onClick={onConsent}
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white transition-all duration-300 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              I Agree
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ConsentPage;
