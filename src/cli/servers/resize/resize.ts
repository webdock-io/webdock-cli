import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../fun-fact.ts";

export const resizeCommand = new Command()
	.description("Resize a server (change profile)")
	.arguments("<serverSlug:string> <profileSlug:string>")
	.option("-t, --token <token:string>", "API token for authentication")
	.option("--wait", "Wait until the action is complete")
	.action(async (options, serverSlug: string, profileSlug) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.servers.resize(
			{
				profileSlug: String(profileSlug),
				serverSlug,
			},
		);
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
			colors.bgWhite.cyan(
				` Server resize process started!, check again in a minute`,
			),
		);
	});
