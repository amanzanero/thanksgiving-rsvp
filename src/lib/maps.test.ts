import { describe, expect, it } from "vitest";
import { directionsUrl } from "./maps";

describe("directionsUrl", () => {
  it("builds a Google Maps search link with the address encoded", () => {
    expect(directionsUrl("20635 Calle Bella, Yorba Linda, CA 92887")).toBe(
      "https://www.google.com/maps/search/?api=1&query=20635%20Calle%20Bella%2C%20Yorba%20Linda%2C%20CA%2092887",
    );
  });

  it("encodes characters that would break the query", () => {
    const url = directionsUrl(" 1 A&B St #5 ");
    expect(url).toBe("https://www.google.com/maps/search/?api=1&query=1%20A%26B%20St%20%235");
  });
});
