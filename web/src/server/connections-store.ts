// A person's connections (`@reflect/core/connectors`). Where you live is connected once a county is set; Instacart is
// ready when the deployment holds INSTACART_API_KEY (read by name only). Every other connector is not built yet, so it
// is never connected.
import { CONNECTORS, connectionsPart, type Connection } from "@reflect/core/connectors";
import { instacartReady } from "./meals-store";
import { placeRecord } from "./public-data";

export async function connections(userId: string): Promise<Connection[]> {
  const place = await placeRecord(userId);
  return CONNECTORS.map((c): Connection => {
    if (c.id === "place") return place?.county ? { id: c.id, state: "connected", detail: `${place.county} County, ${place.state}` } : { id: c.id, state: "not-connected" };
    if (c.id === "instacart") return instacartReady() ? { id: c.id, state: "connected", detail: "Send a week's list from Meals" } : { id: c.id, state: "unavailable" };
    return { id: c.id, state: c.availability === "built" ? "not-connected" : "unavailable" };
  });
}

export async function connectionsPartOf(userId: string, path: string): Promise<unknown> {
  return connectionsPart(await connections(userId), path);
}
