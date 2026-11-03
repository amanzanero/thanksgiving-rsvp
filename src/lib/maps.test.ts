import { describe, expect, it } from "vitest";
import { directionsUrl } from "./maps";

describe("directionsUrl", () => {
  it("builds a Google Maps search link with the address encoded", () => {
    expect(directionsUrl("123 Example St, Anytown, CA 90000")).toBe(
      "https://www.google.com/maps/search/?api=1&query=123%20Example%20St%2C%20Anytown%2C%20CA%2090000",
    );
  });

  it("encodes characters that would break the query", () => {
    const url = directionsUrl(" 1 A&B St #5 ");
    expect(url).toBe("https://www.google.com/maps/search/?api=1&query=1%20A%26B%20St%20%235");
  });
});
