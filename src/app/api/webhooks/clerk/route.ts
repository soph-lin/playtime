import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { createOrUpdateUser } from "@/lib/clerk";

// Define the WebhookEvent type based on Clerk's webhook structure
interface WebhookEvent {
  data: {
    id: string;
    username?: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    [key: string]: unknown;
  };
  type: string;
}

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");

    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers:", { svix_id, svix_timestamp, svix_signature });

    if (isDevelopment) {
      console.error(`
      ⚠️  WEBHOOK CONNECTION ISSUE ⚠️
      The webhook request is missing required headers. This usually means:

      1. The webhook endpoint URL in Clerk is incorrect
      2. If using ngrok, the tunnel may have terminated
      3. The webhook secret may be invalid

      To fix:
      1. Check if ngrok is running: ngrok http 3000
      2. Get new ngrok URL and update Clerk webhook endpoint
      3. Verify the webhook secret in your .env file
      4. Test by creating a new user in Clerk
      `);
    }

    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await request.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);

    if (isDevelopment) {
      console.error(`
🔐 WEBHOOK VERIFICATION FAILED 🔐
The webhook signature verification failed. This usually means:

1. The CLERK_WEBHOOK_SECRET in your .env is incorrect
2. The webhook endpoint URL in Clerk doesn't match your current setup
3. If using ngrok, you need to update the endpoint URL in Clerk

To fix:
1. Copy the correct signing secret from Clerk Dashboard
2. Update your .env file with the new secret
3. If using ngrok, update the webhook endpoint URL in Clerk
4. Restart your dev server
      `);
    }

    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with ID of ${id} and type of ${eventType}`);
  console.log("Webhook body:", JSON.stringify(body, null, 2));
  console.log("Parsed event data:", JSON.stringify(evt.data, null, 2));

  // Handle various Clerk events
  if (eventType === "user.created" || eventType === "user.updated") {
    try {
      // Extract email from the correct location in the webhook payload
      let email = "";

      // Try to get email from email_addresses array
      if (evt.data.email_addresses && evt.data.email_addresses.length > 0) {
        email = evt.data.email_addresses[0].email_address;
      }

      // If no email found, try to get it from the body directly
      if (!email && body.data && body.data.email_addresses && body.data.email_addresses.length > 0) {
        email = body.data.email_addresses[0].email_address;
      }

      // If still no email, try to get it from the primary email field
      if (!email && body.data && body.data.primary_email_address_id) {
        // Look for the email in the email_addresses array by ID
        if (body.data.email_addresses) {
          const primaryEmail = body.data.email_addresses.find(
            (email: { id: string; email_address: string }) => email.id === body.data.primary_email_address_id
          );
          if (primaryEmail) {
            email = primaryEmail.email_address;
          }
        }
      }

      console.log("Extracted email:", email);

      if (!email) {
        console.error("No email found in webhook payload for user:", id);
        return NextResponse.json({ error: "No email found in webhook payload" }, { status: 400 });
      }

      // Transform webhook data to match ClerkUser interface
      const clerkUser = {
        id: evt.data.id,
        username: evt.data.username,
        emailAddresses: [{ emailAddress: email }],
        firstName: evt.data.first_name,
        lastName: evt.data.last_name,
        imageUrl: evt.data.image_url,
      };

      console.log("Creating/updating user with data:", clerkUser);
      const user = await createOrUpdateUser(clerkUser);
      console.log("User synced successfully:", user.id);
    } catch (error) {
      console.error("Error syncing user:", error);
      return NextResponse.json({ error: "Error syncing user" }, { status: 500 });
    }
  }

  // Handle email verification events
  if (eventType === "email.created" || eventType === "email.updated") {
    try {
      // Get the user ID from the email event
      const userId = evt.data.id;
      if (userId) {
        // Re-sync user data to ensure email is updated
        const clerkUser = {
          id: userId,
          username: evt.data.username,
          emailAddresses:
            evt.data.email_addresses?.map((email: { email_address: string }) => ({
              emailAddress: email.email_address,
            })) || [],
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          imageUrl: evt.data.image_url,
        };

        const user = await createOrUpdateUser(clerkUser);
        console.log("User email updated:", user.id);
      }
    } catch (error) {
      console.error("Error updating user email:", error);
      // Don't fail the webhook for email update errors
    }
  }

  return NextResponse.json({ success: true });
}
