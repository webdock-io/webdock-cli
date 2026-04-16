import { createCommand } from "./create/create.ts";
import { deleteCommand } from "./delete/delete.ts";
import { fetchFileCommand } from "./fetch-file/fetch-file.ts";
import { getCommand } from "./get/get.ts";
import { listCommand } from "./list/list.ts";
import { metricsCommand } from "./metrics/metrics.ts";
import { rebootCommand } from "./reboot/reboot.ts";
import { reinstallCommand } from "./reinstall/reinstall.ts";
import { resizeDryRunCommand } from "./resize-dryrun/resize-dryrun.ts";
import { resizeCommand } from "./resize/resize.ts";
import { startCommand } from "./start/start.ts";
import { stopCommand } from "./stop/stop.ts";
import { archiveCommand } from "./archive/archive.ts";
import { updateCommand } from "./update/update.ts";
import { Command } from "@cliffy/command";
import { uncancelCommand } from "./uncancel/uncancel.ts";
import { serverSettings } from "./settings/mod.ts";
import { serverIdentity } from "./identity/mod.ts";

export const serversCommand = new Command()
	.name("servers")
	.description("Manage servers").default("help")
	.command(
		"help",
		new Command().action(() => {
			serversCommand.showHelp();
			Deno.exit(1);
		}),
	).hidden()
	.command("identity", serverIdentity)
	.command("settings", serverSettings)
	.command("list", listCommand)
	.command("get", getCommand)
	.command("create", createCommand)
	.command("delete", deleteCommand)
	.command("update", updateCommand)
	.command("start", startCommand)
	.command("stop", stopCommand)
	.command("reboot", rebootCommand)
	.command("uncancel", uncancelCommand)
	.command("reinstall", reinstallCommand)
	.command("resize", resizeCommand)
	.command("metrics", metricsCommand)
	.command("archive", archiveCommand)
	.command("resize-dryrun", resizeDryRunCommand)
	.command("fetch-file", fetchFileCommand);
