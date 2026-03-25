import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers";

describe("recipe routes", () => {
  let app: Awaited<ReturnType<typeof createTestApp>>["app"];

  beforeEach(async () => {
    ({ app } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
  });

  it("supports recipe CRUD and keeps nested steps ordered", async () => {
    const createRecipeResponse = await request(app.server)
      .post("/recipes")
      .send({
        title: "Lasagna",
        description: "Rich and layered"
      })
      .expect(201);

    const recipeId = createRecipeResponse.body.id as string;

    await request(app.server)
      .get("/recipes")
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({
          id: recipeId,
          title: "Lasagna",
          description: "Rich and layered"
        });
      });

    await request(app.server)
      .get(`/recipes/${recipeId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: recipeId,
          title: "Lasagna",
          description: "Rich and layered",
          ingredients: [],
          steps: []
        });
      });

    await request(app.server)
      .patch(`/recipes/${recipeId}`)
      .send({
        title: "Grandma's Lasagna",
        description: null
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: recipeId,
          title: "Grandma's Lasagna",
          description: null
        });
      });

    const firstStep = await request(app.server)
      .post(`/recipes/${recipeId}/steps`)
      .send({
        title: "Prep sauce",
        instructions: "Simmer for a while",
        position: 1,
        timerDurationSeconds: 600
      })
      .expect(201);

    const secondStep = await request(app.server)
      .post(`/recipes/${recipeId}/steps`)
      .send({
        title: "Boil noodles",
        instructions: "Keep them al dente",
        position: 2,
        timerDurationSeconds: 480
      })
      .expect(201);

    const thirdStep = await request(app.server)
      .post(`/recipes/${recipeId}/steps`)
      .send({
        title: "Layer and bake",
        instructions: "Finish in the oven",
        position: 3,
        timerDurationSeconds: 1800
      })
      .expect(201);

    await request(app.server)
      .patch(`/steps/${thirdStep.body.id}`)
      .send({
        position: 1
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.position).toBe(1);
      });

    await request(app.server)
      .get(`/recipes/${recipeId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.steps).toHaveLength(3);
        expect(response.body.steps.map((step: { id: string }) => step.id)).toEqual([
          thirdStep.body.id,
          firstStep.body.id,
          secondStep.body.id
        ]);
        expect(response.body.steps.map((step: { position: number }) => step.position)).toEqual([1, 2, 3]);
      });

    await request(app.server)
      .delete(`/recipes/${recipeId}`)
      .expect(204);

    await request(app.server)
      .get(`/recipes/${recipeId}`)
      .expect(404);
  });
});
