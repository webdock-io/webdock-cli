import { Webdock } from "../webdock.ts";
import { expect } from "jsr:@std/expect/expect";
import { Server } from "./servers.ts";

const client = new Webdock(false);

let testServer: Server | null = null;
let callbackId = "";
Deno.test("Server API - List Operations", async (t) => {
	await t.step("list() - Retrieve all servers", async () => {
		const servers = await client.servers.list();

		expect(servers.success).toBe(true);
		if (!servers.success) return;

		if (!servers.data.body) return;
		expect(servers.data.body).toBeInstanceOf(Array);
	});
});

Deno.test({
	name: "Server API - Create Temporary Server",
	fn: async (t) => {
		const local_Server = await client.servers.create({
			name: `temp-${Date.now()}`,
			locationId: "dk",
			profileSlug: "wp-business-2026",
			imageSlug: "krellide:webdock-noble-lemp",
			slug: `temp-${Date.now()}`,
		});

		await t.step("create() - Create temporary server for testing", () => {
			expect(local_Server.success).toBe(true);
		});
		await t.step("create temp server (Might take a while)", () => {
			expect(local_Server.success).toBe(true);
		});

		expect(local_Server.success).toBe(true);
		if (!local_Server.success) {
			return;
		}
		await client.waitForEvent(local_Server.data.headers["x-callback-id"]);
		testServer = local_Server.data.body;
	},
});

Deno.test("Server API - Server Management Operations", async (t) => {
	if (testServer == null) return;

	await t.step("reboot() - Reboot server", async () => {
		if (testServer == null) return;
		const reboot = await client.servers.reboot({
			serverSlug: testServer.slug,
		});
		expect(reboot.success).toBe(true);
		if (!reboot.success) return;
		// expect(reboot.data.headers["x-callback-id"]).toBeDefined();
		callbackId = reboot.data.headers["x-callback-id"];
	});
	await client.waitForEvent(callbackId);

	await t.step("stop() - Shutdown server", async () => {
		if (testServer == null) return;
		const stop = await client.servers.stop({
			serverSlug: testServer.slug,
		});
		expect(stop.success).toBe(true);
		if (!stop.success) return;
		callbackId = stop.data.headers["x-callback-id"];
	});

	await client.waitForEvent(callbackId);

	await t.step("start() - Start server", async () => {
		if (testServer == null) return;
		const start = await client.servers.start({
			serverSlug: testServer.slug,
		});

		expect(start.success).toBe(true);

		if (!start.success) return;
		callbackId = start.data.headers["x-callback-id"];
	});
	await client.waitForEvent(callbackId);

	// this test is commented bc archiving the server will require manual deletion
	// await t.step("archive() - initiates server suspension", async () => {
	// 	const archive = await client.servers.archive({
	// 		serverSlug: testServer.data.body.slug,
	// 	});

	// 	expect(archive.success).toBe(true);
	// 	if (!archive.success) return;

	// 	expect(archive.data.headers["x-callback-id"]).toBeDefined();
	// 	callbackId = archive.data.headers["x-callback-id"];
	// });
	// await client.waitForEvent(callbackId);
});
Deno.test("Server API - Server Metrics", async (t) => {
	await t.step("metrics() - Retrieve real-time server metrics", async () => {
		if (!testServer) return;
		const res = await client.servers.metrics({
			serverSlug: testServer.slug,
			now: true,
		});

		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.body).toMatchObject({
				disk: {
					allowed: expect.any(Number),
					lastSamplings: {
						amount: expect.any(Number),
						timestamp: expect.any(String),
					},
				},
				network: {
					total: expect.any(Number),
					allowed: expect.any(Number),
					latestIngressSampling: {
						amount: expect.any(Number),
						timestamp: expect.any(String),
					},
					latestEgressSampling: {
						amount: expect.any(Number),
						timestamp: expect.any(String),
					},
				},
				cpu: {
					latestUsageSampling: {
						amount: expect.any(Number),
						timestamp: expect.any(String),
					},
				},
				processes: {
					latestProcessesSampling: {
						amount: expect.any(Number),
						timestamp: expect.any(String),
					},
				},
				memory: {
					latestUsageSampling: {
						amount: expect.any(Number),
						timestamp: expect.any(String),
					},
				},
			});
		}
	});
});

Deno.test({
	name: "Server API - Cleanup Operations",
	fn: async (t) => {
		await t.step("delete() - Remove temporary server", async () => {
			if (testServer == null) return;
			const deleteServer = await client.servers.delete({
				serverSlug: testServer.slug,
			});
			expect(deleteServer.success).toBe(true);
			if (!deleteServer.success) return;
			expect(deleteServer.data.headers["x-callback-id"]).toBeDefined();
			callbackId = deleteServer.data.headers["x-callback-id"];
		});
		await client.waitForEvent(callbackId);
	},
});
