import { listArchivedServersCommand } from "./archived-servers/list-archived-servers.ts";
import { infoCommand } from "./info/info.ts";
import { Command } from "@cliffy/command";

export const accountCommand = new Command()
	.name("account")
	.description("Manage account information")
	.default("help")
	.command(
		"help",
		new Command().action(() => {
			accountCommand.showHelp();
			Deno.exit(1);
		}),
	).hidden()
	.command("list_archived_server", listArchivedServersCommand)
	.command("info", infoCommand);

