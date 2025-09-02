import cron from "node-cron";
import { startNextCall, startScheduleCall } from "./startNextCall";

declare global {
  var __outboundCronStarted: boolean | undefined;
}

if (!global.__outboundCronStarted) {
  cron.schedule(
    "*/10 * 9-16 * * *", 
    // └── every 10 seconds, hours 9 → 16 (which is 9:00:00 up to 16:59:59)
    async () => {
      console.log("🚀 Running outbound sequencer (Sydney 9am–5pm window)");
      try {
        await startNextCall();
        // await startScheduleCall();
      } catch (err) {
        console.error("Error in outbound sequencer:", err);
      }
    },
    {
      timezone: "Australia/Sydney", 
      // timezone: "Asia/Kolkata", // India timezone
    }
  );

  global.__outboundCronStarted = true;
}
