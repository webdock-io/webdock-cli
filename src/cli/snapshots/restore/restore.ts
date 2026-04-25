import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
export const restoreCommand = new Command()
	.description("Restore a server from a snapshot")
	.arguments("<serverSlug:string> <snapshotId:number>")
	.option("-t, --token <token:string>", "API token for authentication")
	.option("--wait", "Wait until the operation is finished")
	.action(async (options, serverSlug, snapshotId) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.snapshots.restore({
			serverSlug,
			snapshotId,
		});
		if (!response.success) {
			if (response.code == 404) {
				console.error("Error 404 Snapshot or Server not found!");
			}
			if (response.code == 400) console.error(response.error);
			Deno.exit(1);
		}

		if (options.wait) {
			const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
			if (!waitResult.success) {
				console.error(waitResult.error);
				Deno.exit(1);
			}
		}

		console.log(
			colors.bgYellow.underline.bold.italic(
				`Snapshot restore has been initiated. Please check again in a minute.`,
			),
		);
	});
