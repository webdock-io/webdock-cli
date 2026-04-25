import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapSlug } from "../../../test_utils.ts";
import { Webdock } from "@webdock/sdk";

import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const DeleteCommand = new Command()
	.description("Create a Custom hardware profile!")
	.arguments("<slug:string>")
	.option("-t, --token <token:string>", "API token used for authentication")
	.action(async (options, profileSlug) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });

		const response = await client.profiles.delete({
			profileSlug: profileSlug,
		});

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}
	});
