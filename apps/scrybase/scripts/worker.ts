import { getBoss } from "../app/services/jobs.server";

const boss = await getBoss();

await boss.work("project.created", async (job) => {
  for (const item of job) {
    console.log("project.created", item.data);
  }
});

await boss.work("document.process", async (job) => {
  for (const item of job) {
    console.log("document.process", item.data);
  }
});

console.log("[scrybase worker] processing queues: project.created, document.process");

const shutdown = async () => {
  console.log("[scrybase worker] shutting down...");
  await boss.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await new Promise(() => {
  return;
});
