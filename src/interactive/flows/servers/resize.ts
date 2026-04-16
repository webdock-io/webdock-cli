import { Confirm, Select } from "@cliffy/prompt";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "../../navigator.ts";
import { open } from "@opensrc/deno-open";

const MiB_TO_GiB = 0.001048576;

export async function resizeServerAction(slug: string) {
	const token = await getToken();
	const client = new Webdock(token);

	const spinner = new Spinner();

	const serverInfo = await client.servers.getBySlug({ serverSlang: slug });

	if (!serverInfo.success) {
		console.error("❌ Failed to fetch server details:", serverInfo.error);
		return navigator.goToServerActions(slug);
	}

	console.log("\nCurrent Server Configuration:");
	console.log(`🖥️  Name          : ${serverInfo.response.body.name}`);
	console.log(`📦 Current Profile: ${serverInfo.response.body.profile}`);
	console.log("------------------------------");

	const possibleProfiles = await client.profiles.list({ profileSlug: serverInfo.response.body.profile ?? "" });
	if (!possibleProfiles.success) {
		console.error(possibleProfiles.error);
		Deno.exit(1);
	}
	const profiles = await client.profiles.list({ locationId: "dk" });
	if (!profiles.success) {
		console.error(profiles.error);
		Deno.exit(1);
	}
	profiles.response.body = profiles.response.body.sort((a, b) => a.cpu.threads - b.cpu.threads);

	const longestName = Math.max(...profiles.response.body.map((p) => p.name.length));

	const filterd = possibleProfiles.response.body.map((p) => ({
		name: `${p.name.padEnd(longestName + 2)} | ${p.cpu.threads}vCPU | ${String((Math.ceil(p.ram * MiB_TO_GiB)).toFixed(0)).padEnd(3, " ")}GB RAM | ${(p.disk * MiB_TO_GiB).toFixed(0)}GB SSD`,
		value: p.slug,
	})).filter((p) => p.value !== serverInfo.response.body.profile);

	if (filterd.length === 0) {
		console.log(colors.yellow("! No alternative profiles available for this server"));
		console.log(colors.yellow("! At this time you have to go to the Webdock Dashboard and create a Custom Profile for this server on the upgrade/downgrade screen"));
		console.log(colors.italic("Redirecting you to the dashboard..."));
		await open(`https://app.webdock.io/en/dash/changeprofile/${slug}`);
		console.log(`\n`);
		return navigator.goToServerActions(slug);
	}

	const profile = await Select.prompt({
		message: "Select new server profile:",
		options: filterd.concat(goBackOption),
	});

	if (isGoBack(profile)) return navigator.goToServerActions(slug);

	const confirm = await Confirm.prompt({
		message: "⚠️  WARNING: Resizing requires server restart! Continue?",
		default: false,
	});

	if (!confirm) {
		console.log("🚫 Server reboot cancelled");
		return navigator.goToServerActions(slug);
	}

	spinner.message = "🔧 Resizing server resources...";
	spinner.start();

	const response = await client.servers.resize({
		profileSlug: profile,
		serverSlug: slug,
	});
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 404:
				console.error("❌ Server not found");
				break;
			case 409:
				console.error("❌ Server must be stopped first");
				break;
			default:
				console.error("❌ Resize failed:", response.error);
		}
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log("\n✅ Server resize complete!");
	console.log("📊 New Profile:", profile);
	console.log("🔗 Dashboard: https://webdock.io/en/dash/server/" + slug);
	return navigator.goToServerActions(slug);
}
