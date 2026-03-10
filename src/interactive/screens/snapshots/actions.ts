import { Select } from "@cliffy/prompt";
import { goBackOption, isGoBack } from "../../utils/navigation.ts";
import { navigator } from "../../navigator.ts";

export async function snapshotActionsScreen(
	serverSlug: string,
	snapshotId: number,
) {
	const choice = await Select.prompt({
		message: "Chose an operation to perform",
		options: [{
			value: "RESTORE",
			name: "Restore Snapshot",
		}, {
			name: `Delete Snapshot ${snapshotId}`,
			value: "DELETE",
		}].concat(goBackOption),
	});

	if (isGoBack(choice)) return navigator.goToSnapshots(serverSlug);

	if (choice == "DELETE") {
		await navigator.runDeleteSnapshot(serverSlug, snapshotId);
	} else if (choice == "RESTORE") {
		await navigator.runRestoreSnapshot(serverSlug, snapshotId);
	}
}
