import { colors } from "@cliffy/ansi/colors";
import { Confirm } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { open } from "@opensrc/deno-open";
import { FunFact } from "../../../cli/fun-fact.ts";
import { getToken } from "../../../config.ts";
import { navigator } from "../../navigator.ts";
import { resolveLocationId } from "../../utils/location.ts";
import { promptForServerProfile } from "../../utils/server-profile.ts";

const MiB_TO_GB = 0.001048576;

export async function resizeServerAction(slug: string) {
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	const spinner = new Spinner();

	const serverInfo = await client.servers.getBySlug({ serverSlang: slug });
	if (!serverInfo.success) {
		console.error("Failed to fetch server details:", serverInfo.error);
		return navigator.goToServerActions(slug);
	}

	const locations = await client.location.list();
	if (!locations.success) {
		console.error(locations.error);
		return navigator.goToServerActions(slug);
	}

	const locationId = resolveLocationId(
		serverInfo.response.body.location,
		locations.response.body,
	);

	if (!locationId) {
		console.log(colors.yellow("Could not reliably match the server location to a location id."));
		console.log(colors.yellow("Opening the Webdock dashboard for profile changes instead."));
		await open(`https://app.webdock.io/en/dash/changeprofile/${slug}`);
		return navigator.goToServerActions(slug);
	}

	const profiles = await client.profiles.list({ locationId });
	if (!profiles.success) {
		console.error(profiles.error);
		return navigator.goToServerActions(slug);
	}

	const currentProfileSlug = serverInfo.response.body.profile ?? "";
	const currentProfileResponse = await client.profiles.list({
		profileSlug: currentProfileSlug,
	});

	if (!currentProfileResponse.success || currentProfileResponse.response.body.length === 0) {
		console.error("Failed to load the current server profile details.");
		return navigator.goToServerActions(slug);
	}

	const currentProfile = currentProfileResponse.response.body[0];
	const currentPlatform = currentProfile.platform;
	const currentDiskSize = currentProfile.disk;
	const currentDiskSizeGb = Math.ceil(currentDiskSize * MiB_TO_GB);

	const candidateProfiles = [...profiles.response.body]
		.filter((profile) =>
			profile.slug !== currentProfileSlug &&
			profile.platform === currentPlatform &&
			profile.disk >= currentDiskSize
		)
		.sort((a, b) => a.disk - b.disk || a.cpu.threads - b.cpu.threads);

	console.log("\nCurrent server configuration:");
	console.log(`Name: ${serverInfo.response.body.name}`);
	console.log(`Current profile: ${currentProfileSlug}`);
	console.log(`Location: ${serverInfo.response.body.location}`);
	console.log(`Platform: ${currentPlatform}`);
	console.log(`Disk: ${currentDiskSizeGb} GB`);

	if (candidateProfiles.length === 0) {
		console.log(colors.yellow("No standard upgrade profiles were found for this server."));
	}

	const selectedProfile = await promptForServerProfile(client, candidateProfiles, {
		modeMessage: "Choose profile type for the upgrade:",
		profileMessage: "Select the new server profile:",
		constraints: {
			customProfile: {
				allowedPlatformSlugs: [currentPlatform],
				minDiskSpace: currentDiskSizeGb,
			},
		},
	});

	if (selectedProfile === "GO_BACK") {
		return navigator.goToServerActions(slug);
	}

	spinner.message = "Running resize dry run...";
	spinner.start();
	const dryRun = await client.servers.resizeDryRun({
		serverSlug: slug,
		profileSlug: selectedProfile.slug,
	});
	spinner.stop();

	if (!dryRun.success) {
		console.error("Dry run failed:", dryRun.error);
		return navigator.goToServerActions(slug);
	}

	renderDryRunSummary(dryRun.response.body);

	const confirm = await Confirm.prompt({
		message: "Resize this server to the selected profile?",
		default: false,
	});

	if (!confirm) {
		console.log("Server resize cancelled");
		return navigator.goToServerActions(slug);
	}

	spinner.message = "Resizing server resources...";
	spinner.start();
	const response = await client.servers.resize({
		profileSlug: selectedProfile.slug,
		serverSlug: slug,
	});
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 404:
				console.error("Server not found");
				break;
			case 409:
				console.error("The server must be stopped before resizing.");
				break;
			default:
				console.error("Resize failed:", response.error);
		}

		return navigator.goToServerActions(slug);
	}

	await new FunFact().show();
	spinner.message = "Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();

	if (!waitResult.success) {
		console.error(waitResult.error);
		return navigator.goToMain();
	}

	console.log("\nServer resize completed.");
	return navigator.goToServerActions(slug);
}

function renderDryRunSummary(
	dryRun: {
		warnings: { type: string; message: string }[];
		chargeSummary: {
			items: { text: string; price: { amount: number; currency: string } }[];
			total: {
				subTotal: { amount: number; currency: string };
				vat: { amount: number; currency: string };
				total: { amount: number; currency: string };
			};
		};
	},
) {
	console.log("\nResize dry run:");

	if (dryRun.warnings.length > 0) {
		console.log(colors.yellow("Warnings:"));
		for (const warning of dryRun.warnings) {
			console.log(`- ${warning.type}: ${warning.message}`);
		}
	}

	const rows = dryRun.chargeSummary.items.map((item) => [
		item.text,
		formatPrice(item.price),
	]);

	rows.push(["Subtotal", formatPrice(dryRun.chargeSummary.total.subTotal)]);
	rows.push(["VAT", formatPrice(dryRun.chargeSummary.total.vat)]);
	rows.push(["Total", formatPrice(dryRun.chargeSummary.total.total)]);

	new Table()
		.header(["Description", "Amount"])
		.body(rows)
		.border(true)
		.render();
}

function formatPrice(
	price: { amount: number; currency: string },
) {
	return `${price.currency === "USD" ? "$" : price.currency} ${(price.amount / 100).toFixed(2)}`;
}
