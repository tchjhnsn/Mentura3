// Second process: list this account's ventures from naive_records. It does not read console/.data.
import { signAssertion, type Identity } from "../bridge/assertion.ts";
import { runHostedBridge, closeWorkspacePools } from "./account-workspace.ts";

const [bridge, userId, key] = process.argv.slice(2);
const identity: Identity = { userId, name: "Ada", email: "ada@example.com", organizationId: userId, organizationRole: "owner" };
const assertion = signAssertion(identity, { op: "ventures" }, key);
const result = await runHostedBridge<{ ventures: { id: string }[] }>({ userId, assertion, bridgePath: bridge, key });
await closeWorkspacePools();
process.stdout.write(JSON.stringify(result.ventures.map((row) => row.id)));
