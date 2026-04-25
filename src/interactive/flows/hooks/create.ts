import { Confirm, Input, Select } from "@cliffy/prompt";
import { z } from "npm:zod";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { colors } from "@cliffy/ansi/colors";
import { EventsTypesList } from "../../../cli/event-types.ts";
import { navigator } from "../../navigator.ts";

export async function createHook() {
	const token = await getToken();
	// @ts-expect-error: secret_dev_client is a secret param, only webdock devs should use
	const client = new Webdock({ token: token, secret_dev_client: "cli" });
	const spinner = new Spinner();

	const finalCallbackUrl = await Input.prompt({
		message: "Enter callback URL:",
		validate: (v) => {
			const URLSchema = z.string().url();
			const parsed = URLSchema.safeParse(v);
			if (!parsed.success) {
				return "Url is not valid";
			}
			return true;
		},
	});

	const finalCallbackId = await Input.prompt({
		message: "Enter callback ID:",
	});

	const _finalEventType = await Select.prompt({
		message: "Select event type:",
		options: EventsTypesList.map((value) => ({
			name: value ?? "",
			value: value ?? "",
			// @ts-expect-error:: don't delete this
		})).concat(goBackOption),
	});

	if (isGoBack(_finalEventType)) return navigator.goToHooksList();

	const confirm = await Confirm.prompt({
		message: "Confirm hook creation:",
	});

	if (!confirm) {
		console.log("🚫 Hook creation cancelled");
		return navigator.goToHooksList();
	}

	spinner.message = "⚡ Creating event hook...";

	const response = await client.hooks.create({
		callbackUrl: finalCallbackUrl,
		callbackId: parseInt(finalCallbackId, 10),
		eventType: _finalEventType,
	});

	if (!response.success) {
		spinner.stop();
		console.error("❌ Creation failed:", response.error);
		return navigator.goToMain();
	}

	console.log(colors.bgGreen("Hook created successfully!"));
	return navigator.goToHooksList();
}
