import { Command } from "@cliffy/command";
import { renewServerSslCommand } from "./update/update.ts";

export const serverSsl = new Command()
	.name("server ssl")
	.description("Manage server SSL.")
	.default("help")
	.command(
		"-h, help",
		new Command().description("get help").action(() => {
			serverSsl.showHelp();
		}),
	)
	.command("update", renewServerSslCommand);
