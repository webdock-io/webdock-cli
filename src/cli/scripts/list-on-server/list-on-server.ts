import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapId } from "../../../test_utils.ts";
import { stringify } from "csv-stringify/sync";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const serverScriptsListCommand = new Command()
	.description("List scripts for a server")
	.arguments("<serverSlug:string>")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication (required for secure access)",
	)
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.action(async (options, serverSlug: string) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.servers.scripts.listOnServer({
			serverSlug: serverSlug,
		});

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}

		if (options.csv) {
			const keys = [
				"id",
				"name",
				"description",
				"filename",
				"content",
			] as const;
			const cvsData = response.response.body as unknown as Record<
				string,
				unknown
			>[];
			const data = cvsData.map((item) => {
				return keys.map((key) => {
					if (key == "content") return "[Content Hidden]";
					return item[key] || "N/A";
				});
			});
			console.log(stringify(data, { columns: keys, header: true }));
			return;
		}
		if (options.json) {
			console.log(JSON.stringify(response.response));
			return;
		}
		new Table()
			.header([
				"ID",
				"Name",
				"Path",
				"Last Run",
				"Last Run Callback ID",
				"Created",
			])
			.body(
				response.response.body.map((data) => [
					wrapId(data.id),
					data.name,
					data.path,
					data.lastRun ? new Date(data.lastRun).toLocaleString() : "Never",
					data.lastRunCallbackId ?? "N/A",
					new Date(data.created).toLocaleString(),
				]),
			)
			.border(true)
			.padding(1)
			.indent(2)
			.render();
	});
