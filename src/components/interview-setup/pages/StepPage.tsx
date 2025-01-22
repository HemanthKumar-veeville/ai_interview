import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StepPageProps {
  title: string;
  description: string;
  onNext: () => void;
  onPrevious: () => void;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  showPrevious?: boolean;
  nextButtonText?: string;
  nextButtonDisabled?: boolean;
}

export const StepPage = ({
  title,
  description,
  children,
  onNext,
  onPrevious,
  showPrevious = true,
  nextButtonText = "Next",
  nextButtonDisabled = false,
  className,
  titleClassName,
  descriptionClassName,
}: StepPageProps) => {
  return (
    <div className="relative flex-1 flex flex-col justify-between z-10 max-w-3xl mx-auto w-full">
      <div className="space-y-6">
        {(title || description) && (
          <div>
            {title && (
              <h2 className={`text-2xl font-semibold ${titleClassName || ""}`}>
                {title}
              </h2>
            )}
            {description && (
              <p
                className={`text-muted-foreground ${
                  descriptionClassName || ""
                }`}
              >
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>

      <div className="flex justify-between mt-6">
        {showPrevious && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onPrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            </TooltipTrigger>
            <TooltipContent>Go back to previous step</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onNext}
              disabled={nextButtonDisabled}
              className="bg-primary hover:bg-primary/90 ml-auto"
            >
              {nextButtonText}
              {nextButtonText === "Next" && (
                <ChevronRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {nextButtonText === "Start Interview"
              ? "Begin your interview"
              : "Continue to next step"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
