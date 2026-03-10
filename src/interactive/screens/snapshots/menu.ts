import { Select } from "@cliffy/prompt";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { navigator } from "../../navigator.ts";

export async function snapshotsMenuScreen(slug: string) {
	const choice = await Select.prompt({
		message: "What do you want to do ?",
		options: [
			{ name: "Create new snapshot!", value: "NEW" },
			{ name: "List and Restore Snapshots", value: "LIST_SNAPSHOTS" },
		].concat(goBackOption),
	});

	if (isGoBack(choice)) return navigator.goToServerActions(slug);

	switch (choice) {
		case "LIST_SNAPSHOTS":
			await navigator.goToSnapshots(slug);
			return;
		case "NEW":
			await navigator.runCreateSnapshot(slug);
			return;
	}
}
