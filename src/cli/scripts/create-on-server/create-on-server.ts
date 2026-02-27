import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapId } from "../../../test_utils.ts";
import { Webdock } from "@webdock/sdk";
import { sanitizePath } from "../../../utils/sanitize-path.ts";
import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

// Add Deno namespace declaration
declare namespace Deno {
	export function exit(code: number): never;
	export function cwd(): string;
}

export const serverScriptsCreateCommand = new Command()
	.description("Create a script on a server")
	.arguments("<serverSlug:string> <scriptId:number> <path:file>")
	.option(
		"-t, --token <token:string>",
		"API token used for authentication (required for secure endpoints)",
	)
	.option(
		"--json",
		"Display the results in a json format instead of a Table",
		{ conflicts: ["csv"] },
	)
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.option(
		"-x, --executable",
		"Make the deployed script executable",
		{
			default: false,
		},
	)
	.option(
		"-i, --executeImmediately",
		"Run the script immediately after deployment. Requires the script to be marked as executable",
		{
			default: false,
		},
	)
	.action(
		async (options, serverSlug: string, scriptId: number, path) => {
			const token = await getToken(options.token);
			const client = new Webdock(token);
			const sanitizedPath = await sanitizePath(path);
			if (!sanitizedPath) {
				serverScriptsCreateCommand.showHelp();
				return;
			}

			const response = await client.scripts.createOnServer({
				scriptId: scriptId,
				path: sanitizedPath,
				makeScriptExecutable: options.executable,
				executeImmediately: options.executeImmediately,
				serverSlug,
			});

			if (!response.success) {
				if (response.code == 404) {
					console.error("Error 404 script or server not found!");
				}

				Deno.exit(1);
			}

			if (options.json) {
				console.log(JSON.stringify(response.response));
				return;
			}

			if (options.csv) {
				const data = response.response.body as unknown as Record<string, unknown>;

				const keys = [
					"id",
					"name",
					"description",
					"filename",
					"content",
				] as const;

				const body = keys.map((key) => data[key]);
				console.log(stringify([body], {
					columns: keys,
					header: true,
				}));
				return;
			}

			const data = response.response.body;

			new Table().header([
				"ID",
				"Name",
				"Path",
				"Last Run",
				"Last Run Callback ID",
				"Created",
			]).body(
				[[
					wrapId(data.id),
					data.name,
					data.path,
					data.lastRun ?? "",
					data.lastRunCallbackId ?? "",
					data.created,
				]],
			).border().render();
		},
	);
