import { colors } from "@cliffy/ansi/colors";
import { Confirm, Input } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { navigator } from "../../navigator.ts";

export async function createSnapshot(slug: string) {
	const spinner = new Spinner();
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });

	const name = await Input.prompt({
		message: "📸 Enter snapshot name:",
		validate: (input) => input.length > 2 || "Name must be at least 3 characters",
	});

	const confirm = await Confirm.prompt({
		message: `Create snapshot '${name}' for server ${slug}?`,
		default: false,
	});

	if (!confirm) {
		console.log("🚫 Snapshot creation cancelled");
		return navigator.goToSnapshots(slug);
	}

	spinner.message = "📡 Creating server snapshot...";
	spinner.start();
	const response = await client.snapshots.create({
		name: name,
		serverSlug: slug,
	});
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 404:
				console.error("❌ Server not found");
				break;
			case 409:
				console.error("❌ Snapshot already exists");
				break;
			case 400:
				console.error("❌ Invalid request:", response.error);
				break;
			default:
				console.error("❌ Creation failed:", response.error);
		}
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log(colors.green("\n✅ Snapshot created successfully!"));
	console.log("📛 Name:", colors.cyan(name));
	console.log("🆔 ID:", response.response.body.id);
	console.log(
		"🔗 Manage snapshots:",
		colors.underline(`https://webdock.io/en/dash/managesnapshots/${slug}`),
	);
	return navigator.goToSnapshots(slug);
}
