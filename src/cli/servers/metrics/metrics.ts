import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { Webdock } from "@webdock/sdk";
import { getToken } from "../../../config.ts";

export const metricsCommand = new Command()
	.name("metrics-now")
	.description("Get instant server metrics")
	.arguments("<serverSlug:string>")
	.option(
		"--now",
		"Get metrics now",
	)
	.option(
		"-t, --token <token:string>",
		"API token for authentication",
	)
	.action(async (options, serverSlug) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);
		const response = await client.servers.metrics({
			now: !!options.now,
			serverSlug,
		});

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}

		const body = response.response.body;
		const isNow = options.now;

		// Extract Disk metrics
		const diskAllowed = body.disk.allowed;
		let diskUsed: number, diskTimestamp: string;
		if (isNow) {
			// @ts-expect-error:
			diskUsed = body.disk.lastSamplings.amount;
			// @ts-expect-error:
			diskTimestamp = body.disk.lastSamplings.timestamp;
		} else {
			const latestDisk = body.disk.samplings.slice(-1)[0];
			diskUsed = latestDisk.amount;
			diskTimestamp = latestDisk.timestamp;
		}

		// Extract Network metrics
		const networkAllowed = body.network.allowed;
		let networkInUsed: number, networkInTimestamp: string;
		let networkOutUsed: number, networkOutTimestamp: string;
		if (isNow) {
			// @ts-expect-error:
			networkInUsed = body.network.latestIngressSampling.amount;
			// @ts-expect-error:
			networkInTimestamp = body.network.latestIngressSampling.timestamp;
			// @ts-expect-error:
			networkOutUsed = body.network.latestEgressSampling.amount;
			// @ts-expect-error:
			networkOutTimestamp = body.network.latestEgressSampling.timestamp;
		} else {
			const latestIngress = body.network.ingressSamplings.slice(-1)[0];
			networkInUsed = latestIngress.amount;
			networkInTimestamp = latestIngress.timestamp;
			const latestEgress = body.network.egressSamplings.slice(-1)[0];
			networkOutUsed = latestEgress.amount;
			networkOutTimestamp = latestEgress.timestamp;
		}

		// Extract CPU metrics
		let cpuUsed: number, cpuTimestamp: string;
		if (isNow) {
			// @ts-expect-error:
			cpuUsed = body.cpu.latestUsageSampling.amount;
			// @ts-expect-error:
			cpuTimestamp = body.cpu.latestUsageSampling.timestamp;
		} else {
			const latestCpu = body.cpu.usageSamplings.slice(-1)[0];
			cpuUsed = latestCpu.amount;
			cpuTimestamp = latestCpu.timestamp;
		}

		// Extract Processes metrics
		let processesUsed: number, processesTimestamp: string;
		if (isNow) {
			// @ts-expect-error:
			processesUsed = body.processes.latestProcessesSampling.amount;
			// @ts-expect-error:
			processesTimestamp = body.processes.latestProcessesSampling.timestamp;
		} else {
			const latestProcesses = body.processes.processesSamplings.slice(-1)[0];
			processesUsed = latestProcesses.amount;
			processesTimestamp = latestProcesses.timestamp;
		}

		// Extract Memory metrics
		let memoryUsed: number, memoryTimestamp: string;
		if (isNow) {
			// @ts-expect-error:
			memoryUsed = body.memory.latestUsageSampling.amount;
			// @ts-expect-error:
			memoryTimestamp = body.memory.latestUsageSampling.timestamp;
		} else {
			const latestMemory = body.memory.usageSamplings.slice(-1)[0];
			memoryUsed = latestMemory.amount;
			memoryTimestamp = latestMemory.timestamp;
		}

		// Build and display the table
		new Table()
			.header(["Metric", "Used", "Allowed", "Timestamp"])
			.body([
				["Disk", `${diskUsed}`, `${diskAllowed}`, diskTimestamp],
				[
					"Network In",
					`${networkInUsed}`,
					`${networkAllowed}`,
					networkInTimestamp,
				],
				[
					"Network Out",
					`${networkOutUsed}`,
					`${networkAllowed}`,
					networkOutTimestamp,
				],
				["CPU", `${cpuUsed}`, "-", cpuTimestamp],
				["Processes", `${processesUsed}`, "-", processesTimestamp],
				["Memory", `${memoryUsed}`, "-", memoryTimestamp],
			])
			.border(true)
			.render();
	});
