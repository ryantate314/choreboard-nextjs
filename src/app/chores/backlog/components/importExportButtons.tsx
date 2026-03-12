"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import {
  exportChoreDefinitions,
  importChoreDefinitions,
  ChoreExport,
} from "../../../actions/chores";

export default function ImportExportButtons() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleExport = async () => {
    const data = await exportChoreDefinitions();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const a = document.createElement("a");
    a.href = url;
    a.download = `chores-export-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data: ChoreExport[] = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error("Invalid format: expected an array");
      }

      const result = await importChoreDefinitions(data);

      const parts: string[] = [];
      if (result.choresCreated > 0) {
        parts.push(`${result.choresCreated} created`);
      }
      if (result.choresUpdated > 0) {
        parts.push(`${result.choresUpdated} updated`);
      }
      if (result.usersCreated > 0) {
        parts.push(`${result.usersCreated} users created`);
      }

      setMessage(parts.length > 0 ? `Import complete: ${parts.join(", ")}` : "No changes");
    } catch (err) {
      setMessage(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleExport}
        title="Export chore definitions"
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleImportClick}
        disabled={importing}
        title="Import chore definitions"
      >
        <Upload className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      {message && (
        <span className="text-xs text-surface-400 ml-2">{message}</span>
      )}
    </div>
  );
}
