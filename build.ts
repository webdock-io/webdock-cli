#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-sys --allow-net --allow-run

const platforms = [
	{ target: "x86_64-pc-windows-msvc", suffix: "-windows.exe", folder: "" },
	{ target: "x86_64-unknown-linux-gnu", suffix: "-linux-x86_64", folder: "" },
	{ target: "x86_64-apple-darwin", suffix: "-macos", folder: "" },
	{ target: "aarch64-apple-darwin", suffix: "-macos-arm64", folder: "" },
	{ target: "aarch64-unknown-linux-gnu", suffix: "-linux-arm64", folder: "" },
];

async function build() {
	console.log("Building Webdock CLI tool...");

	for (const platform of platforms) {
		const outputFolder = `binaries/${platform.folder}`;
		const outputFile = `${outputFolder}/webdock${platform.suffix}`;

		console.log(`\n🔨 Building for ${platform.target}...`);
		console.log(`📁 Output folder: ${outputFolder}`);

		// Create output directory
		try {
			await Deno.mkdir(outputFolder, { recursive: true });
		} catch (error) {
			if (!(error instanceof Deno.errors.AlreadyExists)) {
				console.error(`Failed to create directory ${outputFolder}:`, error);
				continue;
			}
			// If directory exists, just continue normally
		}

		console.log(`⚙️  Compiling...`);

		// Compile using Deno's built-in Command
		const command = new Deno.Command("deno", {
			args: [
				"compile",
				"--allow-net",
				"--allow-read",
				"--allow-write",
				"--allow-env",
				"--allow-run",
				"--no-check",
				"--target",
				platform.target,
				"--output",
				outputFile,
				"./src/main.ts",
			],
		});

		const { code, stderr } = await command.output();

		if (code === 0) {
			console.log(`✅ Successfully built ${outputFile}`);
		} else {
			console.error(`❌ Failed to build for ${platform.target}`);
			console.error("Error:", new TextDecoder().decode(stderr));
		}
	}

	console.log("\n✨ Build completed!");
}

await build();
export { };
