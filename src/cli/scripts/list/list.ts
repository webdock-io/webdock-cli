import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapId } from "../../../test_utils.ts";
import { Webdock } from "@webdock/sdk";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const listCommand = new Command()
	.name("list")
	.description("List all scripts")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication (required for secure endpoints)",
	)
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.action(async (options) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);

		const response = await client.scripts.list();
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
			Deno.exit(0);
		}

		new Table()
			.header(["ID", "Name", "Description", "Filename", "Content"])
			.body(
				response.response.body.map((script) => [
					wrapId(script.id),
					script.name,
					script.description || "N/A",
					script.filename || "N/A",
					JSON.stringify(String((script.content.split("\n")[0] ?? "").slice(0, 25) ?? "").padEnd(25, "\s")),
				]),
			)
			.border(true).render();
	});
