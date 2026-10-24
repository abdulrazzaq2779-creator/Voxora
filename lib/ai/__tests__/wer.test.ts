import { describe, expect, it } from "vitest";
import { wordErrorRate } from "../wer";

describe("wordErrorRate", () => {
  it("is 0 for identical text, ignoring case and punctuation", () => {
    expect(wordErrorRate("I led a team.", "i LED a team").wer).toBe(0);
  });

  it("ignores apostrophes", () => {
    expect(wordErrorRate("we don't know", "we dont know").wer).toBe(0);
  });

  it("counts a substitution", () => {
    const r = wordErrorRate("I led a team", "I led a tea");
    expect(r.edits).toBe(1);
    expect(r.wer).toBeCloseTo(0.25);
  });

  it("counts a deletion", () => {
    expect(wordErrorRate("one two three four", "one two four").wer).toBeCloseTo(0.25);
  });

  it("counts an insertion", () => {
    expect(wordErrorRate("one two", "one two three").wer).toBeCloseTo(0.5);
  });

  it("handles an empty reference", () => {
    expect(wordErrorRate("", "").wer).toBe(0);
    expect(wordErrorRate("", "anything").wer).toBe(1);
  });

  it("is 1 when the hypothesis is empty", () => {
    expect(wordErrorRate("one two three", "").wer).toBe(1);
  });
});
