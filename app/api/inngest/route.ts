import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sendWeeklyNewsSummary, sendSignUpEmail, checkStockAlerts, checkInactiveUsers, sendDailyLineDigest } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [sendSignUpEmail, sendWeeklyNewsSummary, checkStockAlerts, checkInactiveUsers, sendDailyLineDigest],
})