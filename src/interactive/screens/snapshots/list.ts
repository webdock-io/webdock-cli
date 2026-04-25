import { Select } from "@cliffy/prompt/select";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { navigator } from "../../navigator.ts";

export async function snapshotsListScreen(slug: string) {
	const spinner = new Spinner();
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	spinner.message = "🔍 Loading server snapshots...";
	spinner.start();
	const response = await client.snapshots.list({ serverSlug: slug });
	spinner.stop();

	if (!response.success) {
		console.error("❌ Failed to load server snapshots:", response.error);
		return navigator.goToServerActions(slug);
	}

	if (response.response.body.length == 0) {
		console.error("No snapshots were found for this server");
		return navigator.goToServerActions(slug);
	}

	const snapshotChoice = await Select.prompt({
		message: "Select a snapshot to manage:",
		options: response.response.body
			.map((e) => ({
				value: e.id,
				name: e.name,
			})) // @ts-expect-error:
			.concat(goBackOption),
	});

	if (isGoBack(String(snapshotChoice))) return navigator.goToServerActions(slug);

	await navigator.goToSnapshotActions(slug, snapshotChoice);
}
