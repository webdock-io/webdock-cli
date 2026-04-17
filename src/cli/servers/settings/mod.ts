import { Command } from "@cliffy/command";
import { updateserverSettings } from "./update/update.ts";

export const serverSettings = new Command()
	.name("server settings")
	.description("Manage server settings.")
	.default("help")
	.command(
		"-h, help",
		new Command().description("get help").action(() => {
			serverSettings.showHelp();
		}),
	)
	.command("update", updateserverSettings);
