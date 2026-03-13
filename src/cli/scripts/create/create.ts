import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapId } from "../../../test_utils.ts";
import { Webdock } from "@webdock/sdk";
import { sanitizePath } from "../../../utils/sanitize-path.ts";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const createCommand = new Command()
	.name("create")
	.description("Create an account script")
	.arguments("<name:string> <filename:string> <content:string>")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication (required for secure endpoints)",
	)
	.option("--json", "Display the results in a json format instead of a Table", {
		conflicts: ["csv"],
	})
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.action(async (options, name, filename, content) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const path = await sanitizePath(filename);
		if (!path) {
			createCommand.showHelp();
			Deno.exit(1);
		}
		const response = await client.account.scripts.create({
			content,
			filename: path,
			name,
		});

		if (!response.success) {
			console.error("Creating Script failed");
			Deno.exit(1);
		}
		if (options.csv) {
			const responseBody: Record<string, unknown> = response.response.body;

			const keys = [
				"id",
				"name",
				"description",
				"filename",
				"content",
			] as const;

			const formatCellValue = (key: string) => {
				if (key === "content") return "[Content Hidden]";

				const rawValue = responseBody[key];
				return rawValue ?? "N/A";
			};

			const csvRow = keys.map(formatCellValue);

			const csvOutput = stringify([csvRow], {
				columns: keys,
				header: true,
			});

			console.log(csvOutput.trim());
			return;
		}
		if (options.json) {
			console.log(JSON.stringify(response.response));
			return;
		}

		const data = response.response.body;
		new Table()
			.header(["ID", "Name", "Description", "Filename", "Content"])
			.body([
				[
					wrapId(data.id),
					data.name,
					data.description,
					data.filename,
					data.content.slice(0, 25) + "....",
				],
			])
			.border()
			.render();
	});
