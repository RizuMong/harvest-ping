import { FinishHarvestRequest } from "@/store/harvest.store";

export function getPendingApprovals(requests: FinishHarvestRequest[], currentUserId: string) {
  return requests.filter((req) => {
    if (req.status !== "submitted") return false;

    const currentIndex = req.approvalLines.findIndex(
      (line) => {
        const lineUserId = line.userId || line.approverId;
        return lineUserId && String(lineUserId) === String(currentUserId);
      }
    );
    if (currentIndex === -1) return false;
    if (req.approvalLines[currentIndex].status !== "Waiting") return false;

    return req.approvalLines
      .slice(0, currentIndex)
      .every((line) => line.status === "Approved");
  });
}

export function getApprovalProgress(req: FinishHarvestRequest) {
  const approvedCount = req.approvalLines.filter((l) => l.status === "Approved").length;
  return `${approvedCount}/${req.approvalLines.length} Approved`;
}
