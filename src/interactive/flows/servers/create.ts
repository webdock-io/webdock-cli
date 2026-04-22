import { Input } from "@cliffy/prompt/input";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { colors } from "@cliffy/ansi/colors";
import { getServerOptions } from "../../screens/servers/list.ts";
import { navigator } from "../../navigator.ts";
import { Confirm, Select } from "@cliffy/prompt";
export const MiB_TO_GiB = 0.001048576;
export async function createWebdockServer() {
	const spinner = new Spinner();

	const token = await getToken();
	const client = new Webdock(token);

	const serverName = await Input.prompt({
		message: "Enter server name:",
		validate: (input) => input.length > 3 || "Name must be at least 4 characters",
	});

	const profiles = await client.profiles.list({ locationId: "dk" });
	if (!profiles.success) {
		console.error(profiles.error);
		Deno.exit(1);
	}
	profiles.response.body = profiles.response.body.sort((a, b) => a.cpu.threads - b.cpu.threads);
	const longestName = Math.max(...profiles.response.body.map((p) => p.name.length));
	const profile = await Select.prompt({
		message: "Select server profile:",
		options: profiles.response.body
			.sort((a, b) => a.disk - b.disk)
			.map((p) => ({
				name: `${p.name.padEnd(longestName + 2)} | ${p.cpu.threads}vCPU | ${String((Math.ceil(p.ram * MiB_TO_GiB)).toFixed(0)).padEnd(3, " ")}GB RAM | ${(p.disk * MiB_TO_GiB).toFixed(0)
					}GB SSD`,
				value: p.slug,
			}))
			.concat(goBackOption),
	});
	if (isGoBack(profile)) {
		return navigator.goToMain();
	}

	const imageType = await Select.prompt({
		message: "Do you want to create a new image or restore from a snapshot?",
		options: [
			{ name: "🆕 New Image", value: "new" },
			{ name: "📸 Restore Snapshot", value: "snapshot" },
		].concat(goBackOption),
	});
	if (isGoBack(imageType)) {
		return navigator.goToMain();
	}

	const images = await client.images.list();
	if (!images.success) {
		console.error(images.error);
		Deno.exit(1);
	}

	let imageSlug: string = "";
	let snapshotChoice = 0;

	if (imageType === "new") {
		const image = await Select.prompt({
			message: "Choose operating system:",
			options: images.response.body
				.map((img) => ({
					name: `${img.name} (${img.slug})`,
					value: img.slug,
				}))
				.concat(goBackOption),
		});
		if (isGoBack(image)) {
			return navigator.goToMain();
		}
		imageSlug = image;
	} else {
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
			message: "Select a server:",
			options: options.concat(goBackOption),
		});
		if (isGoBack(serverChoice)) return navigator.goToMain();

		console.log("\n✅ Selected server:", serverChoice);
		spinner.message = "🔍 Loading server snapshots...";
		spinner.start();
		const snapshots = await client.snapshots.list({ serverSlug: serverChoice });
		spinner.stop();

		if (!snapshots.success) {
			console.error("❌ Failed to load server snapshots");
			return navigator.goToMain();
		}

		if (snapshots.response.body.length == 0) {
			console.error("No snapshots were found for this server");
			return navigator.goToMain();
		}

		snapshotChoice = await Select.prompt({
			message: "Select a snapshot to manage:",
			options: snapshots.response.body
				.map((e) => ({
					value: e.id,
					name: e.name,
				}))
				// @ts-expect-error:
				.concat(goBackOption),
		});
		if (isGoBack(String(snapshotChoice))) return navigator.goToMain();
	}

	const shouldRunScript = await Select.prompt({
		message: "Would you like to run a SCRIPT as part of the provisioning?",
		options: [
			{
				name: "No, use the default settings",
				value: "NO",
			},

			{
				name: "Yes, run one of my scripts",
				value: "ACCOUNT",
			},

			{
				name: "Yes, run one of webdock's scripts",
				value: "WEBDOCK",
			},
		],
	});

	let userScriptId = "";
	if (shouldRunScript === "ACCOUNT") {
		const accountScripts = await client.account.scripts.list();
		if (!accountScripts.success) {
			console.error(colors.red(accountScripts.error));
			return;
		}

		if (accountScripts.response.body.length == 0) {
			console.log("Skipping: Found no account scripts");
		} else {
			const ll = accountScripts.response.body.reduce((prev, curr) => {
				return curr.name.length > prev ? curr.name.length : prev;
			}, 0);
			const nameWidth = Math.min(ll, 30);
			const selectedScript = await Select.prompt({
				message: "Choose script to run after provisiong",
				options: accountScripts.response.body
					.map((script, idx) => {
						return {
							name: `(${String(idx + 1).padStart(3, "0")}) ${script.name.slice(0, 30).padEnd(nameWidth)} - #${script.slug}`,
							value: script.slug,
						};
					}),
			});
			userScriptId = selectedScript;
		}
	} else if (shouldRunScript === "WEBDOCK") {
		const accountScripts = await client.webdock.scripts.list()
		if (!accountScripts.success) {
			console.error(colors.red(accountScripts.error));
			return;
		}

		if (accountScripts.response.body.length == 0) {
			console.log("Skipping: Found no account scripts");
		} else {
			const ll = accountScripts.response.body.reduce((prev, curr) => {
				return curr.name.length > prev ? curr.name.length : prev;
			}, 0);
			const nameWidth = Math.min(ll, 30);
			const selectedScript = await Select.prompt({
				message: "Choose script to run after provisiong",
				options: accountScripts.response.body
					.map((script, idx) => {
						return {
							name: `(${String(idx + 1).padStart(3, "0")}) ${script.name.slice(0, 30).padEnd(nameWidth)} - #${script.slug}`,
							value: script.slug,
						};
					}),
			});
			userScriptId = selectedScript;
		}
	}

	const confirm = await Confirm.prompt({
		message: "Confirm server creation:",
	});

	if (!confirm) {
		console.log("🚫 Server creation cancelled");
		return navigator.goToMain();
	}

	spinner.message = "Creating your server....";
	spinner.start();
	const response = await client.servers.create({
		name: serverName,
		locationId: "dk",
		profileSlug: profile,
		...(imageType === "new" ? { imageSlug } : { snapshotId: snapshotChoice }),
		...(userScriptId === "" ? { userScriptId } : {}),
	});
	spinner.stop();

	if (!response.success) {
		console.error("❌ Creation failed:", response.error);
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	return navigator.goToServerActions(response.response.body.slug);
}
