import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const serverScriptsExecuteCommand = new Command()
	.description("Execute a script on a server")
	.arguments("<serverSlug:string> <scriptId:number>")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication (required for secure endpoints)",
	)
	.option(
		"--wait",
		"Wait until the operation has completed before exiting",
	)
	.action(async (options, serverSlug: string, scriptID: number) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.servers.scripts.execute({
			scriptID,
			serverSlug,
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
		console.log(colors.bgGreen("script Execution initiated!"));

		Deno.exit(0);
	});
