// Confirms the Naive policy modules this repo already calls still export the functions the outside host needs.
// It does not build a venture and it does not call those functions, because their record layout lives in the pin.

const missing = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`BLOCKED naive-framework is not installed, or a policy export moved: ${message}`);
  process.exit(2);
};

try {
  const policy = await import("./outside-policy.ts");
  const decisions = await import("naive-framework/src/engine/decisions.mjs");
  const access = await import("naive-framework/src/engine/access.mjs");
  if (typeof policy.naiveVenturePolicy !== "function") throw new Error("naiveVenturePolicy is missing");
  if (typeof decisions.refusedPerson !== "function" || typeof decisions.signers !== "function") throw new Error("decisions.mjs exports changed");
  if (typeof access.roleOf !== "function") throw new Error("access.mjs exports changed");
  console.log("ok  naive policy exports match the bridge and the function agent");
} catch (error) {
  missing(error);
}
