import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapSlug } from "../../../test_utils.ts";
import { Webdock } from "@webdock/sdk";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const updateCommand = new Command()
	.description("Update server metadata")
	.arguments(
		"<serverSlug:string> <name:string> <description:string> <notes:string> <nextActionDate:string>",
	)
	.option("-t, --token <token:string>", "API token for authentication")
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] }).action(
		async (
			options,
			serverSlug,
			name,
			description,
			notes,
			nextActionDate,
		) => {
			const token = await getToken(options.token);
			// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
			const client = new Webdock({ token: token, secret_dev_client: "cli" });
			const response = await client.servers.update({
				nextActionDate,
				name,
				description,
				notes,
				serverSlug,
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
				const keys = ["slug", "name", "location", "ipv4"];
				const data = response.response.body as unknown as Record<string, unknown>;
				const body = keys.map((key) => {
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
			new Table()
				.header([
					"Slug",
					"Name",
					"Location",
					"IP",
					"Description",
					"Notes",
					"Next Action Date",
				])
				.body([
					[
						wrapSlug(data.slug),
						data.name,
						data.location,
						data.ipv4 ?? "N/A",
						data.description.slice(0, 30),
						data.nextActionDate,
					],
				]).align("center").border().render();
		},
	);
