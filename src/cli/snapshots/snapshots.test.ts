import { expect } from "jsr:@std/expect/expect";
import { join } from "jsr:@std/path@^1.0.8/join";
import { extractIdsFromStdOut, extractSlugsFromStdOut } from "../../test_utils.ts";
const decoder = new TextDecoder();

let tempServerSlug = "";
let test_snapshotId = 0;
Deno.test({
	name: "Test Snapshots CLI",
	fn: async (t) => {
		await t.step("[CLI] Create Temp Server", async (it) => {
			const tempServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					join(Deno.cwd(), "src", "main.ts"),
					"servers",
					"create",
					`temp-${Date.now()}`,
					"dk",
					"wp-business-2026",
					"-i",
					"webdock-ubuntu-jammy-cloud",
					"--slug",
					`temp-${Date.now()}`,
					"--wait",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await tempServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'servers create' command failed.${ctx}`).toBe(true);
			});

			const slugs = extractSlugsFromStdOut(stdout);
			tempServerSlug = slugs[0] ?? "";
		});

		await t.step("[CLI] Create a snapshot", async (it) => {
			const test_snapshot = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					join(Deno.cwd(), "src", "main.ts"),
					"snapshots",
					"create",
					tempServerSlug,
					"snapshot_test_name",
					"--wait",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await test_snapshot.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'snapshots create' on server '${tempServerSlug}' failed.${ctx}`).toBe(true);
			});

			const ids = extractIdsFromStdOut(stdout);
			test_snapshotId = ids[0] ?? 0;
		});

		await t.step("[CLI] Delete a snapshot", async (it) => {
			const delete_test_snapshot = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					join(Deno.cwd(), "src", "main.ts"),
					"snapshots",
					"delete",
					tempServerSlug,
					String(test_snapshotId),
					"--wait",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await delete_test_snapshot.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'snapshots delete ${test_snapshotId}' on server '${tempServerSlug}' failed.${ctx}`).toBe(true);
			});
		});
	},
});
