import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("uses Argon2id and verifies the correct password", async () => {
    const encoded = await hashPassword("correct horse battery staple");
    expect(encoded.startsWith("$argon2id$v=19$")).toBe(true);
    await expect(verifyPassword(encoded, "correct horse battery staple")).resolves.toBe(true);
    await expect(verifyPassword(encoded, "wrong password")).resolves.toBe(false);
  });
});
