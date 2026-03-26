import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers";

describe("ingredient routes", () => {
  let app: Awaited<ReturnType<typeof createTestApp>>["app"];

  beforeEach(async () => {
    ({ app } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
  });

  it("supports ingredient CRUD, purchased tracking, reset, and ordered positions", async () => {
    const recipeResponse = await request(app.server)
      .post("/recipes")
      .send({
        title: "Soup"
      })
      .expect(201);

    const recipeId = recipeResponse.body.id as string;

    const stock = await request(app.server)
      .post(`/recipes/${recipeId}/ingredients`)
      .send({
        name: "Vegetable stock",
        quantity: 1,
        unit: "l",
        notes: "Warm before adding",
        position: 1
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.purchased).toBe(false);
      });

    const salt = await request(app.server)
      .post(`/recipes/${recipeId}/ingredients`)
      .send({
        name: "Salt",
        quantity: 5,
        unit: "g",
        position: 2
      })
      .expect(201);

    await request(app.server)
      .patch(`/ingredients/${salt.body.id}`)
      .send({
        quantity: 0.5,
        unit: "oz",
        purchased: true,
        position: 1
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.quantity).toBe(0.5);
        expect(response.body.unit).toBe("oz");
        expect(response.body.purchased).toBe(true);
        expect(response.body.position).toBe(1);
      });

    await request(app.server)
      .get(`/recipes/${recipeId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.ingredients.map((ingredient: { id: string }) => ingredient.id)).toEqual([
          salt.body.id,
          stock.body.id
        ]);
        expect(response.body.ingredients.map((ingredient: { position: number }) => ingredient.position)).toEqual([1, 2]);
        expect(response.body.ingredients.map((ingredient: { purchased: boolean }) => ingredient.purchased)).toEqual([true, false]);
      });

    await request(app.server)
      .post(`/recipes/${recipeId}/ingredients/reset`)
      .expect(204);

    await request(app.server)
      .get(`/recipes/${recipeId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.ingredients.map((ingredient: { purchased: boolean }) => ingredient.purchased)).toEqual([false, false]);
      });

    await request(app.server)
      .delete(`/ingredients/${stock.body.id}`)
      .expect(204);

    await request(app.server)
      .get(`/recipes/${recipeId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.ingredients).toHaveLength(1);
        expect(response.body.ingredients[0].id).toBe(salt.body.id);
        expect(response.body.ingredients[0].position).toBe(1);
      });
  });
});
