import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const execute = vi.fn(async () => undefined);

  const transaction = vi.fn(
    async (
      fn: (tx: { execute: typeof execute }) => Promise<unknown>,
    ) => fn({ execute }),
  );

  return {
    execute,
    transaction,
  };
});

vi.mock("./client", () => ({
  database: {
    db: {
      transaction: mocks.transaction,
    },
  },
}));

import { withTenant } from "./tenant-context";

describe("withTenant", () => {
  it("sets transaction-local tenant context before repository access", async () => {
    const organizationId =
      "550e8400-e29b-41d4-a716-446655440000" as never;

    const repositoryAccess = vi.fn(async () => "ok");

    await expect(
      withTenant(organizationId, repositoryAccess),
    ).resolves.toBe("ok");

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(repositoryAccess).toHaveBeenCalledTimes(1);

    const executeOrder = mocks.execute.mock.invocationCallOrder[0];
    const repositoryOrder =
      repositoryAccess.mock.invocationCallOrder[0];

    expect(executeOrder).toBeDefined();
    expect(repositoryOrder).toBeDefined();

    expect(executeOrder!).toBeLessThan(repositoryOrder!);
  });
});
