import { colors } from "@cliffy/ansi/colors";
import { Confirm, Select } from "@cliffy/prompt";
import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { FunFact } from "../../../cli/fun-fact.ts";
import { getToken } from "../../../config.ts";
import { navigator } from "../../navigator.ts";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { promptForScriptSelection } from "../../utils/script-selection.ts";

export async function reinstall(slug: string) {
	const spinner = new Spinner();
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });

	spinner.message = "Loading images...";
	spinner.start();
	const images = await client.images.list();
	spinner.stop();

	if (!images.success) {
		console.error(images.error);
		return navigator.goToServerActions(slug);
	}

	const imageSlug = await Select.prompt({
		message: "Choose the operating system image to reinstall:",
		options: images.response.body.map((image) => ({
			name: formatImageOption(image),
			value: image.slug,
		})).concat(goBackOption),
	});

	if (isGoBack(imageSlug)) {
		return navigator.goToServerActions(slug);
	}

	const selectedScript = await promptForScriptSelection(client, {
		sourceMessage: "Choose a provisioning script source:",
		scriptMessage: "Choose a script to run after reinstall:",
		noneLabel: "No, use the default settings",
		includeGoBack: true,
	});

	if (selectedScript === "GO_BACK") {
		return navigator.goToServerActions(slug);
	}

	console.log("\nReinstall summary:");
	console.log(`Server: ${slug}`);
	console.log(`Image: ${imageSlug}`);
	if (selectedScript) {
		console.log(`Provisioning script: [${selectedScript.source}] ${selectedScript.name} (#${selectedScript.slug})`);
	}

	const confirm = await Confirm.prompt({
		message: "Confirm server reinstall:",
		default: false,
	});

	if (!confirm) {
		console.log("Server reinstall cancelled");
		return navigator.goToServerActions(slug);
	}

	spinner.message = "Starting reinstall...";
	spinner.start();
	const response = await client.servers.reinstall({
		imageSlug,
		serverSlug: slug,
		...(selectedScript ? { userScriptId: selectedScript.slug } : {}),
	});
	spinner.stop();

	if (!response.success) {
		console.error("Reinstall failed:", response.error);
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

	console.log(colors.green("Server reinstall completed."));
	return navigator.goToServerActions(slug);
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
