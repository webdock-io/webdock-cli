import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
export const deleteCommand = new Command()
	.description("Delete a snapshot")
	.arguments("<serverSlug:string> <snapshotId:number>")
	.option("-t, --token <token:string>", "API token for authentication")
	.option("--wait", "Wait until the operation is finished")
	.action(
		async (
			options,
			serverSlug: string,
			snapshotId: number,
		) => {
			const token = await getToken(options.token);
			const client = new Webdock(token);
			const response = await client.snapshots.delete({
				serverSlug,
				snapshotId,
			});
			if (!response.success) {
				console.error("Error 404 Server or Snapshot not found!");

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
					`Snapshot deletion has been initiated. Please check again in a minute.`,
				),
			);
		},
	);
