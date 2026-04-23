import { colors } from "@cliffy/ansi/colors";
import { Confirm, Input, Select } from "@cliffy/prompt";
import { Spinner } from "@std/cli/unstable-spinner";
import type { Webdock } from "@webdock/sdk";
import { goBackOption, isGoBack } from "./navigation.ts";

type ProfileCandidate = {
	slug: string;
	name: string;
	platform: string;
};

type PlatformLimit = {
	min: number;
	max: number;
	costCents: number;
	freeUnits: number;
};

type PlatformChoice = {
	slug: string;
	name: string;
	resourceLimits: {
		cpuThreads: PlatformLimit;
		ram: PlatformLimit;
		diskSpace: PlatformLimit;
		networkBandwidth: PlatformLimit;
	};
};

type ProfilePromptConstraints = {
	customProfile?: {
		allowedPlatformSlugs?: string[];
		minDiskSpace?: number;
	};
};

export async function promptForServerProfile(
	client: Webdock,
	profiles: ProfileCandidate[],
	{
		modeMessage = "Choose profile type:",
		profileMessage = "Select server profile:",
		constraints,
	}: {
		modeMessage?: string;
		profileMessage?: string;
		constraints?: ProfilePromptConstraints;
	} = {},
): Promise<
	| {
		slug: string;
		name: string;
	}
	| "GO_BACK"
> {
	while (true) {
		const profileMode = await Select.prompt({
			message: modeMessage,
			options: [
				{ name: "Standard profile", value: "STANDARD" },
				{ name: "Custom profile", value: "CUSTOM" },
				goBackOption,
			],
		});

		if (isGoBack(profileMode)) {
			return "GO_BACK";
		}

		if (profileMode === "STANDARD") {
			if (profiles.length === 0) {
				console.log(colors.yellow("No standard profiles are available here."));
				continue;
			}

			const profileChoice = await Select.prompt({
				message: profileMessage,
				options: profiles.map((profile) => ({
					name: profile.name,
					value: profile.slug,
				})).concat(goBackOption),
			});

			if (isGoBack(profileChoice)) {
				continue;
			}

			const selectedProfile = profiles.find((profile) => profile.slug === profileChoice);
			if (!selectedProfile) {
				continue;
			}

			return {
				slug: selectedProfile.slug,
				name: selectedProfile.name,
			};
		}

		const customProfile = await createCustomProfile(client, profiles, constraints);
		if (customProfile === "GO_BACK") {
			continue;
		}

		return customProfile;
	}
}

async function createCustomProfile(
	client: Webdock,
	profiles: ProfileCandidate[],
	constraints?: ProfilePromptConstraints,
): Promise<
	| {
		slug: string;
		name: string;
	}
	| "GO_BACK"
> {
	const spinner = new Spinner();

	spinner.message = "Loading custom profile limits...";
	spinner.start();
	const [accountInfo, platforms] = await Promise.all([
		client.account.info(),
		client.platforms.list({ currency: "USD" }),
	]);
	spinner.stop();

	if (!accountInfo.success) {
		console.error(accountInfo.error);
		return "GO_BACK";
	}

	if (!platforms.success) {
		console.error(platforms.error);
		return "GO_BACK";
	}

	const currency = accountInfo.response.body.accountBalanceCurrency || "USD";

	let platformResponse = platforms;
	if (currency !== "USD") {
		const currencyPlatforms = await client.platforms.list({ currency });
		if (currencyPlatforms.success) {
			platformResponse = currencyPlatforms;
		}
	}

	const availablePlatforms = new Set(
		profiles.map((profile) => profile.platform).filter(Boolean),
	);
	const allowedPlatformSlugs = constraints?.customProfile?.allowedPlatformSlugs;
	const platformChoices = platformResponse.response.body.filter((platform) =>
		(availablePlatforms.size === 0 || availablePlatforms.has(platform.slug)) &&
		(!allowedPlatformSlugs || allowedPlatformSlugs.includes(platform.slug))
	);

	if (platformChoices.length === 0) {
		console.error(
			colors.red("No custom profile platforms are available for this location."),
		);
		return "GO_BACK";
	}

	const selectedPlatform = platformChoices.length === 1 ? platformChoices[0] : await selectPlatform(platformChoices);

	if (!selectedPlatform) {
		return "GO_BACK";
	}

	const cpuThreads = await promptNumberInput({
		message: buildLimitMessage(
			"CPU threads",
			selectedPlatform.resourceLimits.cpuThreads,
			currency,
		),
		min: selectedPlatform.resourceLimits.cpuThreads.min,
		max: selectedPlatform.resourceLimits.cpuThreads.max,
	});

	const ram = await promptNumberInput({
		message: buildLimitMessage(
			"RAM in GB",
			selectedPlatform.resourceLimits.ram,
			currency,
		),
		min: selectedPlatform.resourceLimits.ram.min,
		max: selectedPlatform.resourceLimits.ram.max,
	});

	const minDiskSpace = Math.max(
		selectedPlatform.resourceLimits.diskSpace.min,
		constraints?.customProfile?.minDiskSpace ??
			selectedPlatform.resourceLimits.diskSpace.min,
	);

	const diskSpace = await promptNumberInput({
		message: buildLimitMessage(
			"Disk space in GB",
			selectedPlatform.resourceLimits.diskSpace,
			currency,
			minDiskSpace,
		),
		min: minDiskSpace,
		max: selectedPlatform.resourceLimits.diskSpace.max,
	});

	const networkBandwidth = await promptNumberInput({
		message: buildLimitMessage(
			"Network bandwidth in Gbit/s",
			selectedPlatform.resourceLimits.networkBandwidth,
			currency,
		),
		min: selectedPlatform.resourceLimits.networkBandwidth.min,
		max: selectedPlatform.resourceLimits.networkBandwidth.max,
	});

	console.log("\nCustom profile summary:");
	console.log(`Platform: ${selectedPlatform.name}`);
	console.log(`CPU threads: ${cpuThreads}`);
	console.log(`RAM: ${ram} GB`);
	console.log(`Disk: ${diskSpace} GB`);
	console.log(`Network: ${networkBandwidth} Gbit/s`);

	const confirm = await Confirm.prompt({
		message: "Create this custom profile?",
		default: true,
	});

	if (!confirm) {
		console.log("Custom profile creation cancelled");
		return "GO_BACK";
	}

	spinner.message = "Creating custom profile...";
	spinner.start();
	const response = await client.profiles.create({
		platform: selectedPlatform.slug as "epyc_vps" | "intel_vps",
		cpu_threads: cpuThreads,
		ram,
		disk_space: diskSpace,
		network_bandwidth: networkBandwidth,
	});
	spinner.stop();

	if (!response.success) {
		console.error("Failed to create custom profile:", response.error);
		return "GO_BACK";
	}

	console.log(colors.green(`Custom profile created: ${response.response.body.name}`));

	return {
		slug: response.response.body.slug,
		name: response.response.body.name,
	};
}

function buildLimitMessage(
	label: string,
	limit: PlatformLimit,
	currency: string,
	minOverride?: number,
) {
	const costPerUnit = `${(limit.costCents / 100).toFixed(2)} ${currency}`;
	const effectiveMin = minOverride ?? limit.min;
	return `${label} [${effectiveMin}-${limit.max}] (free units: ${limit.freeUnits}, cost per extra unit: ${costPerUnit}):`;
}

async function selectPlatform(
	platformChoices: PlatformChoice[],
) {
	const selectedPlatformSlug = await Select.prompt({
		message: "Select hardware platform:",
		options: platformChoices.map((platform) => ({
			name: platform.name,
			value: platform.slug,
		})).concat(goBackOption),
	});

	if (isGoBack(selectedPlatformSlug)) {
		return null;
	}

	return platformChoices.find((platform) => platform.slug === selectedPlatformSlug) ?? null;
}

async function promptNumberInput(
	{
		message,
		min,
		max,
	}: {
		message: string;
		min: number;
		max: number;
	},
) {
	const value = await Input.prompt({
		message,
		validate: (input) => {
			if (!/^\d+$/.test(input)) {
				return "Enter a whole number";
			}

			const parsed = Number(input);
			if (parsed < min || parsed > max) {
				return `Value must be between ${min} and ${max}`;
			}

			return true;
		},
	});

	return Number(value);
}
