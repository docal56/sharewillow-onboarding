"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConnectFlow } from "@/hooks/use-connect-flow";
import { parseCSV } from "@/lib/csv-parser";
import { X } from "lucide-react";

const serviceTitanIcon =
  "https://www.figma.com/api/mcp/asset/a8f8fb03-3479-411f-90a5-b4a42326eceb";
const uploadCsvIcon =
  "https://www.figma.com/api/mcp/asset/d0993f70-3501-4bfd-ba29-f5ac48265b84";

export default function ConnectModal() {
  const router = useRouter();
  const {
    handleCSVParsed,
    handleGenerate,
    canGenerate,
    isGenerating,
    error,
    localSummary,
  } = useConnectFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  async function onGenerate() {
    const success = await handleGenerate();
    if (success) router.back();
  }

  async function onUploadChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/\.csv$/i.test(file.name)) {
      setUploadError("Please upload a CSV file.");
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File is too large. Maximum size is 10MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    try {
      const result = await parseCSV(file);
      if (result.rows.length === 0) {
        setUploadError("The CSV file appears to be empty.");
        return;
      }
      handleCSVParsed(result);
      setUploadedFileName(file.name);
    } catch {
      setUploadError("Failed to parse the CSV file. Please check the format.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  return (
    <Dialog open onOpenChange={() => router.back()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[rgba(0,0,0,0.4)] backdrop-blur-[24px]"
        className="w-[714px] max-w-[714px] sm:max-w-[714px] gap-0 rounded-[24px] border-none p-0 shadow-[0px_8px_32px_rgba(0,0,0,0.12)]"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute right-5 top-5 inline-flex size-6 items-center justify-center text-[#171717]"
          aria-label="Close"
        >
          <X className="size-5" strokeWidth={1.75} />
        </button>

        <div className="flex flex-col items-start gap-6 px-8 pb-10 pt-10">
          <div className="flex w-full flex-col items-end gap-6">
            <DialogHeader className="w-full gap-2 text-left">
              <DialogTitle className="font-display text-[32px] font-medium leading-none text-[#171717]">
                Connect your data
              </DialogTitle>
              <DialogDescription className="text-[16px] leading-6 text-[#585858]">
                Add your data sources to get more detailed recommendations
              </DialogDescription>
            </DialogHeader>

            <div className="flex w-full flex-col gap-4">
              <div className="flex w-full flex-col items-start gap-[18px] rounded-[12px] border border-[#dddddd] bg-white p-5">
                <div className="flex flex-col gap-2">
                  <div className="flex h-[26px] items-center gap-2">
                    <div className="relative size-6 overflow-hidden rounded-[100px] bg-[#e2cbff]">
                      <img
                        src={serviceTitanIcon}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    </div>
                    <p className="text-[16px] font-medium leading-none text-[#171717]">
                      ServiceTitan
                    </p>
                  </div>
                  <p className="text-[14px] leading-[1.5] text-[#6b6b6b]">
                    Connect your ServiceTitan account to sync jobs, technicians,
                    estimates and revenue data.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-[8px] border border-[#d5d5d5] bg-white px-3 py-2 text-[14px] font-medium leading-[14px] text-[#171717]"
                >
                  Connect ServiceTitan
                </button>
              </div>

              <div className="w-full overflow-hidden rounded-[8px] border border-[#d5d5d5] bg-[#fafafa]">
                <div className="flex flex-col items-start gap-[18px] p-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex h-[26px] items-center gap-2">
                      <div className="relative size-6 overflow-hidden rounded-[100px] bg-[#e2cbff]">
                        <img
                          src={uploadCsvIcon}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                        />
                      </div>
                      <p className="text-[16px] font-medium leading-none text-[#171717]">
                        Upload CSV file
                      </p>
                      {localSummary && (
                        <span className="ml-auto inline-flex items-center gap-1 text-[14px] leading-[14px] text-[#19372a]">
                          <span className="size-1.5 rounded-full bg-[#29a65a]" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] leading-[1.6] text-[#6b6b6b]">
                      Upload your data via csv files. You can upload multiple
                      files.
                    </p>
                    {uploadedFileName && (
                      <p className="text-[13px] leading-[1.4] text-[#4e4e4e]">
                        Uploaded: {uploadedFileName}
                      </p>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={onUploadChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex h-9 items-center justify-center rounded-[8px] border border-[#d5d5d5] bg-white px-3 py-2 text-[14px] font-medium leading-[14px] text-[#171717] disabled:opacity-60"
                  >
                    {isUploading ? "Uploading..." : "Upload CSV file"}
                  </button>
                </div>
              </div>
            </div>

            {(uploadError || error) && (
              <div className="w-full rounded-[8px] border border-[#f8c6c6] bg-[#fff4f4] px-3 py-2">
                <p className="text-[14px] leading-5 text-[#c73737]">
                  {uploadError ?? error}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate || isGenerating}
              className="inline-flex items-center justify-center rounded-[10px] bg-[#294be7] p-3 text-[16px] font-medium leading-5 text-white disabled:opacity-50"
            >
              {isGenerating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
