import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();

interface NotifyPayload {
  contacts: { name: string; pushToken: string }[];
  senderName: string;
  lat?: number;
  lng?: number;
}

function isExpoPushToken(token: string) {
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

router.post("/notify", async (req: Request, res: Response) => {
  try {
    const { contacts, senderName, lat, lng } = req.body as NotifyPayload;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: "No contacts provided" });
    }

    const locationLine =
      typeof lat === "number" && typeof lng === "number"
        ? `Location: https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`
        : "Location unavailable from device.";

    const validContacts = contacts.filter((contact) => isExpoPushToken(contact.pushToken));

    if (validContacts.length === 0) {
      return res.status(400).json({ error: "No valid Aura push tokens were provided." });
    }

    logger.info(`Processing SOS alert for ${contacts.length} contacts...`);

    const results: Array<{
      name: string;
      status: "success" | "failed";
      sid?: string;
      error?: string;
    }> = [];

    await Promise.all(
      validContacts.map(async (contact) => {
        try {
          const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: contact.pushToken,
              title: `SOS ALERT from ${senderName}`,
              body: `I need immediate help. ${locationLine}`,
              sound: "default",
              priority: "high",
              data: {
                type: "sos",
                senderName,
                lat,
                lng,
              },
            }),
          });

          const expoData = (await expoResponse.json()) as {
            data?: { status?: string; id?: string; message?: string };
            errors?: Array<{ message?: string }>;
          };

          if (!expoResponse.ok || expoData.data?.status === "error") {
            throw new Error(expoData.data?.message ?? expoData.errors?.[0]?.message ?? "Expo push failed");
          }

          logger.info(`Push sent to ${contact.name} (${contact.pushToken})`);
          results.push({ name: contact.name, status: "success", sid: expoData.data?.id });
        } catch (error: any) {
          logger.error(`Failed to send push to ${contact.name}: ${error.message}`);
          results.push({ name: contact.name, status: "failed", error: error.message });
        }
      })
    );

    const successCount = results.filter((result) => result.status === "success").length;

    return res.status(200).json({
      success: successCount > 0,
      message:
        successCount === validContacts.length
          ? "Free Aura SOS push alerts sent successfully."
          : successCount > 0
          ? `Free Aura SOS push alerts sent to ${successCount} of ${validContacts.length} contacts.`
          : "Failed to send push alerts.",
      results,
    });
  } catch (error: any) {
    logger.error(`SOS Notification failed: ${error.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
