import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers";

describe("step routes", () => {
  let app: Awaited<ReturnType<typeof createTestApp>>["app"];

  beforeEach(async () => {
    ({ app } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
  });

  it("supports timer start, completion, reset, reordering, and delete reindexing", async () => {
    const recipeResponse = await request(app.server)
      .post("/recipes")
      .send({
        title: "Timer Test"
      })
      .expect(201);

    const recipeId = recipeResponse.body.id as string;

    const firstStep = await request(app.server)
      .post(`/recipes/${recipeId}/steps`)
      .send({
        title: "Start timer",
        position: 1,
        timerDurationSeconds: 60
      })
      .expect(201);

    const secondStep = await request(app.server)
      .post(`/recipes/${recipeId}/steps`)
      .send({
        title: "Finish later",
        position: 2,
        timerDurationSeconds: 90
      })
      .expect(201);

    await request(app.server)
      .patch(`/steps/${secondStep.body.id}`)
      .send({
        title: "Finish first",
        position: 1
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.position).toBe(1);
        expect(response.body.title).toBe("Finish first");
      });

    await request(app.server)
      .get(`/recipes/${recipeId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.steps.map((step: { id: string }) => step.id)).toEqual([
          secondStep.body.id,
          firstStep.body.id
        ]);
        expect(response.body.steps.map((step: { position: number }) => step.position)).toEqual([1, 2]);
      });

    await request(app.server)
      .post(`/steps/${secondStep.body.id}/start-timer`)
      .expect(200)
      .expect((response) => {
        expect(response.body.timerStartedAt).toBe("2026-03-25T12:00:00.000Z");
      });

    await request(app.server)
      .post(`/steps/${secondStep.body.id}/complete`)
      .expect(200)
      .expect((response) => {
        expect(response.body.completedAt).toBe("2026-03-25T12:00:00.000Z");
      });

    await request(app.server)
      .post(`/steps/${secondStep.body.id}/reset`)
      .expect(200)
      .expect((response) => {
        expect(response.body.completedAt).toBeNull();
        expect(response.body.timerStartedAt).toBeNull();
      });

    await request(app.server)
      .delete(`/steps/${firstStep.body.id}`)
      .expect(204);

    await request(app.server)
      .get(`/recipes/${recipeId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.steps).toHaveLength(1);
        expect(response.body.steps[0].id).toBe(secondStep.body.id);
        expect(response.body.steps[0].position).toBe(1);
      });
  });
});
