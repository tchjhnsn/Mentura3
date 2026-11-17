import { describe, expect, it } from "vitest";
import { estimate, guessKind, linesText, monthSpend, parseLines, parseRead, priceBook, type Receipt } from "./spending";

const r = (o: Partial<Receipt>): Receipt => ({ id: "x", store: "Kroger", day: "2026-11-14", total: 10, kind: "groceries", items: [], confirmed: true, ...o });

describe("spending", () => {
  it("reads a model's answer and keeps what it could read", () => {
    const got = parseRead('Here it is: {"store":"Kroger","date":"2026-11-14","total":"$12.27","items":[{"name":"Collard greens","price":3.98},{"name":"Chicken thighs 3 lb","price":"8.29"},{"name":"","price":1}]}', "2026-11-17");
    expect(got).toEqual({ store: "Kroger", day: "2026-11-14", total: 12.27, items: [{ name: "Collard greens", price: 3.98 }, { name: "Chicken thighs 3 lb", price: 8.29 }] });
    expect(parseRead('{"store":"X","date":"2027-01-01","items":[{"name":"Milk","price":2.5}]}', "2026-11-17")).toEqual({ store: "X", day: "2026-11-17", total: 2.5, items: [{ name: "Milk", price: 2.5 }] });
    expect(parseRead("no receipt here", "2026-11-17")).toBeNull();
  });

  it("keeps lines as text and back", () => {
    const items = [{ name: "Eggs | large", price: 3 }, { name: "Milk", price: 2.49 }];
    expect(parseLines(linesText(items))).toEqual([{ name: "Eggs / large", price: 3 }, { name: "Milk", price: 2.49 }]);
  });

  it("guesses eating out from the store", () => {
    expect(guessKind("Chick-fil-A #123")).toBe("eating-out");
    expect(guessKind("Joe's Pizza")).toBe("eating-out");
    expect(guessKind("H-E-B")).toBe("groceries");
  });

  it("adds up the month from confirmed receipts", () => {
    const m = monthSpend([r({ total: 80 }), r({ total: 20, kind: "eating-out" }), r({ total: 99, confirmed: false }), r({ total: 5, day: "2026-10-30" })], "2026-11");
    expect(m).toEqual({ groceries: 80, eatingOut: 20, total: 100, count: 2 });
  });

  it("estimates a list from past prices", () => {
    const book = priceBook([r({ items: [{ name: "Collard Greens", price: 3.98 }, { name: "Buttermilk 1qt", price: 2.29 }] }), r({ day: "2026-11-16", items: [{ name: "Collard greens", price: 4.5 }] })]);
    const e = estimate([{ name: "collard greens", qty: 2, unit: "bunch", meals: [] }, { name: "buttermilk", qty: 1, unit: "cup", meals: [] }, { name: "okra", qty: 1, unit: "pound", meals: [] }], book);
    expect(e).toEqual({ total: 6.79, priced: 2, items: 3 });
  });
});
