import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapId } from "../../../test_utils.ts";
import { stringify } from "csv-stringify/sync";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const listCommand = new Command()
	.description("List all snapshots for a server")
	.arguments("<serverSlug:string>")
	.option(
		"-t, --token <token:string>",
		"API token for authentication",
	)
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.action(async (options, serverSlug) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.snapshots.list({
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
			const keys = [
				"id",
				"name",
				"date",
				"type",
				"virtualization",
				"completed",
				"deletable",
			] as const;
			const data = response.response.body as unknown as Record<string, unknown>[];
			const body = data.map((item) => {
				return keys.map((key) => item[key] || "N/A");
			});
			console.log(stringify(body, {
				columns: keys,
				header: true,
			}));

			return;
		}
		new Table()
			.header([
				"ID",
				"Name",
				"Created",
				"Type",
				"Virtualization",
				"Completed",
				"Deletable",
			])
			.body(
				response.response.body.map((snapshot) => [
					wrapId(snapshot.id),
					snapshot.name,
					snapshot.date,
					snapshot.type,
					snapshot.virtualization,
					snapshot.completed ? "YES" : "NO",
					snapshot.deletable ? "YES" : "NO",
				]),
			)
			.border(true).render();
	});
