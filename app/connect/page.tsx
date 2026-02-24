"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKeyInput } from "@/components/api-key-input";
import { CSVUpload } from "@/components/csv-upload";
import { useConnectFlow } from "@/hooks/use-connect-flow";

export default function ConnectPage() {
  const router = useRouter();
  const {
    localApiKey,
    setLocalApiKey,
    handleCSVParsed,
    handleGenerate,
    canGenerate,
    isGenerating,
    error,
  } = useConnectFlow();

  async function onGenerate() {
    const success = await handleGenerate();
    if (success) router.push("/benchmarks");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Connect Your Data
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload your job data and enter your API key to generate a
            personalised incentive plan.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium">
              Step 1: Enter your API key
            </p>
            <ApiKeyInput value={localApiKey} onChange={setLocalApiKey} />
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-sm font-medium">
              Step 2: Upload your job data
            </p>
            <CSVUpload onParsed={handleCSVParsed} />
          </div>

          <Separator />

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
        </CardContent>
      </Card>
    </div>
  );
}
