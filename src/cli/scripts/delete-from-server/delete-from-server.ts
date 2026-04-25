import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const serverScriptsDeleteCommand = new Command()
	.description("Delete a script from a server")
	.arguments("<serverSlug:string> <scriptId:number>")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication (required for secure endpoints)",
	)
	.action(async (options, serverSlug: string, scriptId: number) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.servers.scripts.delete({
			scriptId,
			serverSlug,
		});

		if (!response.success) {
			if (response.code == 404) {
				console.error("Error 404 server or script not found!");
			}

			Deno.exit(1);
		}

		console.log("Script deleted successfully");
	});
