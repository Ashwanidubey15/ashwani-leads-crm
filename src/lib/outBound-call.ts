import cron from "node-cron";
import { startNextCall, startScheduleCall } from "./startNextCall";

declare global {
  var __outboundCronStarted: boolean | undefined;
}

if (!global.__outboundCronStarted) {
  cron.schedule("*/10 * * * * *", async () => {
    console.log("🚀 Running outbound sequencer every 10s...");
    try {
      await startNextCall();
       await startScheduleCall();
    } catch (err) {
      console.error("Error in outbound sequencer:", err);
    }
  });

  global.__outboundCronStarted = true;
}
