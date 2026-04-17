import { Command } from "@cliffy/command";
import { updateserverIdentity } from "./update/update.ts";

export const serverIdentity = new Command()
	.name("server identity")
	.description("Manage server identity.")
	.default("help")
	.command(
		"-h, help",
		new Command().description("get help").action(() => {
			serverIdentity.showHelp();
		}),
	)
	.command("update", updateserverIdentity);
