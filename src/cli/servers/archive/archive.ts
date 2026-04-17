import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Confirm } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const archiveCommand = new Command()
	.name("archive")
	.description("Put this server in cold storage and free up resources and IPs")
	.arguments("<slug:string>")
	.option("-f, --force", "Force archive without confirmation")
	.option("--wait", "Wait until the operation is finished")
	.option("-t, --token <token:string>", "API token for authentication")
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.option("--json", "Display the results in a json format instead of a Table", {
		conflicts: ["csv"],
	})
	.action(async (options, slug) => {
		if (!options.force) {
			const confirmed = await Confirm.prompt(
				`Are you sure you want to archive server '${slug}'? This will make the server inaccessible.`,
			);

			if (!confirmed) {
				console.log("Operation cancelled.");
				return;
			}
		}

		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.servers.archive({
			serverSlug: slug,
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
			colors.bgGreen.bold.underline.italic(
				"Server archived initiated. Please check its status in a couple of minutes.",
			),
		);
	});
