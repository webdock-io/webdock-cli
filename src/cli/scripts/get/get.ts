import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { stringify } from "csv-stringify/sync";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const getCommand = new Command()
	.description("Get an account script by ID")
	.arguments("<id:number>")
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
	.action(async (options, id: number) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.account.scripts.getById({
			scriptId: id,
		});

		if (!response.success) {
			console.error(`Failed to The script with id ${id}`);
			Deno.exit(1);
		}

		if (options.json) {
			console.log(JSON.stringify(response.response));
			return;
		}
		const data = response.response.body;

		if (options.csv) {
			const keys = [
				"id",
				"name",
				"description",
				"filename",
				"content",
			] as const;
			const body = response.response.body as unknown as Record<string, unknown>;

			const csvData = keys.map((key) => {
				if (key == "content") return "[Content Hidden]";
				return body[key] || "N/A";
			});

			console.log(stringify([csvData], {
				columns: keys,
				header: true,
			}));

			return;
		}
		new Table().header([
			"ID",
			"Name",
			"Description",
			"Filename",
			"Content",
		]).body([[
			data.id,
			data.name,
			data.description,
			data.filename,
			data.content.slice(0, 25) + "....",
		]]).border().render();
	});
