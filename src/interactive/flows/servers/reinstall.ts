import { Select } from "@cliffy/prompt/select";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { FunFact } from "../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { navigator } from "../../navigator.ts";

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

	const confirm = await Select.prompt({
		message: "Confirm server creation:",
		options: [
			{ name: "✅ Yes, Reinstall server", value: true },
			{ name: "❌ Cancel creation", value: false },
		],
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
