"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="api-key">Anthropic API Key</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Your key is used only for this session and never stored on our servers.{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Get a key
          </a>
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          id="api-key"
          type={showKey ? "text" : "password"}
          placeholder="sk-ant-..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowKey(!showKey)}
          className="shrink-0"
        >
          {showKey ? "Hide" : "Show"}
        </Button>
      </div>
      {value.length > 0 && !value.startsWith("sk-ant-") && (
        <p className="text-xs text-destructive">
          API keys typically start with &quot;sk-ant-&quot;
        </p>
      )}
    </div>
  );
}
