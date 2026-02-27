import { Command } from "@cliffy/command";
import { saveConfig, getConfigPath } from "../config.ts";

export const initCommand = new Command()
	.name("init")
	.description("Initialize the CLI with your API token")
	.option("-t, --token <token:string>", "API token for authentication", {
		required: true,
	})
	.action(async (options) => {
		await saveConfig({ token: options.token });
		const configPath = getConfigPath();
		console.log(`Configuration has been stored at: ${configPath}`);
	});
