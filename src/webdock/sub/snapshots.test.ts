import { expect } from "jsr:@std/expect/expect";

import { Webdock } from "../webdock.ts";
import { Server } from "./servers.ts";
import { Snapshot } from "./snapshots.ts";

const client = new Webdock(false);

let testServer: Server | null = null;
let testSnapshot: Snapshot | null = null;
let callbackId = "";

Deno.test({
	name: "Snapshots API - Setup Temporary Server",
	fn: async (t) => {
		const localServer = await client.servers.create({
			name: `temp-${Date.now()}`,
			locationId: "dk",
			profileSlug: "wp-business-2026",
			imageSlug: "krellide:webdock-noble-lemp",
			slug: `temp-${Date.now()}`,
		});

		await t.step("create() - Create temporary server for testing", () => {
			expect(localServer.success).toBe(true);
		});

		expect(localServer.success).toBe(true);
		if (!localServer.success) {
			return;
		}
		await client.waitForEvent(localServer.data.headers["x-callback-id"]);
		testServer = localServer.data.body;
	},
});

Deno.test("Snapshots API - List Operations", async (t) => {
	await t.step("list() - Retrieve all snapshots", async () => {
		if (!testServer) return;

		const snapshots = await client.snapshots.list({
			serverSlug: testServer.slug,
		});

		expect(snapshots.success).toBe(true);
		if (!snapshots.success) return;

		if (!snapshots.data.body) return;
		expect(snapshots.data.body).toBeInstanceOf(Array);
	});
});

Deno.test({
	name: "Snapshots API - Create Temporary Snapshot",
	fn: async (t) => {
		if (!testServer) return;

		const localSnapshot = await client.snapshots.create({
			serverSlug: testServer.slug,
			name: `test-snapshot-${Date.now()}`,
		});

		await t.step("create() - Create temporary snapshot for testing", () => {
			expect(localSnapshot.success).toBe(true);
		});

		expect(localSnapshot.success).toBe(true);
		if (!localSnapshot.success) {
			return;
		}

		await client.waitForEvent(localSnapshot.data.headers["x-callback-id"]);
		testSnapshot = localSnapshot.data.body;
	},
});

Deno.test("Snapshots API - Delete Operations", async (t) => {
	if (!testSnapshot || !testServer) return;

	await t.step("delete() - Remove temporary snapshot", async () => {
		if (!testSnapshot || !testServer) return;

		const deleteSnapshot = await client.snapshots.delete({
			serverSlug: testServer.slug,
			snapshotId: testSnapshot.id,
		});

		expect(deleteSnapshot.success).toBe(true);
		if (!deleteSnapshot.success) return;
		expect(deleteSnapshot.data.headers["x-callback-id"]).toBeDefined();
		callbackId = deleteSnapshot.data.headers["x-callback-id"];
	});

	await client.waitForEvent(callbackId);
});

Deno.test({
	name: "Snapshots API - Cleanup Operations",
	fn: async (t) => {
		await t.step("delete() - Remove temporary server", async () => {
			if (!testServer) return;
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
