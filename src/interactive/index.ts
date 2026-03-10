import { Webdock } from "@webdock/sdk";
import { getToken } from "../config.ts";
import { Select } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { InteractiveModeLogHelp } from "./help.ts";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "./navigator.ts";

export async function main() {
	const token = await getToken();
	const client = new Webdock(token);
	const response = await client.account.info();

	if (!response.success) {
		console.error(
			colors.red("✖ Invalid token: Please double-check your credentials"),
		);
		Deno.exit(1);
	}
	console.log("\n");

	new Table()
		.body([
			["Name", colors.yellow(response.response.body.userName)],
			["Email", colors.cyan(response.response.body.userEmail)],
			[
				colors.bold(colors.magenta("Balance:")),
				colors.red(
					`${response.response.body.accountBalanceRaw} ${response.response.body.accountBalanceCurrency}`,
				),
			],
		])
		.border()
		.render();

	const command = await Select.prompt({
		message: "What would you like to do?",
		options: [
			{
				value: "CREATE_SERVER",
				name: "1. New Server",
			},
			{
				value: "LIST_SERVERS",
				name: "2. List and Manage Servers",
			},
			{
				value: "KEYS",
				name: "3. Manage SSH Keys",
			},
			{
				value: "HOOKS",
				name: "4. Manage WebHooks",
			},
			{
				value: "SCRIPTS",
				name: "5. Manage Scripts",
			},
			{
				name: "6. Show Help!",
				value: "HELP",
			},
			{
				name: "7. Exit",
				value: "EXIT",
			},
		],
	});

	switch (command) {
		case "CREATE_SERVER":
			await navigator.runCreateServer();
			break;
		case "LIST_SERVERS":
			await navigator.goToServerList();
			break;
		case "KEYS":
			await navigator.goToKeysMenu();
			break;
		case "HOOKS":
			await navigator.goToHooksMenu();
			break;
		case "SCRIPTS":
			await navigator.goToScriptsMenu();
			break;
		case "HELP":
			InteractiveModeLogHelp();
			break;
		case "EXIT":
			console.log("hasta la vista 👋");
			Deno.exit(0);
	}
}
