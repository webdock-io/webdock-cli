import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const uncancelCommand = new Command()
	.description("Cancel scheduled deletion")
	.arguments("<serverSlug:string>")
	.option("-t, --token <token:string>", "API token for authentication")
	.action(async (options, serverSlug) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.servers.cancelDelete({
			serverSlug,
		});

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}

		Deno.exit(0);
	});
