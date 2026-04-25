import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import serverActionsOptions from "../../utils/server-actions-options.ts";
import { Select } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "../../navigator.ts";

export async function serverActionsScreen(slug: string) {
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });

	const response = await client.servers.getBySlug({ serverSlang: slug });

	if (!response.success) {
		console.error(colors.red("Failed to connect to server:"), response.error);
		Deno.exit(1);
	}

	console.log(
		colors.bgBlue.white(`MANAGING SERVER: ${response.response.body.name} `),
	);
	console.log(colors.italic(`Status: ${response.response.body.status} ${response.response.body.status === "running" ? "🟢" : "🔴"}`));
	console.log(colors.italic(`IP: ${response.response.body.ipv4}\n`));
	const status = response.response.body.status;

	const actionRequirements: Record<string, string> = {
		START: "stopped",
		STOP: "running",
	};

	const action = await Select.prompt({
		message: "Choose an action:",
		options: serverActionsOptions.map((item, idx) => {
			const requiredStatus = actionRequirements[item.value];
			const isDisabled = requiredStatus !== undefined && status !== requiredStatus;

			return {
				...item,
				name: isDisabled
					? `${String(idx + 1).padStart(2, "0")}. ${colors.red("✗")} ${colors.dim(item.name)} ${colors.brightRed(`(The server must be ${requiredStatus})`)}`
					: `${String(idx + 1).padStart(2, "0")}. ${item.name}`,
				disabled: isDisabled,
			};
		}),
		maxRows: 20,
	});

	if (action === "EXIT") {
		return navigator.goToServerList();
	}

	switch (action) {
		case "REBOOT":
			await navigator.runReboot(slug);
			break;
		case "FETCH":
			await navigator.runFetchFile(slug);
			break;
		case "IDENTITY":
			await navigator.runUpdateServerIdentity(slug);
			break;
		case "SSL":
			await navigator.runRenewServerSsl(slug);
			break;
		case "SETTINGS":
			await navigator.runUpdateServerSettings(slug);
			break;
		case "METRICS":
			await navigator.runMetrics(slug);
			break;
		case "STOP":
			await navigator.runStop(slug);
			break;
		case "START":
			await navigator.runStart(slug);
			break;
		case "DELETE":
			await navigator.runDeleteServer(slug);
			break;
		case "REINSTALL":
			await navigator.runReinstall(slug);
			break;
		case "RESIZE":
			await navigator.runResize(slug);
			break;
		case "ARCHIVE":
			await navigator.runArchive(slug);
			break;
		case "UNCANCEL":
			await navigator.runUncancelDelete(slug);
			break;
		case "SHELL":
			await navigator.goToShellUsersMenu(slug);
			break;
		case "SNAPSHOTS":
			await navigator.goToSnapshotsMenu(slug);
			break;
		case "SCRIPTS":
			await navigator.goToServerScripts(slug);
			break;
		default:
			console.error("Unknown action:", action);
			Deno.exit(1);
	}
}
