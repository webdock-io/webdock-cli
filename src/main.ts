#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-net --allow-sys --allow-run


import { Command } from "@cliffy/command";
import { accountCommand } from "./cli/account/mod.ts";
import { eventsCommand } from "./cli/events/mod.ts";
import { hooksCommand } from "./cli/hooks/mod.ts";
import { imagesCommand } from "./cli/images/mod.ts";
import { initCommand } from "./cli/init.ts";
import { locationsCommand } from "./cli/locations/mod.ts";
import { profilesCommand } from "./cli/profiles/mod.ts";
import { scriptsCommand } from "./cli/scripts/mod.ts";
import { serversCommand } from "./cli/servers/mod.ts";
import { shellusersCommand } from "./cli/shellusers/mod.ts";
import { snapshotsCommand } from "./cli/snapshots/mod.ts";
import { sshkeysCommand } from "./cli/sshkeys/mod.ts";
import { main } from "./interactive/index.ts";
import { eventTypeEnum } from "./cli/event-types.ts";
import { updateCommand } from "./cli/update.ts";


export const cli = new Command()
  .name("webdock")
  .version("v1.0.2")
  .globalType("event-type", eventTypeEnum)

  .description("Webdock CLI - A command-line interface for the Webdock API")
  .default("it")
  .command(
    "help",
    new Command().action(() => {
      cli.showHelp();
    })
  )
  .hidden()
  .command(
    "it",
    new Command().action(() => main())
  )
  .hidden()
  .command("init", initCommand)
  .command("servers", serversCommand)
  .command("locations", locationsCommand)
  .command("images", imagesCommand)
  .command("profiles", profilesCommand)
  .command("scripts", scriptsCommand)
  .command("snapshots", snapshotsCommand)
  .command("sshkeys", sshkeysCommand)
  .command("events", eventsCommand)
  .command("account", accountCommand)
  .command("shellusers", shellusersCommand)
  .command("hooks", hooksCommand)
  .command("update", updateCommand);

await cli.parse(Deno.args);
