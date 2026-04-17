import { createCommand } from "./create/create.ts";
import { deleteCommand } from "./delete/delete.ts";
import { listCommand } from "./list/list.ts";
import { updateCommand } from "./update/update.ts";
import { websshTokenCommand } from "./webssh-token.ts";
import { Command } from "@cliffy/command";
// Shell Users command module
export const shellusersCommand = new Command()
	.name("shellusers")
	.description("Manage ShellUsers")
	.default("help")
	.command(
		"help",
		new Command().action(() => {
			shellusersCommand.showHelp();
			Deno.exit(1);
		}),
	)
	.hidden()
	.description("Manage server shell users")
	.command("list", listCommand)
	.command("create", createCommand)
	.command("delete", deleteCommand)
	.command("update", updateCommand)
	.command("webssh-token", websshTokenCommand);
