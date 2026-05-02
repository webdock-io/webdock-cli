import { Command } from "@cliffy/command";
import { Spinner } from "@std/cli/unstable-spinner";
import { cli } from "../main.ts";
import { colors } from "@cliffy/ansi/colors";
import { Table } from "@cliffy/table";

function getInstallCommand(os: string): string {
	switch (os) {
		case "linux":
			return "curl -fsSL 'https://cli-src.webdock.tech/install/linux.sh' | sudo bash";
		case "windows":
			return (
				"irm 'https://cli-src.webdock.tech/install/windows.ps1' | iex" +
				new Table()
					.body([
						[
							colors.bgRed(
								"\nYou must start a Powershell in Administrator Mode ",
							),
						],
					])
					.align("center")
					.toString()
			);
		case "darwin":
			return "curl -fsSL 'https://cli-src.webdock.tech/install/mac.sh' | sudo bash";
		default:
			return "";
	}
}

import { compare, parse } from "@std/semver";

export const updateCommand = new Command()
	.description("Check for CLI updates")
	.action(async () => {
		const spinner = new Spinner({ message: "Checking for updates..." });
		spinner.start();

		try {
			const res = await fetch(
				"https://github.com/webdock-io/webdock-cli/releases/latest",
			);
			spinner.stop();

			const latestVersion = res.url.split("/").at(-1) ?? "";
			const currentVersion = cli.getVersion() ?? "";
			const comparison = compare(parse(currentVersion), parse(latestVersion));

			if (comparison < 0) {
				console.log(`Update available: ${currentVersion} → ${latestVersion}`);
				console.log(`Run: ${getInstallCommand(Deno.build.os)}`);
			} else {
				console.log(`Already up to date: ${currentVersion}`);
			}
		} catch {
			spinner.stop();
			console.error("Failed to check for updates.");
			console.error("Please visit the GitHub releases page and install the latest Webdock CLI version:");
			console.error(">> https://github.com/webdock-io/webdock-cli");
		}
	});
