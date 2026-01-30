"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import type { RecordItem, RecordStatus } from "../types";
import { useRecords } from "../context/RecordsContext";

interface RecordDetailDialogProps {
  record: RecordItem;
  onClose: () => void;
}

/**
 * RecordDetailDialog allows reviewers to inspect a specimen’s details and
 * update its status and accompanying note in a focused modal flow. Review
 * actions are performed via the Status dropdown, while the note captures
 * rationale or extra context for the change.
 */
export default function RecordDetailDialog({
  record,
  onClose,
}: RecordDetailDialogProps) {
  const { updateRecord } = useRecords();
  const [status, setStatus] = useState<RecordStatus>(record.status);
  const [note, setNote] = useState<string>(record.note ?? "");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const statusOptions: RecordStatus[] = [
    "pending",
    "approved",
    "flagged",
    "needs_revision",
  ];

  const trimmedNote = note.trim();
  const requiresNote = status === "flagged" || status === "needs_revision";
  const isValid = !requiresNote || (requiresNote && trimmedNote.length > 0);

  const handleSave = async () => {
    // Clear Previous validation errors
    setValidationError(null);

    // Validate note requirement
    if (requiresNote && trimmedNote.length === 0) {
      setValidationError("Note is required for flagged or needs revision statuses.");
      return;
    }

    // check if anything changed
    const statusChanged = status !== record.status;
    const noteChanged = trimmedNote !== (record.note ?? "").trim();
    const isDirty = statusChanged || noteChanged;

    if (!isDirty) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await updateRecord(record.id, {
        status: statusChanged ? status : undefined,
        note: noteChanged ? trimmedNote : undefined,
      });

      toast.success("Record updated successfully");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update record";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (value: RecordStatus) => {
    const previousStatus = status;
    setStatus(value);
    
    // Clear note only when status actually changes (not when selecting current status)
    if (value !== previousStatus) {
      setNote("");
    }
    
    // Clear validation error when status changes
    if (validationError) {
      setValidationError(null);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg tracking-tight">
            {record.name}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {record.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={status}
              onValueChange={handleStatusChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Reviewer note
              {requiresNote && (
                <span className="text-destructive ml-1">
                  *
                </span>
              )}
            </label>
            <Textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (validationError) {
                  setValidationError(null);
                }
              }}
              placeholder="Add a note..."
              className={`min-h-24 ${validationError ? "border-destructive" : ""}`}
              disabled={loading}
            />
            {validationError && (
              <p className="mt-1 text-xs text-destructive">{validationError}</p>
            )}
            {!validationError && (
              <p className="mt-1 text-xs text-muted-foreground">
                {requiresNote
                  ? "A note is required for Flagged or Needs Revision status."
                  : "Notes help other reviewers understand decisions."}
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button variant="default" onClick={handleSave} disabled={loading || !isValid}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
