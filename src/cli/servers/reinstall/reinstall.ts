import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const reinstallCommand = new Command()
	.description("Reinstall a server")
	.arguments("<serverSlug:string> <imageSlug:string>")
	.option("-t, --token <token:string>", "API token for authentication")
	.option(
		"--userScriptId <userScriptId:string>",
		"Optional user/account or library script ID/slug. Retrieve it via GET /account/scripts or from the Scripts page in the dashboard. If provided, the script is deployed to /root/auto-deploy-script and executed once provisioning finishes (after all provisioning actions, including SSL certificate generation). The script is executed from the command line; ensure it has a valid shebang (e.g. #!/bin/bash, #!/usr/bin/env python3) and is self-contained. Use this to auto-deploy software, credentials, or other setup steps.",
	)
	.option(
		"--wait",
		"Wait until the server is fully up and running before exiting",
	)
	.action(async (options, serverSlug, imageSlug) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.servers.reinstall({
			imageSlug,
			serverSlug,
			...(options.userScriptId ? { userScriptId: options.userScriptId } : {}),
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
				"Server reinstall initiated. Please check its status in a couple of minutes.",
			),
		);
	});
