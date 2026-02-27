import { Webdock } from "../webdock.ts";
import { expect } from "jsr:@std/expect";
import { Server } from "./servers.ts";
import { ShellUserDTO } from "./shellusers.ts";

const client = new Webdock(false);

let testServer: Server | null = null;
let testShellUser: ShellUserDTO | null = null;
let callbackId = "";

Deno.test({
	name: "Shell Users API - Setup Temporary Server",
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

Deno.test("Shell Users API - List Operations", async (t) => {
	if (!testServer) return;

	await t.step("list() - Retrieve all shell users", async () => {
		if (!testServer) return;

		const shellUsers = await client.shellUsers.list({
			serverSlug: testServer.slug,
		});

		expect(shellUsers.success).toBe(true);
		if (!shellUsers.success) return;

		if (!shellUsers.data.body) return;
		expect(shellUsers.data.body).toBeInstanceOf(Array);
	});
});

Deno.test({
	name: "Shell Users API - Create Temporary Shell User",
	fn: async (t) => {
		if (!testServer) return;

		const localShellUser = await client.shellUsers.create({
			serverSlug: testServer.slug,
			username: `testuser-${Date.now()}`,
			password: "testpassword123",
			group: "sudo",
			shell: "/bin/bash",
			publicKeys: [],
		});

		await t.step("create() - Create temporary shell user for testing", () => {
			expect(localShellUser.success).toBe(true);
		});

		expect(localShellUser.success).toBe(true);
		if (!localShellUser.success) {
			return;
		}

		await client.waitForEvent(localShellUser.data.headers["x-callback-id"]);
		testShellUser = localShellUser.data.body;
	},
});

Deno.test("Shell Users API - Delete Operations", async (t) => {
	if (!testShellUser || !testServer) return;

	await t.step("delete() - Remove temporary shell user", async () => {
		if (!testServer) return;
		if (!testShellUser) return;

		const deleteShellUser = await client.shellUsers.delete({
			serverSlug: testServer.slug,
			userId: testShellUser.id,
		});

		expect(deleteShellUser.success).toBe(true);
		if (!deleteShellUser.success) return;
		expect(deleteShellUser.data.headers["x-callback-id"]).toBeDefined();
		callbackId = deleteShellUser.data.headers["x-callback-id"];
	});

	await client.waitForEvent(callbackId);
});

Deno.test({
	name: "Shell Users API - Cleanup Operations",
	fn: async (t) => {
		if (!testServer) return;

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
