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
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.account.scripts.delete({
			id,
		});

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}

		console.log("Account script deleted successfully");
	});
