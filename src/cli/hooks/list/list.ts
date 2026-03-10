import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { wrapId } from "../../../test_utils.ts";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

type HookFilter = { type: string; value: string };

export const listCommand = new Command()
	.name("list")
	.description("List event hooks registered in the system")
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
	.action(async (options) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.hooks.list();
		if (!response.success) {
			Deno.exit(1);
		}

		if (options.json) {
			console.log(response.response.body);
			return;
		}
		if (options.csv) {
			const keys = ["id", "callbackUrl", "filters"];

			const data = response.response.body.map((item) => {
				const cvsData: Record<string, unknown> = item;
				return keys.map((e) => {
					if (typeof cvsData[e] != "object") return cvsData[e];
					// else mean this is an array HookFilter
					const arr = cvsData[e] as HookFilter[];
					return arr.map((item) => `${item.type}:${item.value}`).join(" ");
				});
			});
			console.log(stringify(data, { columns: keys, header: true }));

			return;
		}

		new Table()
			.header(["ID", "Callback URL", "Filters"])
			.body(
				response.response.body.map((hook) => [
					wrapId(hook.id),
					hook.callbackUrl,
					hook.filters ? hook.filters.map((f) => `${f.type}:${f.value}`).join("\n") : "None",
				]),
			)
			.border(true).render();
	});
