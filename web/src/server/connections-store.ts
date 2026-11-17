// A person's connections (`@reflect/core/connectors`). Where you live is connected once a county is set; Instacart is
// ready when the deployment holds INSTACART_API_KEY (read by name only). Every other connector is not built yet, so it
// is never connected. Calendar subscriptions are connected once the person subscribes to one; Google Calendar needs
// GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the deployment (by name only) and is connected once the person signs in.
import { CONNECTORS, connectionsPart, type Connection } from "@reflect/core/connectors";
import { feeds } from "./calendar-feeds";
import { googleReady, googleState } from "./google-calendar";
import { instacartReady } from "./meals-store";
import { placeRecord } from "./public-data";

export async function connections(userId: string): Promise<Connection[]> {
  // Before migration 0043 is applied the calendar tables are missing; the connectors then read as not connected.
  const [place, subscribed, google] = await Promise.all([placeRecord(userId), feeds(userId).catch(() => []), googleState(userId)]);
  return CONNECTORS.map((c): Connection => {
    if (c.id === "calendars") return subscribed.length ? { id: c.id, state: "connected", detail: subscribed.length === 1 ? subscribed[0]!.name : `${subscribed.length} calendars` } : { id: c.id, state: "not-connected" };
    if (c.id === "google-calendar") return !googleReady() ? { id: c.id, state: "unavailable" } : google ? { id: c.id, state: "connected", detail: "Primary calendar" } : { id: c.id, state: "not-connected" };
    if (c.id === "place") return place?.county ? { id: c.id, state: "connected", detail: `${place.county} County, ${place.state}` } : { id: c.id, state: "not-connected" };
    if (c.id === "instacart") return instacartReady() ? { id: c.id, state: "connected", detail: "Send a week's list from Meals" } : { id: c.id, state: "unavailable" };
    return { id: c.id, state: c.availability === "built" ? "not-connected" : "unavailable" };
  });
}

export async function connectionsPartOf(userId: string, path: string): Promise<unknown> {
  return connectionsPart(await connections(userId), path);
}
