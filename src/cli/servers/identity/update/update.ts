import { Command } from "@cliffy/command";
import { getToken } from "../../../../config.ts";
import { Webdock } from "@webdock/sdk";

export const updateserverIdentity = new Command()
	.name("server Identity")
	.description("Update the server identity including main domain and alias domains.")
	.arguments("<serverSlug:string>")
	.option("--wait", "wait for operation to finish")
	.option("--maindomain <maindomain:string>", "Main domain for the server", { required: true })
	.option("--aliasdomains <aliasdomains:string>", "Alias domains for the server (newline or comma separated)", { required: true })
	.option(
		"--removeDefaultAlias <removeDefaultAlias:boolean>",
		"If true, remove the default Webdock alias from DNS. Warning: phpMyAdmin and other services may become inaccessible if your main domain has DNS issues.",
		{ default: true },
	)
	.option("-t, --token <token:string>", "API token for authentication")
	.action(async (options, serverSlug) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.servers.identity.update({
			serverSlug: serverSlug,
			maindomain: options.maindomain,
			aliasdomains: options.aliasdomains,
			removeDefaultAlias: options.removeDefaultAlias,
		});

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}
		if (options.wait) {
			const callback = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
			if (!callback.success) {
				console.error(callback.success);
				Deno.exit(1);
			}
			console.log("server identity update");
		}
		console.log("server identity update initiated");
	});
