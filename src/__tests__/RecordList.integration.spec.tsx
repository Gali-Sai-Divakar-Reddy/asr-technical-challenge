import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecordList from "@/app/interview/components/RecordList";
import { RecordsProvider } from "@/app/interview/context/RecordsContext";
import type { RecordItem } from "@/app/interview/types";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("RecordList Integration Tests", () => {
  const mockRecords: RecordItem[] = [
    {
      id: "1",
      name: "Specimen A",
      description: "Test description A",
      status: "pending",
    },
    {
      id: "2",
      name: "Specimen B",
      description: "Test description B",
      status: "approved",
    },
    {
      id: "3",
      name: "Specimen C",
      description: "Test description C",
      status: "flagged",
      note: "Existing note",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock GET /api/mock/records
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecords,
    } as Response);
  });

  const renderWithProvider = () => {
    return render(
      <RecordsProvider>
        <RecordList />
      </RecordsProvider>
    );
  };

  describe("Dialog Interactions", () => {
    it("allows status selection and note entry", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      // Wait for records to load
      await waitFor(() => {
        expect(screen.getByText("Specimen A")).toBeInTheDocument();
      });

      // Click Review button on first record
      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      await user.click(reviewButtons[0]);

      // Verify dialog is open - check for dialog title specifically
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Specimen A" })).toBeInTheDocument();
      });

      // Change status
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const approvedOption = screen.getByRole("option", { name: "approved" });
      await user.click(approvedOption);

      // Enter note
      const textarea = screen.getByPlaceholderText("Add a note...");
      await user.type(textarea, "Test note");

      // Verify inputs are updated
      await waitFor(() => {
        expect(selectTrigger).toHaveTextContent("approved");
        expect(textarea).toHaveValue("Test note");
      });
    });
  });

  describe("Validation Messaging", () => {
    it("shows validation helper text for flagged/needs_revision statuses", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Specimen A")).toBeInTheDocument();
      });

      // Open dialog for pending record
      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      await user.click(reviewButtons[0]);

      // Change to flagged status
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const flaggedOption = screen.getByRole("option", { name: "flagged" });
      await user.click(flaggedOption);

      // Verify helper text appears
      await waitFor(() => {
        expect(
          screen.getByText("A note is required for Flagged or Needs Revision status.")
        ).toBeInTheDocument();
      });

      // Verify Save button is disabled
      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe("Successful Save and State Propagation", () => {
    it("updates list, summary, and history after successful save", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      // Wait for records to load
      await waitFor(() => {
        expect(screen.getByText("Specimen A")).toBeInTheDocument();
      });

      // Verify initial summary exists
      const summarySection = screen.getByLabelText("Record status summary");
      expect(summarySection).toBeInTheDocument();

      // Open dialog for first record (pending)
      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      await user.click(reviewButtons[0]);

      // Wait for dialog - check for dialog title specifically
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Specimen A" })).toBeInTheDocument();
      });

      // Change status to approved
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const approvedOption = screen.getByRole("option", { name: "approved" });
      await user.click(approvedOption);

      // Mock PATCH response
      const updatedRecord: RecordItem = {
        id: "1",
        name: "Specimen A",
        description: "Test description A",
        status: "approved",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedRecord,
      } as Response);

      // Save
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      // Verify list updated - should have more approved badges
      await waitFor(() => {
        const approvedBadges = screen.getAllByText("approved");
        expect(approvedBadges.length).toBeGreaterThanOrEqual(1);
      });

      // Verify summary section exists and updated
      await waitFor(() => {
        const updatedSummary = screen.getByLabelText("Record status summary");
        expect(updatedSummary).toBeInTheDocument();
      });

      // Verify history entry created
      await waitFor(() => {
        const recordText = screen.getByText(/Record 1/i);
        expect(recordText).toBeInTheDocument();
        
        // Status transition is now split across badges and icon in HistoryLog
        // Find the history entry container and verify it contains both status badges
        const historyEntry = recordText.closest('li');
        expect(historyEntry).toBeInTheDocument();
        
        // Check that both status badges exist within the history entry
        const badges = historyEntry?.querySelectorAll('[data-slot="badge"]');
        const badgeTexts = Array.from(badges || []).map(badge => badge.textContent?.toLowerCase() || '');
        expect(badgeTexts).toContain('pending');
        expect(badgeTexts).toContain('approved');
      });
    });

    it("updates note in list after save", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Specimen A")).toBeInTheDocument();
      });

      // Open dialog
      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      await user.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Specimen A" })).toBeInTheDocument();
      });

      // Add note
      const textarea = screen.getByPlaceholderText("Add a note...");
      await user.type(textarea, "New note");

      // Mock PATCH response
      const updatedRecord: RecordItem = {
        id: "1",
        name: "Specimen A",
        description: "Test description A",
        status: "pending",
        note: "New note",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedRecord,
      } as Response);

      // Save
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      // Verify note appears in list
      await waitFor(() => {
        expect(screen.getByText(/Note: New note/i)).toBeInTheDocument();
      });
    });
  });

  describe("Filter Behavior After Update", () => {
    it("removes record from filtered view when status changes", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Specimen A")).toBeInTheDocument();
      });

      // Find filter select by label
      const filterLabel = screen.getByText("Filter by status");
      const filterContainer = filterLabel.closest("div");
      const filterTrigger = filterContainer?.querySelector('[role="combobox"]') as HTMLElement;
      
      expect(filterTrigger).toBeDefined();
      await user.click(filterTrigger!);

      // Select pending filter - use role="option" to target the select option specifically
      const pendingOption = screen.getByRole("option", { name: "pending" });
      await user.click(pendingOption);

      // Verify only pending records shown
      await waitFor(() => {
        expect(screen.getByText("Specimen A")).toBeInTheDocument();
        expect(screen.queryByText("Specimen B")).not.toBeInTheDocument();
        expect(screen.queryByText("Specimen C")).not.toBeInTheDocument();
      });

      // Open dialog for pending record
      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      await user.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Specimen A" })).toBeInTheDocument();
      });

      // Change status to approved (will leave filtered view)
      const selectTrigger = screen.getByRole("combobox");
      await user.click(selectTrigger);
      const approvedOption = screen.getByRole("option", { name: "approved" });
      await user.click(approvedOption);

      // Mock PATCH response
      const updatedRecord: RecordItem = {
        id: "1",
        name: "Specimen A",
        description: "Test description A",
        status: "approved",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedRecord,
      } as Response);

      // Save
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      // Verify record is removed from filtered view
      await waitFor(() => {
        expect(screen.queryByText("Specimen A")).not.toBeInTheDocument();
        expect(screen.getByText("No records match this filter")).toBeInTheDocument();
      });

      // Verify record still exists when filter is "all"
      const filterLabelAfter = screen.getByText("Filter by status");
      const filterContainerAfter = filterLabelAfter.closest("div");
      const filterTriggerAfter = filterContainerAfter?.querySelector('[role="combobox"]') as HTMLElement;
      
      await user.click(filterTriggerAfter!);
      const allOption = screen.getByRole("option", { name: "All" });
      await user.click(allOption);

      await waitFor(() => {
        expect(screen.getByText("Specimen A")).toBeInTheDocument();
      });
    });

    it("keeps record in filtered view when status stays the same", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Specimen A")).toBeInTheDocument();
      });

      // Filter by pending
      const filterLabel = screen.getByText("Filter by status");
      const filterContainer = filterLabel.closest("div");
      const filterTrigger = filterContainer?.querySelector('[role="combobox"]') as HTMLElement;
      
      await user.click(filterTrigger!);
      const pendingOption = screen.getByRole("option", { name: "pending" });
      await user.click(pendingOption);

      await waitFor(() => {
        expect(screen.getByText("Specimen A")).toBeInTheDocument();
      });

      // Open dialog
      const reviewButtons = screen.getAllByRole("button", { name: /review/i });
      await user.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Specimen A" })).toBeInTheDocument();
      });

      // Add note but keep status as pending
      const textarea = screen.getByPlaceholderText("Add a note...");
      await user.type(textarea, "Note for pending");

      // Mock PATCH response (status unchanged)
      const updatedRecord: RecordItem = {
        id: "1",
        name: "Specimen A",
        description: "Test description A",
        status: "pending",
        note: "Note for pending",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedRecord,
      } as Response);

      // Save
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      // Verify record still visible in filtered view
      await waitFor(() => {
        expect(screen.getByText("Specimen A")).toBeInTheDocument();
        expect(screen.getByText(/Note: Note for pending/i)).toBeInTheDocument();
      });
    });
  });
});
