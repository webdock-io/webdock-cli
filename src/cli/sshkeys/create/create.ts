import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapId } from "../../../test_utils.ts";
import { Webdock } from "@webdock/sdk";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const createCommand = new Command()
	.description("Add a new SSH key")
	.arguments("<name:string> <key:string>")
	.option("-t, --token <token:string>", "API token for authentication")
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] }).action(
		async (options, name: string, publicKey: string) => {
			const token = await getToken(options.token);
			const client = new Webdock(token);
			const response = await client.sshkeys.create({
				name,
				publicKey,
			});

			if (!response.success) {
				console.error(response.error);
				Deno.exit(1);
			}
			if (options.json) {
				console.log(JSON.stringify(response.response));
				return;
			}
			if (options.csv) {
				const keys = ["id", "name", "key", "created"] as const;
				const res = response.response.body as unknown as Record<string, unknown>;
				const data = keys.map((key) => {
					if (key == "key") return "[Key Hidden]";
					return res[key];
				});
				console.log(stringify([data], {
					columns: keys,
					header: true,
				}));
				return;
			}

			const data = response.response.body;
			new Table().header(["ID", "Name", "Key", "Created"]).body([
				[
					wrapId(data.id),
					data.name,
					data.key.slice(0, 20) + "....",
					data.created,
				],
			]).border().render();
		},
	);
