import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { stringify } from "npm:csv-stringify/sync";
import { getToken } from "../../../config.ts";
import { wrapId, wrapSlug } from "../../../test_utils.ts";

export const listArchivedServersCommand = new Command()
	.name("Archived servers")
	.description("List Archived servers")
	.option(
		"-t, --token <token:string>",
		"API token used for authenticating requests. Required for secure access. Make sure to provide a valid token string.",
	)
	.option("--json", "Display the results in a json format instead of a Table", {
		conflicts: ["csv"],
	})
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.action(async (options) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.account.listArchivedServers()

		if (!response.success) {
			Deno.exit(1);
		}

		if (options.csv) {
			const cvsObject: Record<string, unknown> = response.response.body[0];
			const keys = Object.keys(cvsObject);

			console.log(
				stringify([keys.map((key) => cvsObject[key])], {
					columns: keys,
					header: true,
				}),
			);
			return;
		}

		if (options.json) {
			console.log(JSON.stringify(response.response));
			return;
		}

		const rows = (response.response.body || []).map((item) => [
			wrapId(String(item.id ?? "-")),
			String(item.callbackId ?? "-"),
			String(item.completed ?? "-"),
			String(item.deletable ?? "-"),
			String(item.name ?? "-"),
			String(item.virtualization ?? "-"),
			String(item.type ?? "-"),
			wrapSlug(String(item.serverSlug ?? "-")),
		]); new Table()
			.header(["ID", "Name", "Email", "Team Leader", "Balance"])

			.body(rows)
			.border(true)
			.render();
	});
