import { ENV } from "../utils/env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 1000;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error("Notification title is required.");
  }
  if (!input.content || input.content.trim().length === 0) {
    throw new Error("Notification content is required.");
  }
  if (input.title.length > TITLE_MAX_LENGTH) {
    throw new Error(`Notification title must be at most ${TITLE_MAX_LENGTH} characters.`);
  }
  if (input.content.length > CONTENT_MAX_LENGTH) {
    throw new Error(`Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`);
  }
  return {
    title: input.title.trim(),
    content: input.content.trim(),
  };
};

/**
 * Dispatches a project-owner notification through the Forge Notification Service.
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  try {
    const validated = validatePayload(payload);

    if (!ENV.forgeApiUrl) {
      console.warn("[Notification] Service URL not configured.");
      return false;
    }
    if (!ENV.forgeApiKey) {
      console.warn("[Notification] Service API key not configured.");
      return false;
    }

    const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
    const fullUrl = new URL(
      "webdevtoken.v1.WebDevService/SendNotification",
      baseUrl
    ).toString();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "connect-protocol-version": "1",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        title: validated.title,
        content: validated.content,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[Notification] Failed to notify owner (${response.status}): ${body}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
