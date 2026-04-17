import { join } from "@std/path";
import { dirname } from "@std/path";

export function getConfigDir(): string {
	const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || ".";
	Deno.mkdirSync(join(homeDir, ".webdock-cli"), { recursive: true });
	return join(homeDir, ".webdock-cli");
}

export function getConfigPath(): string {
	return join(getConfigDir(), "config.json");
}
async function pathExists(path: string): Promise<boolean> {
	try {
		await Deno.stat(path);
		return true;
	} catch {
		return false;
	}
}

export async function saveConfig(config: { token?: string }): Promise<void> {
	const configPath = getConfigPath();
	const configDir = dirname(configPath);

	try {
		await Deno.mkdir(configDir, { recursive: true });
		await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));
	} catch (error) {
		console.error(`Error saving config: ${error instanceof Error ? error.message : String(error)}`);
		Deno.exit(1);
	}
}

export async function getToken(tokenFromArg?: string): Promise<string> {
	if (tokenFromArg) {
		return tokenFromArg;
	}

	const configPath = getConfigPath();
	if (await pathExists(configPath)) {
		try {
			const configContent = await Deno.readTextFile(configPath);
			const config = JSON.parse(configContent);
			if (config.token) {
				return config.token;
			}
		} catch (error) {
			console.error("Error loading config:", error instanceof Error ? error.message : String(error));
		}
	}

	console.error("Error: API token is required. Use --token <your-token> or run 'webdock init' to configure.");
	Deno.exit(1);
}
