import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { stringify } from "csv-stringify/sync";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const listCommand = new Command()
	.description("List all locations")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication (required for protected endpoints)",
	)
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.action(async (options) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.location.list();

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}

		if (!response) {
			console.log("No locations found.");
			Deno.exit(0);
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
			console.log(stringify(csvData, { columns: keys, header: true }));

			Deno.exit(0);
		}
		if (options.json) {
			console.log(JSON.stringify(response.response));
			return;
		}
		// Display in table format if --table flag is used
		const table = new Table()
			.header(["ID", "Name", "Country", "City"])
			.body(
				response.response.body.map((location) => [
					location.id,
					location.name,
					location.country || "N/A",
					location.city || "N/A",
				]),
			)
			.border(true);

		console.log(table.toString());
	});
