import { Command } from "@cliffy/command";
import { getToken } from "../../../../config.ts";
import { Webdock } from "@webdock/sdk";

export const renewServerSslCommand = new Command()
	.name("server ssl")
	.description("Renew SSL certificates for a server.")
	.arguments("<serverSlug:string>")
	.option("--wait", "wait for operation to finish")
	.option("--domains <domains:string[]>", "Domains to include in the certificate (newline or comma separated)", { required: true })
	.option("--email <email:string>", "Email address for certificate notifications", { required: true })
	.option("--forceSSL <forceSSL:boolean>", "If true, enforce SSL/TLS configuration for the renewed domains.", { default: true })
	.option("-t, --token <token:string>", "API token for authentication")
	.action(async (options, serverSlug) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.servers.identity.renewCertificates({
			serverSlug,
			domains: options.domains,
			email: options.email,
			forceSSL: options.forceSSL,
		});

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}

		if (options.wait) {
			const callbackId = (response as unknown as { response: { headers: { "x-callback-id": string } } }).response.headers["x-callback-id"];
			const callback = await client.operation.waitForEventToEnd(callbackId);
			if (!callback.success) {
				console.error(callback.error);
				Deno.exit(1);
			}

			console.log("server ssl update");
		}

		console.log("server ssl update initiated");
	});
