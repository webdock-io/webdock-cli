import { Confirm } from "@cliffy/prompt/confirm";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../../config.ts";
import { FunFact } from "../../../../cli/fun-fact.ts";
import { Spinner } from "@std/cli/unstable-spinner";
import { colors } from "@cliffy/ansi/colors";
import { navigator } from "../../../navigator.ts";

export async function deleteShellUser(
	{ slug, userId }: { slug: string; userId: number },
) {
	const spinner = new Spinner();
	const token = await getToken();
	const client = new Webdock(token);

	const confirm = await Confirm.prompt({
		message: "⚠️  PERMANENTLY delete this shell user?",
		default: false,
		hint: "This cannot be undone!",
	});

	if (!confirm) {
		console.log("🚫 Deletion cancelled");
		return navigator.goToShellUsers(slug);
	}

	spinner.message = "🗑️  Deleting user account...";
	spinner.start();

	const response = await client.shellUsers.delete({
		serverSlug: slug,
		userId: userId,
	});
	spinner.stop();

	if (!response.success) {
		switch (response.code) {
			case 404:
				console.error("❌ User or server not found");
				break;
			case 403:
				console.error("❌ Permission denied");
				break;
			case 409:
				console.error("❌ User is currently active");
				break;
			default:
				console.error("❌ Deletion failed:", response.error);
		}
		return navigator.goToMain();
	}

	await new FunFact().show();
	spinner.message = "⏳ Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(response.response.headers["x-callback-id"]);
	spinner.stop();
	if (!waitResult.success) return navigator.goToMain();

	console.log("\n✅ User deleted successfully!");
	console.log(
		"🌐 Verify on dashboard:",
		colors.underline(`https://webdock.io/en/dash/shellusers/${slug}`),
	);
	return navigator.goToShellUsers(slug);
}
