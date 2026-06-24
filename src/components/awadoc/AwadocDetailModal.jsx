import { Modal } from "../ui/Modal";
import { StatusBadge } from "../ui/Badge";
import { formatDateTime, formatNaira } from "../../utils/format";

const FLOW_LABELS = {
  GP_CMO: "GP (CMO flow)",
  SPECIALIST_SLOT: "Specialist (slot)",
  CMO: "Specialist (CMO / own time)",
};

function DetailField({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <div className="mt-0.5 font-medium text-slate-800">{children}</div>
    </div>
  );
}

export function AwadocDetailModal({ item, open, onClose, onRetry, retrying }) {
  if (!item) return null;

  const canRetry =
    item.outboundWebhookId &&
    (item.outboundStatus === "PENDING" || item.outboundStatus === "EXHAUSTED");

  return (
    <Modal open={open} onClose={onClose} title="Awadoc consultation" wide>
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <DetailField label="Request ID">{item.requestId || "—"}</DetailField>
        <DetailField label="Consultation ID">{item.consultationId || "—"}</DetailField>
        <DetailField label="Awadoc ObjectId">{item.outboundConsultationId || "—"}</DetailField>
        <DetailField label="Specialty">{item.specializationLabel || item.specialization || "—"}</DetailField>
        <DetailField label="Flow">{FLOW_LABELS[item.flowType] || item.flowType || "—"}</DetailField>
        <DetailField label="Doctor / assignee">{item.doctorName || "—"}</DetailField>
        <DetailField label="Preferred time">{formatDateTime(item.preferredTime)}</DetailField>
        <DetailField label="Appointment time">{formatDateTime(item.appointmentTime)}</DetailField>
        <DetailField label="Confirmed at">{formatDateTime(item.confirmedAt)}</DetailField>
        <DetailField label="Created at">{formatDateTime(item.createdAt)}</DetailField>
        <DetailField label="Price">{item.priceNgn != null ? formatNaira(item.priceNgn) : "—"}</DetailField>
        <DetailField label="Slot">
          {item.slotId ? (
            <span>
              #{item.slotId} {item.slotBooked ? "(booked)" : "(not booked)"}
            </span>
          ) : (
            "—"
          )}
        </DetailField>
        <DetailField label="Outbound status">
          {item.outboundStatus ? <StatusBadge status={item.outboundStatus} /> : "Not sent"}
        </DetailField>
        <DetailField label="Outbound attempts">
          {item.outboundAttemptCount != null
            ? `${item.outboundAttemptCount} / ${item.outboundMaxAttempts ?? "—"}`
            : "—"}
        </DetailField>
        <DetailField label="Last HTTP status">{item.outboundLastHttpStatus ?? "—"}</DetailField>
        <DetailField label="Next retry">{formatDateTime(item.outboundNextRetryAt)}</DetailField>
        <DetailField label="Succeeded at">{formatDateTime(item.outboundSucceededAt)}</DetailField>
        {item.outboundLastError && (
          <div className="sm:col-span-2">
            <DetailField label="Last error">
              <p className="mt-1 whitespace-pre-wrap break-words text-sm font-normal text-red-700">
                {item.outboundLastError}
              </p>
            </DetailField>
          </div>
        )}
      </div>

      {canRetry && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn-primary"
            disabled={retrying}
            onClick={() => onRetry?.(item)}
          >
            {retrying ? "Retrying..." : "Retry doctor_assigned"}
          </button>
        </div>
      )}
    </Modal>
  );
}
