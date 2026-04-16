import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapSlug } from "../../../test_utils.ts";
import { Webdock } from "@webdock/sdk";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const createCommand = new Command()
	.description("Create a Server!")
	.arguments("<name:string> <locationId:string> <profileSlug:string>")
	.option("-t, --token <token:string>", "API token used for authentication")
	.option("-i, --imageSlug <imageSlug:string>", "Slug identifier of the server image", { conflicts: ["snapshotId"] })
	.option("-v, --virtualization <virtualization:string>", "Type of virtualization to use",)
	.option("-s, --slug <slug:string>", "Unique Slug for the server")
	.option("-a, --snapshotId <snapshotId:number>", "Optional snapshot ID to restore the server from", { conflicts: ["imageSlug"] })
	.option("--wait", "Wait until the server is fully up and running before exiting",)
	.option("--json", "Display the results in a json format instead of a Table", { conflicts: ["csv"], })
	.option("--userScriptId <userScriptId:string>", "Optional user/account script ID/slug. Retrieve it via GET /account/scripts or from the Scripts page in the dashboard. If provided, the script is deployed to /root/auto-deploy-script and executed once provisioning finishes (after all provisioning actions, including SSL certificate generation). The script is executed from the command line; ensure it has a valid shebang (e.g. #!/bin/bash, #!/usr/bin/env python3) and is self-contained. Use this to auto-deploy software, credentials, or other setup steps.")
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })

	.action(async (options, name, locationId, profileSlug) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);


		if (!options.imageSlug && !options.snapshotId) {
			createCommand.showHelp();
			console.error(
				colors.bold.underline.italic.bgRed(
					"Error: Please provide either '--imageSlug' or '--snapshotId'.",
				),
			);

			Deno.exit(1);
		}

		const response = await client.servers.create({
			name: name,
			slug: options.slug,
			locationId: locationId,
			profileSlug: profileSlug as string,
			virtualization: options.virtualization,
			...(options.imageSlug
				? { imageSlug: options.imageSlug }
				: { snapshotId: options.snapshotId }),
			...(options.userScriptId ? { userScriptId: options.userScriptId } : {}),
		});

		if (!response.success) {
			console.error(response.error);
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
			const keys = ["Slug", "Name", "Location", "IP"];
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
			.header(["Slug", "Name", "Location", "IP"])
			.body([
				[wrapSlug(data.slug), data.name, data.location, data.ipv4 ?? "N/A"],
			])
			.align("center")
			.border()
			.render();
	});
