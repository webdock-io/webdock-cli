import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { formatServerOption } from "../../utils/format-server-options.ts";
import { Select } from "@cliffy/prompt/select";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "../../navigator.ts";

export async function serverListScreen() {
	const spinner = new Spinner();
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	spinner.message = "🔍 Loading server list...";
	spinner.start();

	const response = await client.servers.list();
	spinner.stop();

	if (!response.success) {
		console.error("❌ Failed to load servers:", response.error);
		return navigator.goToMain();
	}

	if (response.response.body.length == 0) {
		console.log(colors.bgRed("No Server were found!"));
		return navigator.goToMain();
	}

	const options = getServerOptions(response.response.body);

	if (options.length === 0) {
		console.log("ℹ️  No servers found. Create one first!");
		return navigator.goToMain();
	}

	const serverChoice = await Select.prompt({
		message: "Select a server to manage:",
		options: options.concat(goBackOption),
	});

	if (isGoBack(serverChoice)) return navigator.goToMain();

	console.log("\n✅ Selected server:", serverChoice);
	await navigator.goToServerActions(serverChoice);
}

export function getServerOptions(servers: { status: string; name: string; slug: string; ipv4: string | null; location: string; profile: string; date: string }[]) {
	const activeServers = servers.filter((server) => server.status !== "suspended");
	const formattedServers = activeServers.map(formatServerOption);
	return [...formattedServers];
}
