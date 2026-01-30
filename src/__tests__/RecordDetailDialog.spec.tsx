import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecordDetailDialog from "@/app/interview/components/RecordDetailDialog";
import type { RecordItem } from "@/app/interview/types";
import { useRecords } from "@/app/interview/context/RecordsContext";
import { toast } from "sonner";

// Mock dependencies
vi.mock("@/app/interview/context/RecordsContext");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUpdateRecord = vi.fn();
const mockUseRecords = useRecords as ReturnType<typeof vi.fn>;

describe("RecordDetailDialog", () => {
  const sampleRecord: RecordItem = {
    id: "1",
    name: "Specimen A",
    description: "Collected near river bank",
    status: "pending",
  };

  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRecords.mockReturnValue({
      updateRecord: mockUpdateRecord,
    });
  });

  describe("Rendering", () => {
    it("renders record name and description", () => {
      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);
      expect(screen.getByText("Specimen A")).toBeInTheDocument();
      expect(screen.getByText("Collected near river bank")).toBeInTheDocument();
    });

    it("renders current status in select", () => {
      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);
      expect(screen.getByText("pending")).toBeInTheDocument();
    });

    it("renders note textarea", () => {
      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);
      expect(screen.getByPlaceholderText("Add a note...")).toBeInTheDocument();
    });
  });

  describe("Status Selection", () => {
    it("allows changing status via dropdown", async () => {
      const user = userEvent.setup();
      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      // Find and click the select trigger
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);

      // Select "approved" status
      const approvedOption = screen.getByText("approved");
      await user.click(approvedOption);

      // Wait for dropdown to close and verify the select value changed
      await waitFor(() => {
        expect(selectTrigger).toHaveTextContent("approved");
      });
    });
  });

  describe("Note Entry", () => {
    it("allows entering a note", async () => {
      const user = userEvent.setup();
      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      const textarea = screen.getByPlaceholderText("Add a note...");
      await user.type(textarea, "This is a test note");

      expect(textarea).toHaveValue("This is a test note");
    });

    it("clears note when status changes", async () => {
      const user = userEvent.setup();
      const recordWithNote: RecordItem = {
        ...sampleRecord,
        note: "Existing note",
      };
      render(<RecordDetailDialog record={recordWithNote} onClose={onClose} />);

      // Verify note is initially shown
      const textarea = screen.getByPlaceholderText("Add a note...");
      expect(textarea).toHaveValue("Existing note");

      // Change status to a different one
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const approvedOption = screen.getByText("approved");
      await user.click(approvedOption);

      // Wait for status to update
      await waitFor(() => {
        expect(selectTrigger).toHaveTextContent("approved");
      });

      // Verify note is cleared when status changes
      expect(textarea).toHaveValue("");
    });

    it("does not clear note when selecting the same status", async () => {
      const user = userEvent.setup();
      const recordWithNote: RecordItem = {
        ...sampleRecord,
        status: "pending",
        note: "Existing note",
      };
      render(<RecordDetailDialog record={recordWithNote} onClose={onClose} />);

      // Verify note is initially shown
      const textarea = screen.getByPlaceholderText("Add a note...");
      expect(textarea).toHaveValue("Existing note");

      // Select the same status (pending) - use getAllByRole to find the option
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      
      // Find the pending option in the dropdown (not the trigger)
      const options = screen.getAllByRole("option");
      const pendingOption = options.find(opt => opt.textContent === "pending");
      expect(pendingOption).toBeDefined();
      await user.click(pendingOption!);

      // Wait for dropdown to close
      await waitFor(() => {
        expect(selectTrigger).toHaveTextContent("pending");
      });

      // Verify note is NOT cleared when selecting the same status
      expect(textarea).toHaveValue("Existing note");
    });
  });

  describe("Validation", () => {
    it("requires note for flagged status", async () => {
      const user = userEvent.setup();
      const flaggedRecord: RecordItem = {
        ...sampleRecord,
        status: "pending",
      };

      render(<RecordDetailDialog record={flaggedRecord} onClose={onClose} />);

      // Change status to flagged
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const flaggedOption = screen.getByText("flagged");
      await user.click(flaggedOption);

      // Wait for status to update
      await waitFor(() => {
        expect(selectTrigger).toHaveTextContent("flagged");
      });

      // Verify Save button is disabled when note is required but not provided
      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).toBeDisabled();
      
      // Verify helper text is shown
      expect(
        screen.getByText("A note is required for Flagged or Needs Revision status.")
      ).toBeInTheDocument();
      
      // Verify updateRecord is not called (button is disabled, so can't be clicked)
      expect(mockUpdateRecord).not.toHaveBeenCalled();
    });

    it("requires note for needs_revision status", async () => {
      const user = userEvent.setup();
      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      // Change status to needs_revision
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const needsRevisionOption = screen.getByText("needs revision");
      await user.click(needsRevisionOption);

      // Wait for status to update
      await waitFor(() => {
        expect(selectTrigger).toHaveTextContent("needs revision");
      });

      // Verify Save button is disabled when note is required but not provided
      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).toBeDisabled();
      
      // Verify helper text is shown
      expect(
        screen.getByText("A note is required for Flagged or Needs Revision status.")
      ).toBeInTheDocument();
      
      // Verify updateRecord is not called (button is disabled, so can't be clicked)
      expect(mockUpdateRecord).not.toHaveBeenCalled();
    });

    it("allows saving approved status without note", async () => {
      const user = userEvent.setup();
      mockUpdateRecord.mockResolvedValue({
        ...sampleRecord,
        status: "approved",
      });

      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      // Change status to approved
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const approvedOption = screen.getByText("approved");
      await user.click(approvedOption);

      // Save without note
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRecord).toHaveBeenCalledWith("1", {
          status: "approved",
        });
      });
    });

    it("shows required indicator for flagged/needs_revision statuses", async () => {
      const user = userEvent.setup();
      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      // Change to flagged status
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const flaggedOption = screen.getByText("flagged");
      await user.click(flaggedOption);

      // Check for required indicator (*)
      const noteLabel = screen.getByText("Reviewer note");
      expect(noteLabel.parentElement?.textContent).toContain("*");
    });
  });

  describe("Successful Save", () => {
    it("calls updateRecord with status change", async () => {
      const user = userEvent.setup();
      mockUpdateRecord.mockResolvedValue({
        ...sampleRecord,
        status: "approved",
      });

      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      // Change status
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const approvedOption = screen.getByText("approved");
      await user.click(approvedOption);

      // Save
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRecord).toHaveBeenCalledWith("1", {
          status: "approved",
        });
        expect(toast.success).toHaveBeenCalledWith(
          "Record updated successfully"
        );
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("calls updateRecord with note change", async () => {
      const user = userEvent.setup();
      mockUpdateRecord.mockResolvedValue({
        ...sampleRecord,
        note: "Updated note",
      });

      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      // Enter note
      const textarea = screen.getByPlaceholderText("Add a note...");
      await user.type(textarea, "Updated note");

      // Save
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRecord).toHaveBeenCalledWith("1", {
          note: "Updated note",
        });
        expect(toast.success).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("calls updateRecord with both status and note changes", async () => {
      const user = userEvent.setup();
      mockUpdateRecord.mockResolvedValue({
        ...sampleRecord,
        status: "flagged",
        note: "Flagged with note",
      });

      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      // Change status to flagged
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const flaggedOption = screen.getByText("flagged");
      await user.click(flaggedOption);

      // Enter note
      const textarea = screen.getByPlaceholderText("Add a note...");
      await user.type(textarea, "Flagged with note");

      // Save
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRecord).toHaveBeenCalledWith("1", {
          status: "flagged",
          note: "Flagged with note",
        });
        expect(toast.success).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error toast when updateRecord fails", async () => {
      const user = userEvent.setup();
      const error = new Error("API Error");
      mockUpdateRecord.mockRejectedValue(error);

      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      // Change status
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const approvedOption = screen.getByText("approved");
      await user.click(approvedOption);

      // Save
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("API Error");
        expect(onClose).not.toHaveBeenCalled();
      });
    });

    it("handles non-Error exceptions", async () => {
      const user = userEvent.setup();
      mockUpdateRecord.mockRejectedValue("String error");

      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const approvedOption = screen.getByText("approved");
      await user.click(approvedOption);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update record");
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading state during save", async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: RecordItem) => void;
      const updatePromise = new Promise<RecordItem>((resolve) => {
        resolveUpdate = resolve;
      });
      mockUpdateRecord.mockReturnValue(updatePromise);

      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const approvedOption = screen.getByText("approved");
      await user.click(approvedOption);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Check loading state
      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // Resolve the promise
      resolveUpdate!({ ...sampleRecord, status: "approved" });
      await waitFor(() => {
        expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
      });
    });

    it("disables inputs during loading", async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: RecordItem) => void;
      const updatePromise = new Promise<RecordItem>((resolve) => {
        resolveUpdate = resolve;
      });
      mockUpdateRecord.mockReturnValue(updatePromise);

      render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const approvedOption = screen.getByText("approved");
      await user.click(approvedOption);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Check that inputs are disabled
      expect(selectTrigger).toBeDisabled();
      const textarea = screen.getByPlaceholderText("Add a note...");
      expect(textarea).toBeDisabled();

      resolveUpdate!({ ...sampleRecord, status: "approved" });
    });
  });

  describe("Close Behavior", () => {
    it("closes dialog when Close button is clicked", async () => {
        const user = userEvent.setup();
        render(<RecordDetailDialog record={sampleRecord} onClose={onClose} />);

        // Use getAllByRole and select the footer button (the one without an SVG icon)
        const closeButtons = screen.getAllByRole("button", { name: /close/i });
        const footerButton = closeButtons.find(
            (btn) => btn.getAttribute("data-variant") === "secondary"
        );
        
        expect(footerButton).toBeDefined();
        await user.click(footerButton!);

        expect(onClose).toHaveBeenCalled();
    });
  });
});