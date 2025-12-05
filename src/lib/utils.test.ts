import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("utils", () => {
  describe("cn (className utility)", () => {
    it("should merge single class name", () => {
      expect(cn("text-red-500")).toBe("text-red-500");
    });

    it("should merge multiple class names", () => {
      expect(cn("text-red-500", "bg-blue-500")).toBe(
        "text-red-500 bg-blue-500"
      );
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      expect(cn("base-class", isActive && "active-class")).toBe(
        "base-class active-class"
      );
    });

    it("should filter out false/null/undefined values", () => {
      expect(cn("text-red-500", false, null, undefined, "bg-blue-500")).toBe(
        "text-red-500 bg-blue-500"
      );
    });

    it("should merge Tailwind classes correctly (deduplication)", () => {
      // twMerge should deduplicate conflicting Tailwind classes
      expect(cn("px-4 py-2", "px-6")).toBe("py-2 px-6");
    });

    it("should handle array of classes", () => {
      expect(cn(["text-red-500", "bg-blue-500"])).toBe(
        "text-red-500 bg-blue-500"
      );
    });

    it("should handle objects with boolean values", () => {
      expect(
        cn({
          "text-red-500": true,
          "bg-blue-500": false,
          "border-black": true,
        })
      ).toBe("text-red-500 border-black");
    });

    it("should handle empty input", () => {
      expect(cn()).toBe("");
    });

    it("should handle mixed input types", () => {
      expect(
        cn("base", ["array-class"], { conditional: true }, false, "end")
      ).toBe("base array-class conditional end");
    });
  });
});
