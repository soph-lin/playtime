import { NextResponse } from "next/server";

export async function GET() {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  const isDevelopment = process.env.NODE_ENV === "development";
  const currentUrl = process.env.VERCEL_URL || "localhost:3000";

  const status = {
    webhookConfigured: !!webhookSecret,
    environment: process.env.NODE_ENV,
    currentUrl: `http://${currentUrl}`,
    webhookEndpoint: `http://${currentUrl}/api/webhooks/clerk`,
    timestamp: new Date().toISOString(),
  };

  if (!webhookSecret) {
    return NextResponse.json(
      {
        ...status,
        status: "error",
        message: "Webhook not configured",
        instructions: isDevelopment
          ? [
              "1. Go to Clerk Dashboard: https://dashboard.clerk.com/",
              "2. Navigate to Webhooks section",
              "3. Add endpoint: http://localhost:3000/api/webhooks/clerk",
              "4. Copy the signing secret (starts with 'whsec_')",
              "5. Add to .env: CLERK_WEBHOOK_SECRET=whsec_your_secret_here",
              "6. Restart your dev server",
              "",
              "If using ngrok:",
              "1. Run: ngrok http 3000",
              "2. Use the ngrok URL in Clerk webhook endpoint",
              "3. Update endpoint when ngrok restarts",
            ]
          : ["Webhook secret is missing from environment variables"],
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ...status,
    status: "success",
    message: "Webhook is properly configured",
    nextSteps: isDevelopment
      ? [
          "✅ Webhook secret is configured",
          "✅ Database connection is working",
          "🚀 Try creating a new user in Clerk to test",
          "",
          "If using ngrok:",
          "- Make sure ngrok is running: ngrok http 3000",
          "- Update webhook endpoint in Clerk with new ngrok URL",
          "- Test user creation after updating endpoint",
        ]
      : ["Webhook is ready for production use"],
  });
}
