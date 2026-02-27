import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { wrapId } from "../../../test_utils.ts";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const getCommand = new Command()
	.name("get")
	.description("Get details of a specific hook")
	.arguments("<id:number>")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication. Required if the endpoint is protected.",
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
		const response = await client.hooks.getById({
			id: id,
		});

		if (!response.success) {
			Deno.exit(1);
		}
		if (options.csv) {
			const csvData: Record<string, unknown> = response.response.body;
			const keys = ["id", "callbackUrl", "filters"];

			// Process array data
			const processedData = keys.reduce((acc: Record<string, unknown>, key) => {
				const value = csvData[key];
				acc[key] = Array.isArray(value) ? value.map((item) => `${item.type}:${item.value}`).join(" ") : value;
				return acc;
			}, {});

			const csvOutput = stringify([processedData], {
				header: true,
				columns: keys,
			});

			console.log(csvOutput.trim());
			return;
		}

		if (options.json) {
			console.log(JSON.stringify(response.response));
			return;
		}

		const table = new Table()
			.header(["ID", "Callback URL", "Filters"])
			.body([
				[
					wrapId(response.response.body.id),
					response.response.body.callbackUrl,
					response.response.body.filters
						? response.response.body.filters.map((f) => `${f.type}:${f.value}`)
							.join("\n")
						: "None",
				],
			])
			.border(true);

		console.log(table.toString());
	});
