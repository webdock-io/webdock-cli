import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const deleteCommand = new Command()
	.description("Delete an account script")
	.arguments("<id:number>")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication (required for secure endpoints)",
	)
	.action(async (options, id: number) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.scripts.delete({
			id,
		});

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}

		console.log("Account script deleted successfully");
	});
