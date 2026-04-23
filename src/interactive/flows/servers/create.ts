import { colors } from "@cliffy/ansi/colors";
import { Confirm, Input, Select } from "@cliffy/prompt";
import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { FunFact } from "../../../cli/fun-fact.ts";
import { getToken } from "../../../config.ts";
import { navigator } from "../../navigator.ts";
import { getServerOptions } from "../../screens/servers/list.ts";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { promptForServerProfile } from "../../utils/server-profile.ts";
import { promptForScriptSelection } from "../../utils/script-selection.ts";

export const MiB_TO_GiB = 0.001048576;

export async function createWebdockServer() {
	const spinner = new Spinner();
	const token = await getToken();
	const client = new Webdock(token);

	const serverName = await Input.prompt({
		message: "Enter server name:",
		validate: (input) => input.length > 3 || "Name must be at least 4 characters",
	});

	spinner.message = "Loading locations...";
	spinner.start();
	const locations = await client.location.list();
	spinner.stop();

	if (!locations.success) {
		console.error(locations.error);
		return navigator.goToMain();
	}

	const locationId = await Select.prompt({
		message: "Select a server location:",
		options: locations.response.body.map((location) => ({
			name: `${location.name} (${location.city}, ${location.country}) [${location.id}]`,
			value: location.id,
		})).concat(goBackOption),
	});

	if (isGoBack(locationId)) {
		return navigator.goToMain();
	}

	spinner.message = "Loading server profiles...";
	spinner.start();
	const profiles = await client.profiles.list({ locationId });
	spinner.stop();

	if (!profiles.success) {
		console.error(profiles.error);
		return navigator.goToMain();
	}

	if (profiles.response.body.length === 0) {
		console.error(colors.red("No profiles were found for that location."));
		return navigator.goToMain();
	}

	const sortedProfiles = [...profiles.response.body]
		.sort((a, b) => a.disk - b.disk || a.cpu.threads - b.cpu.threads);
	const selectedProfile = await promptForServerProfile(client, sortedProfiles);

	if (selectedProfile === "GO_BACK") {
		return navigator.goToMain();
	}

	const profileSlug = selectedProfile.slug;
	const profileLabel = selectedProfile.name;

	const imageType = await Select.prompt({
		message: "Do you want to create a new image or restore from a snapshot?",
		options: [
			{ name: "New image", value: "new" },
			{ name: "Restore snapshot", value: "snapshot" },
		].concat(goBackOption),
	});

	if (isGoBack(imageType)) {
		return navigator.goToMain();
	}

	let imageSlug: string | undefined;
	let snapshotId: number | undefined;
	let imageLabel = "";

	if (imageType === "new") {
		spinner.message = "Loading images...";
		spinner.start();
		const images = await client.images.list();
		spinner.stop();

		if (!images.success) {
			console.error(images.error);
			return navigator.goToMain();
		}

		const selectedImage = await Select.prompt({
			message: "Choose an operating system image:",
			options: images.response.body.map((image) => ({
				name: formatImageOption(image),
				value: image.slug,
			})).concat(goBackOption),
		});

		if (isGoBack(selectedImage)) {
			return navigator.goToMain();
		}

		imageSlug = selectedImage;
		imageLabel = images.response.body.find((image) => image.slug === selectedImage)?.name ??
			selectedImage;
	} else {
		spinner.message = "Loading server list...";
		spinner.start();
		const servers = await client.servers.list();
		spinner.stop();

		if (!servers.success) {
			console.error("Failed to load servers:", servers.error);
			return navigator.goToMain();
		}

		if (servers.response.body.length === 0) {
			console.log(colors.bgRed("No servers were found."));
			return navigator.goToMain();
		}

		const serverChoice = await Select.prompt({
			message: "Select a server to restore from:",
			options: getServerOptions(servers.response.body).concat(goBackOption),
		});

		if (isGoBack(serverChoice)) {
			return navigator.goToMain();
		}

		spinner.message = "Loading server snapshots...";
		spinner.start();
		const snapshots = await client.snapshots.list({ serverSlug: serverChoice });
		spinner.stop();

		if (!snapshots.success) {
			console.error("Failed to load server snapshots:", snapshots.error);
			return navigator.goToMain();
		}

		if (snapshots.response.body.length === 0) {
			console.error("No snapshots were found for that server.");
			return navigator.goToMain();
		}

		const selectedSnapshot = await Select.prompt({
			message: "Select a snapshot:",
			options: snapshots.response.body.map((snapshot) => ({
				value: String(snapshot.id),
				name: `${snapshot.name} (#${snapshot.id})`,
			})).concat(goBackOption),
		});

		if (isGoBack(selectedSnapshot)) {
			return navigator.goToMain();
		}

		snapshotId = Number(selectedSnapshot);
		imageLabel = snapshots.response.body.find((snapshot) => String(snapshot.id) === selectedSnapshot)?.name ??
			`Snapshot #${selectedSnapshot}`;
	}

	const selectedScript = await promptForScriptSelection(client, {
		sourceMessage: "Choose a provisioning script source:",
		scriptMessage: "Choose a script to run after provisioning:",
		noneLabel: "No, use the default settings",
	});

	if (selectedScript === "GO_BACK") {
		return navigator.goToMain();
	}

	console.log("\nProvisioning summary:");
	console.log(`Name: ${serverName}`);
	console.log(`Location: ${locationId}`);
	console.log(`Profile: ${profileLabel}`);
	console.log(`${imageType === "new" ? "Image" : "Snapshot"}: ${imageLabel}`);
	if (selectedScript) {
		console.log(`Provisioning script: [${selectedScript.source}] ${selectedScript.name} (#${selectedScript.slug})`);
	}

	const confirm = await Confirm.prompt({
		message: "Confirm server creation:",
		default: true,
	});

	if (!confirm) {
		console.log("Server creation cancelled");
		return navigator.goToMain();
	}

	spinner.message = "Creating your server...";
	spinner.start();
	const response = await client.servers.create({
		name: serverName,
		locationId,
		profileSlug,
		...(imageSlug ? { imageSlug } : { snapshotId }),
		...(selectedScript ? { userScriptId: selectedScript.slug } : {}),
	});
	spinner.stop();

	if (!response.success) {
		console.error("Creation failed:", response.error);
		return navigator.goToMain();
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

	return navigator.goToServerActions(response.response.body.slug);
}

function formatImageOption(
	image: {
		name: string;
		slug: string;
		webServer: string | null;
		phpVersion: string | null;
	},
) {
	const details = [
		image.webServer ? `Web: ${image.webServer}` : undefined,
		image.phpVersion ? `PHP: ${image.phpVersion}` : undefined,
	].filter(Boolean).join(" | ");

	return details.length > 0 ? `${image.name} (${image.slug}) | ${details}` : `${image.name} (${image.slug})`;
}
