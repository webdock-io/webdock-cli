import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { stringify } from "npm:csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const infoCommand = new Command()
	.name("Account Info!")
	.description("Get account information")
	.option(
		"-t, --token <token:string>",
		"API token used for authenticating requests. Required for secure access. Make sure to provide a valid token string.",
	)
	.option("--json", "Display the results in a json format instead of a Table", {
		conflicts: ["csv"],
	})
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.action(async (options) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.account.info();

		if (!response.success) {
			Deno.exit(1);
		}

		if (options.csv) {
			const cvsObject: Record<string, unknown> = response.response.body;
			const keys = Object.keys(cvsObject);

			console.log(
				stringify([keys.map((key) => cvsObject[key])], {
					columns: keys,
					header: true,
				}),
			);
			return;
		}

		if (options.json) {
			console.log(JSON.stringify(response.response));
			return;
		}

		const user = response.response.body;
		new Table()
			.header(["ID", "Name", "Email", "Team Leader", "Balance"])
			.body([
				[
					user.userId.toString(),
					user.userName,
					user.userEmail.toString(),
					user.teamLeader,
					user.accountBalance,
				],
			])
			.border(true)
			.render();
	});
