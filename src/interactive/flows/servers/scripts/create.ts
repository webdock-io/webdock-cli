import { Confirm } from "@cliffy/prompt/confirm";
import { Input } from "@cliffy/prompt/input";
import { Select } from "@cliffy/prompt/select";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../../config.ts";
import { Table } from "@cliffy/table";
import { Spinner } from "@std/cli/unstable-spinner";
import { navigator } from "../../../navigator.ts";

export async function createServerScript(slug: string) {
	const token = await getToken();
	const client = new Webdock(token);
	console.log("🚀 Starting server script deployment workflow");

	const spinner = new Spinner();
	spinner.message = "Loading available scripts...";
	spinner.start();
	// const response = await client.webdock.listScripts()
	// if (!response.success) {
	// 	console.error(
	// 		"\n❌ Failed to load scripts:",
	// 		response.error || "Unknown error",
	// 	);
	// 	return navigator.goToServerScripts(slug);
	// }
	const accountScripts = await client.account.scripts.list()
	spinner.stop();

	if (!accountScripts.success) {
		console.error(
			"\n❌ Failed to load scripts:",
			accountScripts.error || "Unknown error",
		);
		return navigator.goToServerScripts(slug);
	}



	if (accountScripts.response.body.length === 0) {
		console.log("\n📭 No scripts available. Create one first!");
		return navigator.goToServerScripts(slug);
	}

	const script = await Select.prompt<typeof accountScripts.response.body[0]>({
		message: "Select a script to deploy:",
		options: [

			// ...(accountScripts.response.body.length != 0 ? [Select.separator("----- Account Scripts -----")] : []),
			...accountScripts.response.body.map((script) => ({
				value: script,
				name: `📜 ${script.name} (ID: ${script.id})`,
			})),
			// Select.separator("----- Webdock offical Scripts -----"),
			// ...response.response.body.map((script) => ({
			// 	value: script,
			// 	name: `📜 ${script.name} (ID: ${script.id})`,
			// })),
		],
	});


	const path = await Input.prompt({
		message: "Enter deployment path:",
		validate: (val) => (val.length != 0 ? true : `path is required`),
		info: true,
	});

	let executable = await Confirm.prompt({
		message: "🔐 Make script executable?",
		hint: "Required for immediate execution",
		default: false,
	});

	let executeImmediately = false;
	if (executable) {
		executeImmediately = await Confirm.prompt({
			message: "⚠️  Execute immediately after deployment?",
			hint: "This will run the script on the server",
			default: false,
		});
	} else if (
		await Confirm.prompt({
			message: "Enable executable flag to allow immediate execution?",
			default: false,
		})
	) {
		executable = true;
		executeImmediately = true;
	}

	console.log("\n📋 Deployment Summary:");
	new Table()
		.border()
		.header(["Setting", "Value"])
		.body([
			["Server", slug],
			["Script", `${script.name} (ID: ${script.id})`],
			["Path", path],
			["Executable", executable ? "✅ Yes" : "❌ No"],
			["Immediate Execution", executeImmediately ? "⚠️  Yes" : "❌ No"],
		])
		.render();

	const confirmed = await Confirm.prompt({
		message: "Confirm deployment?",
		default: false,
	});

	if (!confirmed) {
		console.log("\n🚫 Deployment cancelled");
		return navigator.goToServerScripts(slug);
	}

	spinner.message = "🚚 Deploying script...";
	spinner.start();

	const create = await client.servers.scripts.create({
		scriptId: script.id,
		path,
		makeScriptExecutable: executable,
		executeImmediately,
		serverSlug: slug,
	});
	spinner.stop();

	if (!create.success) {
		console.error("\n❌ Deployment failed:", create.error || "Unknown error");
		if (create.code === 404) {
			console.error(
				"💡 Verify:",
				`- Server slug '${slug}' exists\n` + `- Script ID ${script.id} is valid`,
			);
		}
		return navigator.goToServerScripts(slug);
	}

	console.log("\n🎉 Successfully deployed script!");
	console.log(`📌 Path: ${create.response.body.path}`);
	console.log(`🕒 Created at: ${new Date().toLocaleString()}`);

	if (executeImmediately) {
		console.log("\n⚡ Script execution started - check server logs for output");
	}
	return navigator.goToServerScripts(slug);


}
