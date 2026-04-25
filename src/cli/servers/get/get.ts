import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { wrapSlug } from "../../../test_utils.ts";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const getCommand = new Command()
	.name("get")
	.description("Get details of a specific server")
	.arguments("<slug:string>")
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
	.action(async (options, slug) => {
		const token = await getToken(options.token);
		// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
		const client = new Webdock({ token: token, secret_dev_client: "cli" });
		const response = await client.servers.getBySlug({
			serverSlang: slug,
		});

		if (!response.success) {
			Deno.exit(1);
		}

		if (options.json) {
			console.log(JSON.stringify(response.response));
			return;
		}

		if (options.csv) {
			const keys = ["slug", "name", "location", "status", "ipv4"];
			const data = response.response.body as unknown as Record<string, unknown>;
			const body = keys.map((key) => data[key]);
			console.log(stringify([body], {
				columns: keys,
				header: true,
			}));
			return;
		}

		new Table()
			.header(["Slug", "Name", "Location", "Status", "IP"])
			.body([
				[
					wrapSlug(response.response.body.slug),
					response.response.body.name,
					response.response.body.location,
					response.response.body.status,
					response.response.body.ipv4 ?? "",
				],
			])
			.border(true).render();
	});
