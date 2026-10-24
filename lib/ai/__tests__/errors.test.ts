import { describe, it, expect, vi } from "vitest";
import { AIError, classifyError, withRetry } from "../errors";

describe("classifyError", () => {
  it("treats 429 as retryable rate limiting", () => {
    const e = classifyError({ status: 429, message: "slow down" }, "scoring");
    expect(e.code).toBe("RATE_LIMITED");
    expect(e.retryable).toBe(true);
  });

  it("treats 5xx as retryable provider errors", () => {
    expect(classifyError({ status: 503 }, "transcription").retryable).toBe(true);
  });

  it("treats 401 as a permanent auth error", () => {
    const e = classifyError({ status: 401 }, "transcription");
    expect(e.code).toBe("AUTH");
    expect(e.retryable).toBe(false);
  });

  it("treats 400 as permanent bad input", () => {
    expect(classifyError({ status: 400 }, "transcription").code).toBe("BAD_INPUT");
  });

  it("treats unknown errors as permanent", () => {
    expect(classifyError(new Error("boom"), "scoring").retryable).toBe(false);
  });

  it("passes AIError through unchanged", () => {
    const original = new AIError("x", "EMPTY_TRANSCRIPT", "transcription", false);
    expect(classifyError(original, "scoring")).toBe(original);
  });
});

describe("withRetry", () => {
  it("retries retryable errors and then succeeds", async () => {
  vi.useFakeTimers();

  try {
    let calls = 0;

    const resultPromise = withRetry(
      async () => {
        calls++;

        if (calls < 3) {
          throw {
            status: 503,
            message: "Temporary provider error",
          };
        }

        return "success";
      },
      {
        stage: "transcription",
        maxAttempts: 3,
        delaysMs: [2000, 8000],
      },
    );

    // First retry: advance through the 2-second delay.
    await vi.advanceTimersByTimeAsync(2000);

    // Second retry: advance through the 8-second delay.
    await vi.advanceTimersByTimeAsync(8000);

    await expect(resultPromise).resolves.toBe("success");
    expect(calls).toBe(3);
  } finally {
    vi.useRealTimers();
  }
});

  it("does not retry permanent errors", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls++;
          throw { status: 401 };
        },
        { stage: "scoring", delaysMs: [1] },
      ),
    ).rejects.toMatchObject({ code: "AUTH" });
    expect(calls).toBe(1);
  });

  it("gives up after maxAttempts", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls++;
          throw { status: 500 };
        },
        { stage: "scoring", maxAttempts: 2, delaysMs: [1] },
      ),
    ).rejects.toMatchObject({ retryable: true });
    expect(calls).toBe(2);
  });
});
