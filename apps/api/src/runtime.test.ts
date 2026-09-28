import { describe, expect, it } from "vitest";
import { createRuntime } from "./runtime";

const binding = { connectionString: "postgres://runtime.invalid/quotamesh" };

describe("production runtime gate", () => {
  it("fails closed when the auth Hyperdrive binding is absent", () => {
    expect(() => createRuntime({ QUOTAMESH_TENANT_HYPERDRIVE: binding } as never)).toThrowError(/QUOTAMESH_AUTH_HYPERDRIVE/u);
  });

  it("fails closed when the tenant Hyperdrive binding is absent", () => {
    expect(() => createRuntime({ QUOTAMESH_AUTH_HYPERDRIVE: binding } as never)).toThrowError(/QUOTAMESH_TENANT_HYPERDRIVE/u);
  });

  it("fails closed when either Hyperdrive connection string is empty", () => {
    expect(() => createRuntime({
      QUOTAMESH_AUTH_HYPERDRIVE: { connectionString: "" },
      QUOTAMESH_TENANT_HYPERDRIVE: binding,
    } as never)).toThrowError(/connection string/u);
  });
});
