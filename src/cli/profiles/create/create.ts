import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { wrapSlug } from "../../../test_utils.ts";
import { Webdock } from "@webdock/sdk";

import { stringify } from "csv-stringify/sync";
import { getToken } from "../../../config.ts";

export const createCommand = new Command()
	.description("Create a Custom hardware profile!")
	.option("-t, --token <token:string>", "API token used for authentication")
	.option("--cores <cores:number>", "Number of CPU threads", { required: true })
	.option("--ram <ram:number>", "RAM in GB", { required: true })
	.option("--disk <disk:number>", "Disk size in GBs", { required: true })
	.option("--network <network:number>", "Network bandwidth in Gbit/s", { required: true })
	.option("--platform <platform:string>", "Hardware platform", { required: true })
	.option("--json", "Display the results in a json format instead of a Table", { conflicts: ["csv"] })
	.option("--csv", "Print the result as a CSV", { conflicts: ["json"] })
	.action(async (options) => {
		const token = await getToken(options.token);
		const client = new Webdock(token);

		const response = await client.profiles.create({
			cpu_threads: options.cores,
			disk_space: options.disk,
			network_bandwidth: options.network,
			platform: options.platform,
			ram: options.ram,
		});

		if (!response.success) {
			console.error(response.error);
			Deno.exit(1);
		}

		if (options.json) {
			console.log(JSON.stringify(response.response));
			return;
		}

		if (options.csv) {
			const keys = ["slug", "cpu_threads", "name", "ram", "disk", "platform"];
			const data = response.response.body as unknown as Record<string, unknown> & {
				cpu: { threads: number };
			};

			// Flatten nested fields for CSV output
			const row = keys.map((key) => {
				if (key === "cpu_threads") return data.cpu.threads;
				if (key === "price") {
					const d = data?.price as { amount: number; currency: string };
					`${d.amount / 100} ${d.currency}`;
				}
				return data[key];
			});

			console.log(
				stringify([row], {
					columns: keys,
					header: true,
				}).trim(),
			);
			return;
		}

		const data = response.response.body;

		new Table()
			.header(["Slug", "vCPU", "Disk", "Platform", "Ram"])
			.body([
				[wrapSlug(data.slug), data.cpu.threads, data.disk, data.platform, data.ram],
			])
			.align("center")
			.border()
			.render();
	});
