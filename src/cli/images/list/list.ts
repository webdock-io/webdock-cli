import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const listCommand = new Command()
	.description("List all images")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication. Required if the endpoint is secured",
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
		const response = await client.images.list();
		if (!response.success) {
			Deno.exit(1);
		}

		if (options.csv) {
			const keys = Object.keys(response.response.body[0]);

			const csvData = response.response.body.reduce(
				(acc: unknown[], item: Record<string, unknown>) => {
					acc.push(keys.map((key) => item[key] ?? "N/A"));
					return acc;
				},
				[],
			);

			console.log(stringify(csvData, {
				columns: keys,
				header: true,
			}));

			Deno.exit(0);
		}

		if (options.json) {
			console.log(JSON.stringify(response.response));
			Deno.exit(0);
		}

		const table = new Table()
			.header(["Slug", "Name", "Type", "phpVersion"])
			.body(
				response.response.body.map((image) => [
					image.slug,
					image.name,
					image.webServer || "N/A",
					image.phpVersion || "N/A",
				]),
			)
			.border(true);

		console.log(table.toString());
	});
