import { Checkbox } from "@cliffy/prompt";
import { Confirm } from "@cliffy/prompt/confirm";
import { Input } from "@cliffy/prompt/input";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../../config.ts";
import { FunFact } from "../../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "../../../navigator.ts";

export async function createShellUser(serverSlug: string) {
	const spinner = new Spinner();
	const token = await getToken();
	const client = new Webdock(token);

	console.log(colors.bgBlue.white(" CREATE SHELL USER "));

	const username = await Input.prompt({
		message: "Enter username:",
		validate: (input) => /^[a-z_][a-z0-9_-]*$/.test(input) || "Invalid username format",
	});

	const password = await Input.prompt({
		message: "Set password:",
		validate: (input) => input.length >= 8 || "Password must be at least 8 characters",
	});

	const confirmPassword = await Input.prompt({
		message: "Confirm password:",
	});

	if (password !== confirmPassword) {
		console.error("❌ Passwords do not match");
		return navigator.goToShellUsers(serverSlug);
	}

	const group = await Input.prompt({
		message: "Enter group:",
		default: "sudo",
	});

	const shell = await Input.prompt({
		message: "Select shell:",
		default: "/bin/bash",
	});

	spinner.message = "Fetching available SSH Keys";
	spinner.start();
	const keys = await client.sshkeys.list();
	spinner.stop();

	if (!keys.success) {
		switch (keys.code) {
			case 404:
				console.error("❌ Resource not found");
				break;
			case 429:
				console.error("❌ Too many requests - try again later");
				break;
			default:
				console.error("❌ Failed to fetch keys:", keys.error);
		}
	}

	let selected_keys;
	if (keys.success && keys.response.body.length > 0) {
		selected_keys = await Checkbox.prompt({
			message: "select keys! (Hit Enter twice to skip)",
			options: keys.response.body.map((e) => {
				return {
					value: e.id,
					name: `${e.name} (${e.id})`,
				};
			}),
		});
	} else {
		console.log("No ssh keys were found, skipping this step");
	}

	const confirm = await Confirm.prompt({
		message: "Create this shell user?",
		default: false,
	});

	if (!confirm) {
		console.log("🚫 Creation cancelled");
		return navigator.goToShellUsers(serverSlug);
	}

	spinner.message = "🔨 Creating user account...";
	spinner.start();

	const response = await client.shellUsers.create({
		username,
		password,
		group,
		shell,
		publicKeys: selected_keys,
		serverSlug: serverSlug,
	});
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 404:
				console.error("❌ Server not found");
				break;
			case 409:
				console.error("❌ Username already exists");
				break;
			case 400:
				console.error("❌ Validation error:", response.error);
				break;
			default:
				console.error("❌ Creation failed:", response.error);
		}
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	spinner.stop();
	console.log("\n✅ User created successfully!");
	console.log("🔑 Username:", colors.green(username));
	console.log(
		"🖥️  Server:",
		colors.underline(`https://webdock.io/en/dash/server/${serverSlug}`),
	);
	return navigator.goToShellUsers(serverSlug);
}
