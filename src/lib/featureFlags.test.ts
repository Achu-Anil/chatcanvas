import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { enabled, FeatureFlags } from "./featureFlags";

describe("featureFlags", () => {
  const originalEnv = process.env.FEATURE_FLAGS;

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.FEATURE_FLAGS = originalEnv;
    } else {
      delete process.env.FEATURE_FLAGS;
    }
    // Clear module cache to reload with new env
    vi.resetModules();
  });

  describe("enabled function", () => {
    it("should return true for enabled flags", async () => {
      process.env.FEATURE_FLAGS = "templates,darkMode";
      vi.resetModules();
      const { enabled } = await import("./featureFlags");

      expect(enabled("templates")).toBe(true);
      expect(enabled("darkMode")).toBe(true);
    });

    it("should return false for disabled flags", async () => {
      process.env.FEATURE_FLAGS = "templates";
      vi.resetModules();
      const { enabled } = await import("./featureFlags");

      expect(enabled("darkMode")).toBe(false);
      expect(enabled("analytics")).toBe(false);
    });

    it("should handle empty FEATURE_FLAGS env var", async () => {
      process.env.FEATURE_FLAGS = "";
      vi.resetModules();
      const { enabled } = await import("./featureFlags");

      expect(enabled("templates")).toBe(false);
      expect(enabled("darkMode")).toBe(false);
    });

    it("should handle undefined FEATURE_FLAGS env var", async () => {
      delete process.env.FEATURE_FLAGS;
      vi.resetModules();
      const { enabled } = await import("./featureFlags");

      expect(enabled("templates")).toBe(false);
    });

    it("should trim whitespace from flag names", async () => {
      process.env.FEATURE_FLAGS = " templates , darkMode ";
      vi.resetModules();
      const { enabled } = await import("./featureFlags");

      expect(enabled("templates")).toBe(true);
      expect(enabled("darkMode")).toBe(true);
    });

    it("should filter out empty strings from comma-separated list", async () => {
      process.env.FEATURE_FLAGS = "templates,,darkMode,";
      vi.resetModules();
      const { enabled } = await import("./featureFlags");

      expect(enabled("templates")).toBe(true);
      expect(enabled("darkMode")).toBe(true);
      expect(enabled("")).toBe(false);
    });

    it("should be case-sensitive", async () => {
      process.env.FEATURE_FLAGS = "templates";
      vi.resetModules();
      const { enabled } = await import("./featureFlags");

      expect(enabled("templates")).toBe(true);
      expect(enabled("Templates")).toBe(false);
      expect(enabled("TEMPLATES")).toBe(false);
    });
  });

  describe("FeatureFlags constants", () => {
    it("should define all feature flag constants", () => {
      expect(FeatureFlags.TEMPLATES).toBe("templates");
      expect(FeatureFlags.DARK_MODE).toBe("darkMode");
      expect(FeatureFlags.ANALYTICS).toBe("analytics");
      expect(FeatureFlags.EXPORT).toBe("export");
    });

    it("should work with enabled function", async () => {
      process.env.FEATURE_FLAGS = "templates,analytics";
      vi.resetModules();
      const { enabled, FeatureFlags } = await import("./featureFlags");

      expect(enabled(FeatureFlags.TEMPLATES)).toBe(true);
      expect(enabled(FeatureFlags.ANALYTICS)).toBe(true);
      expect(enabled(FeatureFlags.DARK_MODE)).toBe(false);
      expect(enabled(FeatureFlags.EXPORT)).toBe(false);
    });
  });

  describe("flags Set", () => {
    it("should parse comma-separated flags into a Set", async () => {
      process.env.FEATURE_FLAGS = "templates,darkMode,analytics";
      vi.resetModules();
      const { flags } = await import("./featureFlags");

      expect(flags.size).toBe(3);
      expect(flags.has("templates")).toBe(true);
      expect(flags.has("darkMode")).toBe(true);
      expect(flags.has("analytics")).toBe(true);
    });

    it("should create empty Set when no flags are provided", async () => {
      process.env.FEATURE_FLAGS = "";
      vi.resetModules();
      const { flags } = await import("./featureFlags");

      expect(flags.size).toBe(0);
    });
  });
});
