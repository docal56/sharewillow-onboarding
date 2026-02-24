"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CSVUpload } from "@/components/csv-upload";
import { useConnectFlow } from "@/hooks/use-connect-flow";

export default function ConnectModal() {
  const router = useRouter();
  const {
    handleCSVParsed,
    handleGenerate,
    canGenerate,
    isGenerating,
    error,
  } = useConnectFlow();

  async function onGenerate() {
    const success = await handleGenerate();
    if (success) router.back();
  }

  return (
    <Dialog open onOpenChange={() => router.back()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Connect Your Data
          </DialogTitle>
          <DialogDescription>
            Upload your job data to generate a personalised incentive plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium">
              Upload your job data
            </p>
            <CSVUpload onParsed={handleCSVParsed} />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating plan...
              </span>
            ) : (
              "Generate Plan"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
