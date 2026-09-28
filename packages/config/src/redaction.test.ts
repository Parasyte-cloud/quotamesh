import { describe, expect, it } from "vitest";
import { redactSecrets } from "./redaction";

describe("redactSecrets", () => {
  it("redacts nested sensitive keys without mutating safe values", () => {
    const input = {
      password: "hunter2",
      nested: {
        authorization: "Bearer abc",
        cookie: "session=abc",
        access_token: "token-a",
        refresh_token: "token-r",
        private_key: "private",
        radius_secret: "radius",
        secret: "generic",
        site: "Lagos HQ",
      },
    };

    expect(redactSecrets(input)).toEqual({
      password: "[REDACTED]",
      nested: {
        authorization: "[REDACTED]",
        cookie: "[REDACTED]",
        access_token: "[REDACTED]",
        refresh_token: "[REDACTED]",
        private_key: "[REDACTED]",
        radius_secret: "[REDACTED]",
        secret: "[REDACTED]",
        site: "Lagos HQ",
      },
    });
  });
});
