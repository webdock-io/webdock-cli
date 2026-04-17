import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../fun-fact.ts";

export const stopCommand = new Command()
	.description("Start a server")
	.arguments("<serverSlug:string>")
	.option("-t, --token <token:string>", "API token for authentication")
	.option(
		"--wait",
		"Wait until the server is fully up and running before exiting",
	).action(async (options, serverSlug) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.servers.stop({
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

		console.log(
			colors.bgGreen.bold.underline.italic(
				"Server shutdown initiated. Please check its status in a couple of minutes.",
			),
		);
		Deno.exit(0);
	});
