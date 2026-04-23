import { Confirm, Input } from "@cliffy/prompt";
import { Spinner } from "@std/cli/unstable-spinner";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";
import { navigator } from "../../navigator.ts";

export async function renewServerSsl(slug: string) {
	const token = await getToken();
	const client = new Webdock(token);
	const spinner = new Spinner();

	const domainsInput = await Input.prompt({
		message: "Enter the domains to include (comma separated):",
		validate: (value) =>
			value.split(",").map((entry) => entry.trim()).filter(Boolean).length > 0 ||
			"At least one domain is required",
	});

	const email = await Input.prompt({
		message: "Enter the certificate email address:",
		validate: (value) => value.includes("@") || "Enter a valid email address",
	});

	const forceSSL = await Confirm.prompt({
		message: "Force HTTP to HTTPS redirects?",
		default: true,
	});

	const domains = domainsInput.split(",").map((entry) => entry.trim()).filter(Boolean);

	console.log("\nSSL renewal summary:");
	console.log(`Server: ${slug}`);
	console.log(`Domains: ${domains.join(", ")}`);
	console.log(`Email: ${email}`);
	console.log(`Force SSL: ${forceSSL ? "Yes" : "No"}`);

	const confirm = await Confirm.prompt({
		message: "Run Certbot now?",
		default: false,
	});

	if (!confirm) {
		console.log("SSL renewal cancelled");
		return navigator.goToServerActions(slug);
	}

	spinner.message = "Running Certbot...";
	spinner.start();
	const response = await client.servers.identity.renewCertificates({
		serverSlug: slug,
		domains,
		email,
		forceSSL,
	});
	spinner.stop();

	if (!response.success) {
		console.error("SSL renewal failed:", response.error);
		return navigator.goToServerActions(slug);
	}

	const callbackId = (response as unknown as { response: { headers: { "x-callback-id": string } } }).response.headers["x-callback-id"];
	spinner.message = "Waiting for operation to complete...";
	spinner.start();
	const waitResult = await client.operation.waitForEventToEnd(callbackId);
	spinner.stop();

	if (!waitResult.success) {
		console.error(waitResult.error);
		return navigator.goToMain();
	}

	console.log("SSL certificates renewed successfully.");
	return navigator.goToServerActions(slug);
}
