import { createCommand } from "./create/create.ts";
import { DeleteCommand } from "./delete/delete.ts";
import { listCommand } from "./list/list.ts";
import { Command } from "@cliffy/command";
// Profiles command module
export const profilesCommand = new Command()
	.name("profiles")
	.description("Manage Profiles")
	.default("help")
	.command(
		"help",
		new Command().action(() => {
			profilesCommand.showHelp();
			Deno.exit(1);
		}),
	).hidden()
	.command("delete", DeleteCommand)
	.command("create", createCommand)
	.description("Manage server profiles")
	.command("list", listCommand);
;
