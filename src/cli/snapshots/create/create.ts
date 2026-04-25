import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapId } from "../../../test_utils.ts";
import { Webdock } from "@webdock/sdk";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const createCommand = new Command()
	.description("Create a snapshot for a server")
	.arguments("<serverSlug:string> <name:string>")
	.option("-t, --token <token:string>", "API token for authentication")
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.option("--wait", "Wait until the operation has finished")
	.action(async (options, serverSlug, username) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.snapshots.create({
			name: username,
			serverSlug,
		});

		if (!response.success) {
			if (response.code == 404) console.error("Error 404 server not found");
			else console.error(response.error);
			Deno.exit(1);
		}

		if (options.wait) {
			const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
			console.log("waitResult", waitResult);

			if (!waitResult.success) {
				console.error(waitResult.error);
				Deno.exit(1);
			}
		}

		if (options.json) {
			console.log(JSON.stringify(response.response));
			return;
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
			const data = response.response.body as unknown as Record<string, unknown>;
			const body = keys.map((key) => data[key]);
			console.log(stringify([body], {
				columns: keys,
				header: true,
			}));

			return;
		}

		const data = response.response;

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
				[
					[
						wrapId(data.body.id),
						data.body.name ?? "",
						data.body.date ?? "",
						data.body.type ?? "",
						data.body.virtualization ?? "",
						data.body.completed ? "YES" : "NO",
						data.body.deletable ? "YES" : "NO",
					],
				],
			)
			.border(true).render();
	});
