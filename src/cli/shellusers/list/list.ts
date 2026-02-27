import { stringify } from "csv-stringify/sync";
import { wrapId } from "../../../test_utils.ts";
import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const listCommand = new Command()
	.name("list")
	.arguments("<slug:string>")
	.description("List shell users for a server")
	.option("-t, --token <token:string>", "API token for authentication")
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.action(async (options, serverSlug) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.shellUsers.list({
			serverSlug,
		});

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}

		if (options.json) {
			console.log(JSON.stringify(response.response));
			Deno.exit(0);
		}

		if (options.csv) {
			const data = response.response.body as unknown as Record<string, unknown>[];
			const keys = [
				"id",
				"username",
				"group",
				"shell",
				"publicKeys",
				"created",
			] as const;
			const body = data.map((item) => {
				console.log(item);

				return keys.map((key) => {
					if (key == "publicKeys") {
						return (item[key] as { id: number }[]).map((e) => e.id).join(",");
					}
					return item[key];
				});
			});
			console.log(
				stringify(body, {
					columns: keys,
					header: true,
				}).trim(),
			);

			return;
		}
		new Table()
			.header([
				"ID",
				"Username",
				"Group",
				"Shell",
				"Created",
				"Public Keys",
			])
			.body(
				response.response.body.map((user) => [
					wrapId(user.id),
					user.username,
					user.group,
					user.shell,
					user.created,
					user.publicKeys ? user.publicKeys.length : 0,
				]),
			)
			.border(true).render();
	});
