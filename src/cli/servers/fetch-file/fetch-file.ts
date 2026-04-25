import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Webdock } from "@webdock/sdk";
import { sanitizePath } from "../../../utils/sanitize-path.ts";
import { getToken } from "../../../config.ts";

// Fetch file command
export const fetchFileCommand = new Command()
	.name("fetch-file")
	.arguments("<slug:string> <path:string>")
	.description("Fetch a file from a server")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication",
	)
	.option(
		"--wait",
		"Wait until the operation is complete before exiting",
	)
	.action(async (options, slug, path) => {
		const sanitizedPath = await sanitizePath(path);
		if (!sanitizedPath) {
			console.log(colors.bgRed("Invalid Path"));
			Deno.exit(1);
		}

		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.servers.fetchFileAsync({
			path: sanitizedPath,
			slug,
		});

		if (!response.success) {
			if (response.code == 404) console.error("Error 404 Server Not Found!");
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
			colors.bgGreen.underline.bold(
				"File fetched initiated. Check the event history on your dashboard to view its content.",
			),
		);
	});
