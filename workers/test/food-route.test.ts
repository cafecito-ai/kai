import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("food routes", () => {
  it("ensures the user before saving a manual meal", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const res = await app.fetch(
      new Request("https://worker.test/api/food-photo", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dev-user": "food-tester" },
        body: JSON.stringify({ note: "Turkey sandwich, apple, water" })
      }),
      makeEnv({ statements })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { mealId: string; items: Array<{ name: string }>; confidence: string };
    expect(body.mealId).toBeTruthy();
    expect(body.confidence).toBe("manual_stub");
    expect(body.items.map((item) => item.name)).toEqual(["Turkey sandwich", "apple", "water"]);

    expect(statements[0]?.sql).toContain("INSERT OR IGNORE INTO users");
    expect(statements[0]?.values[0]).toBe("food-tester");
    const mealInsert = statements.find((statement) => statement.sql.includes("INSERT INTO meals"));
    expect(mealInsert?.values[1]).toBe("food-tester");
    expect(mealInsert?.values[3]).toContain("Turkey sandwich");
  });

  it("accepts an uploaded food image and stores it before saving the meal", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const uploads: Array<{ key: string; contentType?: string }> = [];
    const boundary = "kai-food-boundary";
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="photo"; filename="fuel.png"',
      "Content-Type: image/png",
      "",
      "fake-png-bytes",
      `--${boundary}`,
      'Content-Disposition: form-data; name="note"',
      "",
      "Turkey sandwich, apple, water",
      `--${boundary}--`,
      ""
    ].join("\r\n");

    const res = await app.fetch(
      new Request("https://worker.test/api/food-photo-upload", {
        method: "POST",
        headers: { "x-dev-user": "food-upload-tester", "content-type": `multipart/form-data; boundary=${boundary}` },
        body
      }),
      makeEnv({ statements, uploads })
    );

    expect(res.status).toBe(200);
    const payload = (await res.json()) as { r2Key: string; confidence: string; items: Array<{ name: string }> };
    expect(payload.r2Key).toMatch(/^food-photos\/food-upload-tester\/.+\.png$/);
    expect(payload.confidence).toBe("photo_stub");
    expect(payload.items[0]?.name).toBe("Meal photo logged");
    expect(uploads[0]?.key).toBe(payload.r2Key);
    expect(uploads[0]?.contentType).toBe("image/png");
  });

  it("updates a saved meal review for the current user", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const res = await app.fetch(
      new Request("https://worker.test/api/meals/meal-123", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-dev-user": "food-reviewer" },
        body: JSON.stringify({
          items: [{ name: "rice bowl", source: "manual" }],
          notes: "felt steady before practice"
        })
      }),
      makeEnv({ statements })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { meal: { id: string; items: Array<{ name: string }>; notes: string } };
    expect(body.meal.id).toBe("meal-123");
    expect(body.meal.items[0]?.name).toBe("rice bowl");
    const update = statements.find((statement) => statement.sql.includes("UPDATE meals"));
    expect(update?.values[0]).toContain("rice bowl");
    expect(update?.values[1]).toBe("felt steady before practice");
    expect(update?.values[2]).toBe("meal-123");
    expect(update?.values[3]).toBe("food-reviewer");
  });
});

function makeEnv(opts: { statements?: Array<{ sql: string; values: unknown[] }>; uploads?: Array<{ key: string; contentType?: string }> } = {}) {
  return {
    APP_ENV: "staging",
    DB: {
      prepare(sql: string) {
        return {
          bind(...values: unknown[]) {
            return {
              async run() {
                opts.statements?.push({ sql, values });
                return {};
              },
              async first() {
                return null;
              },
              async all() {
                return { results: [] };
              }
            };
          }
        };
      }
    },
    PROGRESS_KV: {
      get: async () => null,
      put: async () => undefined
    },
    SESSIONS_KV: {
      get: async () => null,
      put: async () => undefined
    },
    UPLOADS: {
      put: async (key: string, _value: unknown, options?: { httpMetadata?: { contentType?: string } }) => {
        opts.uploads?.push({ key, contentType: options?.httpMetadata?.contentType });
      }
    }
  };
}
