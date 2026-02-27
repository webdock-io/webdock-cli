import { expect } from "jsr:@std/expect/expect";
import { Webdock } from "../webdock.ts";

const client = new Webdock(false);

Deno.test({
	name: "Webhooks API - List and Structure Validation",
	fn: async (it) => {
		const response = await client.hooks.list();

		await it.step("should return a successful response", () => {
			expect(response.success).toBe(true);
		});

		if (!response.success) return;

		await it.step("should return hooks with valid data structure", () => {
			response.data.body.forEach((hook) => {
				expect(hook).toMatchObject({
					id: expect.any(Number),
					callbackUrl: expect.any(String),
				});
				hook.filters.forEach((filter) => {
					expect(filter).toMatchObject({
						type: expect.any(String),
						value: expect.any(String),
					});
				});
			});
		});
	},
});
let testHook: any | null;
Deno.test({
	name: "Webhooks API - Create New Webhook",
	fn: async (it) => {
		const randomTestUrl =  `https://httpbin.org/status/200?qs=${Date.now()}` ;

		const testEventType = "backup";
		const response = await client.hooks.create({
			callbackUrl: randomTestUrl,
			eventType: testEventType,
		});

		await it.step("should return a successful creation response", () => {
			expect(response.success).toBe(true);
		});

		if (!response.success) return;
		testHook = response.data;
		await it.step("should return created hook with valid structure", () => {
			expect(response.data.body).toMatchObject({
				id: expect.any(Number),
				callbackUrl: randomTestUrl,
				filters: expect.arrayContaining([
					expect.objectContaining({
						type: "eventType",
						value: testEventType,
					}),
				]),
			});
		});
	},
});

Deno.test({
	name: "Webhooks API - Retrieve Webhook Details",
	fn: async (it) => {
		const response = await client.hooks.getById({
			id: testHook?.body.id ?? 10,
		});

		await it.step("should return successful response for valid hook ID", () => {
			expect(response.success).toBe(true);
		});

		if (!response.success) return;
		testHook = response.data;

		await it.step("should return webhook with matching ID and valid structure", () => {
			expect(response.data.body).toMatchObject(testHook?.body ?? {});
		});
	},
});

Deno.test({
	name: "Webhooks API - Delete Webhook",
	fn: async (it) => {
		const response = await client.hooks.deleteById({
			id: testHook?.body.id ?? 10,
		});

		await it.step("should return success when deleting with valid ID", () => {
			expect(response.success).toBe(true);
		});
	},
});
