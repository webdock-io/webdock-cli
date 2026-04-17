import { expect } from "jsr:@std/expect/expect";
import { join } from "jsr:@std/path@^1.0.8/join";
import { extractSlugsFromStdOut } from "../../test_utils.ts";
const decoder = new TextDecoder();

let tempProfileSlug = "";

Deno.test({
	name: "Test Profiles CLI",
	fn: async (t) => {
		await t.step("Create Custom Profile", async () => {
			const createServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"profiles",
					"create",
					"--cores=1",
					"--ram=1",
					"--disk=10",
					"--network=1",
					"--platform=epyc_vps",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await createServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const slug = extractSlugsFromStdOut(stdout)[0];

			expect(typeof slug).toBe("string");
			tempProfileSlug = slug;
			expect(slug.startsWith("epyc-1cpu-2ram-15disk-1net-")).toBe(true);
		});

		await t.step("delete Custom Profile", async () => {
			const createServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"profiles",
					"delete",
					tempProfileSlug,
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await createServer.output();
			expect(output.success).toBe(true);
		});
	},
});
