const SMS_ENABLED = process.env.IPROGSMS_SMS === "true";
const API_KEY = process.env.IPROGSMS_API_KEY;
const BASE_URL = "https://www.iprogsms.com/api/v1";

/**
 * Send a single SMS via iPROGSMS.
 * Fire-and-forget: logs errors, never throws. Guards on feature flag and missing API key.
 */
export async function sendSMS(phone: string, message: string): Promise<void> {
  if (!SMS_ENABLED || !API_KEY || !phone) return;

  try {
    const res = await fetch(`${BASE_URL}/sms_messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_token: API_KEY, phone_number: phone, message }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[SMS] Failed to send to ${phone}: HTTP ${res.status} ${text}`);
    }
  } catch (err) {
    console.error("[SMS] Network error:", err instanceof Error ? err.message : err);
  }
}

const DELIVERY_STATUS_LABELS: Record<string, string | null> = {
  draft: null,
  created: null,
  picked: null,
  in_transit: "is now in transit",
  out_for_delivery: "is out for delivery today",
  delivered: "has been delivered",
  failed: null,
  returned: null,
};

const DELIVERY_FAILED_MSG = (tracking: string) =>
  `We were unable to complete delivery ${tracking}. Please contact us for assistance. - C'FLAME`;

const DELIVERY_RETURNED_MSG = (tracking: string) =>
  `Your delivery ${tracking} has been returned. Please contact us. - C'FLAME`;

/**
 * SMS to customer when a delivery status changes.
 * Only sends for customer-visible statuses.
 */
export async function sendDeliveryStatusSMS(
  phone: string,
  trackingNumber: string,
  status: string
): Promise<void> {
  let message: string;

  if (status === "failed") {
    message = DELIVERY_FAILED_MSG(trackingNumber);
  } else if (status === "returned") {
    message = DELIVERY_RETURNED_MSG(trackingNumber);
  } else {
    const label = DELIVERY_STATUS_LABELS[status];
    if (!label) return;
    message = `Your delivery ${trackingNumber} ${label}. Thank you! - C'FLAME`;
  }

  await sendSMS(phone, message);
}

/**
 * SMS to customer when their order is first created (pending).
 */
export async function sendOrderConfirmationSMS(
  phone: string,
  customerName: string,
  orderNumber: string
): Promise<void> {
  const message = `Hi ${customerName}! Your order ${orderNumber} has been received. We'll update you on its progress. - C'FLAME`;
  await sendSMS(phone, message);
}

const ORDER_STATUS_MESSAGES: Record<string, string> = {
  confirmed: "is confirmed and being processed",
  processing: "is now being processed",
  ready: "is ready for pickup/delivery",
  delivered: "has been delivered. Thank you",
  cancelled: "has been cancelled. Contact us for questions",
};

/**
 * SMS to customer when an order status changes.
 */
export async function sendOrderStatusSMS(
  phone: string,
  customerName: string,
  orderNumber: string,
  status: string
): Promise<void> {
  const label = ORDER_STATUS_MESSAGES[status];
  if (!label) return;
  const message = `Hi ${customerName}! Your order ${orderNumber} ${label}. - C'FLAME`;
  await sendSMS(phone, message);
}

/**
 * SMS to customer when an installation service is booked.
 */
export async function sendInstallationBookedSMS(
  phone: string,
  customerName: string,
  serviceDate: Date
): Promise<void> {
  const formatted = serviceDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const message = `Hi ${customerName}! Your installation service is scheduled for ${formatted}. We'll be there! - C'FLAME`;
  await sendSMS(phone, message);
}

const INSTALLATION_STATUS_MESSAGES: Record<string, string> = {
  in_progress: "has started today. Our team is on-site",
  completed: "is complete. Thank you for choosing C'FLAME",
  cancelled: "has been cancelled. Please contact us for more information",
};

/**
 * SMS to customer when an installation service status changes.
 */
export async function sendInstallationStatusSMS(
  phone: string,
  customerName: string,
  serviceDate: Date,
  status: string
): Promise<void> {
  const label = INSTALLATION_STATUS_MESSAGES[status];
  if (!label) return;
  const formatted = serviceDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const message = `Hi ${customerName}! Your installation service scheduled on ${formatted} ${label}. - C'FLAME`;
  await sendSMS(phone, message);
}
