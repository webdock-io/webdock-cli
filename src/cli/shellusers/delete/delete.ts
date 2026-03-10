import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Confirm } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const deleteCommand = new Command()
	.name("delete")
	.description("Delete a shell user from a server")
	.arguments("<slug:string> <id:number>")
	.option("-f, --force", "Force deletion without confirmation", {
		default: false,
	})
	.option("-t, --token <token:string>", "API token for authentication")
	.option("--wait", "Wait until the operation is completed")
	.action(async (options, serverSlug, userId) => {
		if (!options.force) {
			const confirmed = await Confirm.prompt(
				`Are you sure you want to delete shell user with ID ${userId}? This action cannot be undone.`,
			);

			if (!confirmed) {
				console.log("Operation cancelled.");
				return;
			}
		}

		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.shellUsers.delete({
			serverSlug,
			userId,
		});

		if (!response.success) {
			console.error(response.error);
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
			colors.bgGreen.bold.italic.underline(
				"Shelluser deletion initiated. Please check again in a minute.",
			),
		);
	});
