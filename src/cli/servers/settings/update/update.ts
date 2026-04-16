import { Command } from "@cliffy/command";
import { getToken } from "../../../../config.ts";
import { Webdock } from "@webdock/sdk";

export const updateserverSettings = new Command()
    .name("server settings")
    .description("Update server settings. Currently supports web root configuration (The directory you specify must already exist on the server), with more settings to be added in the future.")
    .arguments("<serverSlug:string>")
    .option("--wait", "wait for operation to finish")
    .option("--webroot <webroot:string>", "New web root path for the server. The directory you specify must already exist on the server.")
    .option("--updateWebserver <updateWebserver:boolean>", "Whether to update web server configuration when setting web root", { default: true })
    .option("--updateLetsencrypt <updateWebserver:boolean>", "Whether to update Let's Encrypt configuration when setting web root", { default: true })
    .option("-t, --token <token:string>", "API token for authentication")
    .action(async (options, serverSlug) => {
        const token = await getToken(options.token);
        const client = new Webdock(token);
        const response = await client.servers.settings.update({
            serverSlug: serverSlug,
            webroot: String(options.webroot),
            updateLetsencrypt: options.updateLetsencrypt,
            updateWebserver: options.updateWebserver
        })

        if (!response.success) {
            console.error(response.error)
            Deno.exit(1)
        }
        if (options.wait) {
            const callback = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"])
            if (!callback.success) {
                console.error(callback.success)
                Deno.exit(1)
            } console.log("server settings update");


        }
        console.log("server settings update initiated");

    })
