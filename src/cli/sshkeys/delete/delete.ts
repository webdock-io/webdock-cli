import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const deleteCommand = new Command()
	.description("Delete an SSH key")
	.arguments("<id:number>")
	.option("-t, --token <token:string>", "API token for authentication")
	.action(async (options, id) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.sshkeys.delete({ id });

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}

		console.log(colors.bgGreen("SSH key deleted successfully"));
	});
