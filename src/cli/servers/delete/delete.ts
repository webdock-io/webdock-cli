import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const deleteCommand = new Command()
	.description("Delete a server")
	.arguments("<serverSlug:string>")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication (required)",
	)
	.option(
		"--wait",
		"Wait until the server has been fully deleted before exiting",
	)
	.action(async (options, serverSlug) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.servers.delete({
			serverSlug: serverSlug,
		});

		if (!response.success) {
			if (response.code == 404) {
				console.error(
					colors.bgRed.bold.underline.italic("Error 404 Server Not Found"),
				);
			} else console.error(colors.bgRed("Sorry, Something went wrong!"));
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
				"Server deletion initiated. Please check again in a minute.",
			),
		);
	});
