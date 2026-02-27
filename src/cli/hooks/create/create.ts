import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { z } from "zod";
import { colors } from "@cliffy/ansi/colors";
import { Webdock } from "@webdock/sdk";
import { wrapId } from "../../../test_utils.ts";
import { stringify } from "csv-stringify/sync";
import { eventTypeEnum } from "../../event-types.ts";
import { getToken } from "../../../config.ts";

export const createCommand = new Command()
	.name("create")
	.description("Create a new event hook")
	.type("event-type", eventTypeEnum)
	.arguments("<callbackUrl:string>")
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.option(
		"-i, --callback-id <id:number>",
		"Optional ID for the callback. Used to update or identify specific callbacks",
	)
	.option(
		"-t, --token <token:string>",
		"API token used for authentication. Required for protected endpoints",
	)
	.option(
		"-e, --event-type <eventType:event-type>",
		"Optional event type to filter or associate with the callback",
	)
	.action(async (options, callbackUrl: string) => {
		if (z.string().url().safeParse(callbackUrl).error) {
			console.log(colors.bgRed(callbackUrl + " is an Invalid URL"));
			createCommand.showHelp();
			Deno.exit(1);
		}
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.hooks.create({
			callbackUrl: callbackUrl,
			callbackId: options.callbackId,
			eventType: options.eventType as unknown as string,
		});

		if (!response.success) {
			console.error(response.error);
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

		const data = response.response.body;

		const table = new Table().header(["ID", "Callback URL", "Filters"]).body([
			[
				wrapId(data.id),
				data.callbackUrl,
				data.filters.map((item) => `${item.type}: ${item.value}`).join("\n"),
			],
		]).border().toString();

		console.log(table);
		Deno.exit(0);
	});
