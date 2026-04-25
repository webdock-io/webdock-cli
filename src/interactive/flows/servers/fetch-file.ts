import { Confirm, Input } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getConfigDir, getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { sanitizePath } from "../../../utils/sanitize-path.ts";
import { navigator } from "../../navigator.ts";
import { dirname, join } from "node:path";
import { Buffer } from "node:buffer";
import { decodeBase64 } from "jsr:@std/encoding@~1.0.5/base64";
import { PathPicker } from "../../utils/path-picker.ts";

export async function fetchFile(slug: string) {
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });

	const spinner = new Spinner();

	const path = await Input.prompt({
		message: "📁 Enter file path to retrieve:",
		validate: (val) => val.startsWith("/") ? true : "Path should be absolute",
	});

	const sanitizedPath = await sanitizePath(path);
	if (!sanitizedPath) return;

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();

	const response = await client.servers.fetchFile({
		path: sanitizedPath,
		slug: slug,
	});
	spinner.stop();

	if (!response.success) {
		console.error("\n❌ Failed to retrieve file:", response.message);
		return navigator.goToMain();
	}

	const DirPath = await new PathPicker().pickDir();
	Deno.mkdir(dirname(DirPath), { recursive: true });

	let fileName: string;
	while (true) {
		fileName = await Input.prompt({
			message: "💾 Enter a name for the downloaded file:",
			minLength: 1,
		});
		const filePath = join(DirPath, fileName);

		if (await Deno.stat(filePath).then(() => true).catch(() => false)) {
			const overwrite = await Confirm.prompt("⚠️ File already exists. Do you want to overwrite it?");
			if (!overwrite) continue;
		}
		break;
	}
	const filePath = join(DirPath, fileName);

	await Deno.writeFile(filePath, decodeBase64(response.content || ""));

	console.log(`\n📁 File saved to: ${filePath}`);
	console.log("\n✅ File successfully retrieved!");
	return navigator.goToServerActions(slug);
}
