import { Confirm } from "@cliffy/prompt";
import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { navigator } from "../../navigator.ts";

export async function restoreSnapshot(
	serverSlug: string,
	snapshotId: number,
) {
	const confirm = await Confirm.prompt({
		message: `Are you sure you want to restore snapshot #${serverSlug} to server #${snapshotId}`,
		default: false,
	});
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	if (!confirm) {
		console.log("🚫 Snapshot restoration cancelled");
		return navigator.goToSnapshots(serverSlug);
	}

	const spinner = new Spinner();
	spinner.message = "Restoring snapshot!";
	spinner.start();
	const restore = await client.snapshots.restore({ serverSlug, snapshotId });
	spinner.stop();

	if (!restore.success) {
		console.log(restore.error);
		return navigator.goToServerActions(serverSlug);
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(restore.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log("Snapshot restored successfully");
	return navigator.goToServerActions(serverSlug);
}
