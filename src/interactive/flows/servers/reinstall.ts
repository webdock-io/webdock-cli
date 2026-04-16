import { Select } from "@cliffy/prompt/select";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { navigator } from "../../navigator.ts";
import { Confirm } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";

export async function reinstall(slug: string) {
	const spinner = new Spinner();
	const token = await getToken();
	const client = new Webdock(token);
	const images = await client.images.list();
	if (!images.success) {
		console.error(images.error);
		Deno.exit(1);
	}
	const image = await Select.prompt({
		message: "Choose operating system:",
		options: images.response.body
			.map((img) => ({
				name: `${img.name} (${img.slug})`,
				value: img.slug,
			}))
			.concat(goBackOption),
	});

	if (isGoBack(image)) return navigator.goToServerActions(slug);

	const shouldRunScript = await Select.prompt({
		message: "Would you like to run a SCRIPT as part of the provisioning?",
		options: [
			{
				name: "No, use the default settings",
				value: "NO",
			},

			{
				name: "Yes, run an account script",
				value: "ACCOUNT",
			},
		],
	});

	let userScriptId = 0;
	if (shouldRunScript === "ACCOUNT") {
		const accountScripts = await client.account.scripts.list();
		if (!accountScripts.success) {
			console.error(colors.red(accountScripts.error));
			return;
		}

		if (accountScripts.response.body.length == 0) {
			console.log("Skipping: Found no account scripts");
		} else {
			const selectedScript = await Select.prompt({
				message: "Choose script to run after provisiong",
				options: accountScripts.response.body
					.map((script, idx) => {
						return {
							name: `(${String(idx).padEnd(3, " ")})${script.name} ${script.description}`,
							value: script.id,
						};
					}),
			});
			userScriptId = selectedScript;
		}
	}

	const confirm = await Confirm.prompt({
		message: "Confirm server reinstalation:",
	});

	if (!confirm) {
		console.log("🚫 Server reinstalation cancelled");
		return navigator.goToServerActions(slug);
	}

	spinner.message = "🚀 Launching your server...";
	spinner.start();

	const response = await client.servers.reinstall({
		imageSlug: image,
		serverSlug: slug,
		...(userScriptId != 0 ? { userScriptId: userScriptId } : {}),
	});
	spinner.stop();

	if (!response.success) {
		console.error("❌ Reinsallation failed:", response.error);
		return navigator.goToServerActions(slug);
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log("\n✅ Server ready!");
	console.log(`🔗 Access URL: https://webdock.io/en/dash/server/${slug}`);
	console.log("🎉 Happy hosting!");
	return navigator.goToServerActions(slug);
}
