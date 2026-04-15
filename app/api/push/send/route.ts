import { NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { subscription, title, body, url } = await req.json();
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url })
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Push send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}