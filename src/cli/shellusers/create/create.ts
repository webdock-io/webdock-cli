import { wrapId } from "../../../test_utils.ts";
import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const createCommand = new Command()
	.name("create")
	.description("Create a new shell user on a server")
	.arguments("<slug:string> <username:string> <password:string>")
	.option("-t, --token <token:string>", "API token for authentication")
	.option("--wait", "Wait until the operation is finished")
	.option("-s, --shell <shell:string>", "", { default: "/bin/bash" })
	.option("-g, --group <group:string>", "", { default: "sudo" })
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
	.action(async (options, serverSlug, username, password) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.shellUsers.create({
			username: username,
			password: password,
			group: options.group,
			shell: options.shell,
			publicKeys: options.publicKeys ?? [],
			serverSlug,
		});

		if (!response.success) {
			if (response.code == 404) console.error("Error 404 Server Not found");
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

		const data = response.response.body;

		if (options.csv) {
			const csvData = response.response.body as unknown as Record<string, unknown>;
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
					return (csvData[key] as { id: number }[]).map((e) => e.id).join(",");
				}
				return csvData[key];
			});
			console.log(
				stringify([body], {
					columns: keys,
					header: true,
				}).trim(),
			);

			return;
		}
		new Table().header([
			"ID",
			"Username",
			"Group",
			"Shell",
			"Public Keys",
			"Created",
		]).align("center").body([
			[
				wrapId(data.id),
				data.username,
				data.group,
				data.shell,
				data.publicKeys.join(", "),
				data.created,
			],
		]).border().render();
	});
