import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { stringify } from "npm:csv-stringify/sync";
import { getToken } from "../../../config.ts";
import { wrapId, wrapSlug } from "../../../test_utils.ts";

export const listArchivedServersCommand = new Command()
	.name("archived-servers")
	.description("List archived servers")
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
		const response = await client.account.listArchivedServers();

		if (!response.success) {
			Deno.exit(1);
		}

		if (options.csv) {
			const csvObject: Record<string, unknown> = response.response.body[0] ?? {};
			const keys = Object.keys(csvObject);

			if (keys.length === 0) {
				console.log("");
				return;
			}

			console.log(
				stringify([keys.map((key) => csvObject[key])], {
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
		]);

		new Table()
			.header(["ID", "Callback ID", "Completed", "Deletable", "Name", "Virtualization", "Type", "Server Slug"])
			.body(rows)
			.border(true)
			.render();
	});
