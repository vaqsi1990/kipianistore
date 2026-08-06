const PAID_STATUS_KEYS = new Set([
  "completed",
  "blocked",
  "partial_completed",
]);

export function extractBogRedirectUrl(data: Record<string, unknown>): string | null {
  const id = (data.id || data.order_id) as string | undefined;
  const links = data._links || data.links;

  if (links && typeof links === "object" && !Array.isArray(links)) {
    const linkObj = links as Record<string, { href?: string }>;
    if (linkObj.redirect?.href) return linkObj.redirect.href;
    if (linkObj.approve?.href) return linkObj.approve.href;
  }

  if (Array.isArray(links)) {
    const approve = links.find(
      (link: { rel?: string; href?: string }) =>
        link.rel === "redirect" || link.rel === "approve"
    );
    if (approve?.href) return approve.href;
  }

  if (id) {
    return `https://payment.bog.ge/?order_id=${id}`;
  }

  return null;
}

export function extractBogOrderId(data: Record<string, unknown>): string | null {
  const id = data.id || data.order_id;
  return id ? String(id) : null;
}

export function isBogPaymentSuccessful(statusKey?: string): boolean {
  if (!statusKey) return false;
  return PAID_STATUS_KEYS.has(statusKey.toLowerCase());
}

export function mapBogStatusToPaymentStatus(
  statusKey?: string
):
  | "CREATED"
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIAL_COMPLETED"
  | "BLOCKED"
  | "REJECTED"
  | "REFUNDED"
  | "REFUNDED_PARTIALLY"
  | "AUTH_REQUESTED"
  | "UNKNOWN" {
  switch (statusKey?.toLowerCase()) {
    case "created":
      return "CREATED";
    case "processing":
      return "PROCESSING";
    case "completed":
      return "COMPLETED";
    case "partial_completed":
      return "PARTIAL_COMPLETED";
    case "blocked":
      return "BLOCKED";
    case "rejected":
      return "REJECTED";
    case "refunded":
      return "REFUNDED";
    case "refunded_partially":
      return "REFUNDED_PARTIALLY";
    case "auth_requested":
      return "AUTH_REQUESTED";
    default:
      return "UNKNOWN";
  }
}
