import { Confirm } from "@cliffy/prompt/confirm";
import { Input } from "@cliffy/prompt/input";
import { Spinner } from "@std/cli/unstable-spinner";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../../config.ts";
import { navigator } from "../../../navigator.ts";
import { promptForScriptSelection } from "../../../utils/script-selection.ts";

export async function createServerScript(slug: string) {
	const token = await getToken();
	const client = new Webdock(token);
	const spinner = new Spinner();

	const selectedScript = await promptForScriptSelection(client, {
		sourceMessage: "Choose the script source to deploy from:",
		scriptMessage: "Select a script to deploy:",
		includeNone: false,
		includeGoBack: true,
	});

	if (selectedScript === "GO_BACK" || !selectedScript) {
		return navigator.goToServerScripts(slug);
	}

	const path = await Input.prompt({
		message: "Enter deployment path:",
		validate: (value) => value.length > 0 || "Path is required",
		info: true,
	});

	let executable = await Confirm.prompt({
		message: "Make the deployed script executable?",
		default: false,
	});

	let executeImmediately = false;
	if (executable) {
		executeImmediately = await Confirm.prompt({
			message: "Execute immediately after deployment?",
			default: false,
		});
	} else if (
		await Confirm.prompt({
			message: "Enable executable mode so it can run immediately?",
			default: false,
		})
	) {
		executable = true;
		executeImmediately = true;
	}

	console.log("\nDeployment summary:");
	new Table()
		.border()
		.header(["Setting", "Value"])
		.body([
			["Server", slug],
			["Script", `[${selectedScript.source}] ${selectedScript.name} (#${selectedScript.id})`],
			["Path", path],
			["Executable", executable ? "Yes" : "No"],
			["Execute immediately", executeImmediately ? "Yes" : "No"],
		])
		.render();

	const confirmed = await Confirm.prompt({
		message: "Confirm deployment?",
		default: false,
	});

	if (!confirmed) {
		console.log("Deployment cancelled");
		return navigator.goToServerScripts(slug);
	}

	spinner.message = "Deploying script...";
	spinner.start();
	const response = await client.servers.scripts.create({
		scriptId: selectedScript.id,
		path,
		makeScriptExecutable: executable,
		executeImmediately,
		serverSlug: slug,
	});
	spinner.stop();

	if (!response.success) {
		console.error("Deployment failed:", response.error);
		return navigator.goToServerScripts(slug);
	}

	console.log("\nScript deployed successfully.");
	console.log(`Path: ${response.response.body.path}`);
	if (executeImmediately) {
		console.log("Immediate execution has started.");
	}

	return navigator.goToServerScripts(slug);
}
