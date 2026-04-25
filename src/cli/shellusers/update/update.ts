import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { wrapId } from "../../../test_utils.ts";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";
export const updateCommand = new Command()
	.name("update")
	.description("Update a shell user's public keys")
	.arguments("<slug:string> <id:number>")
	.option("--wait", "Wait until the operation is done")
	.option(
		"-k, --public-keys <keys:number[]>",
		"Comma-separated list of public key IDs to assign to the user",
		{
			separator: ",",
		},
	)
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.option("-t, --token <token:string>", "API token for authentication")
	.action(async (options, slug, id) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.shellUsers.edit({
			keys: options.publicKeys || [],
			slug: slug,
			id: id,
		});

		if (!response.success) {
			if (response.code == 404) {
				console.error("Error 404 Server or shell user not found");
			}
			if (response.code == 400) console.error(response.error);

			Deno.exit(1);
		}

		if (options.wait) {
			const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
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
			const data = response.response.body as unknown as Record<string, unknown>;
			const keys = [
				"id",
				"username",
				"group",
				"shell",
				"publicKeys",
				"created",
			] as const;
			const body = keys.map((key) => {
				if (key == "publicKeys") {
					return (data[key] as { id: number }[]).map((e) => e.id).join(",");
				}
				return data[key];
			});
			console.log(
				stringify([body], {
					columns: keys,
					header: true,
				}).trim(),
			);

			return;
		}

		const data = response.response.body;
		new Table().header([
			"ID",
			"Username",
			"Group",
			"Shell",
			"Public Keys",
		]).align("center")
			.body([[
				wrapId(data.id),
				data.username,
				data.group,
				data.shell,
				data.publicKeys.map((e) => e.id).join(","),
			]]).border().render();
	});
