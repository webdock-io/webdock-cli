interface INavigator {
	goToMain(): Promise<void>;
	goToServerList(): Promise<void>;
	goToServerActions(slug: string): Promise<void>;
	goToServerScripts(slug: string): Promise<void>;
	goToShellUsersMenu(slug: string): Promise<void>;
	goToShellUsers(slug: string): Promise<void>;
	goToSnapshotsMenu(slug: string): Promise<void>;
	goToSnapshots(slug: string): Promise<void>;
	goToScriptsList(): Promise<void>;
	goToHooksList(): Promise<void>;
	goToKeysList(): Promise<void>;
	goToKeyActions(id: number): Promise<void>;
	goToScriptActions(id: number): Promise<void>;
	goToSnapshotActions(serverSlug: string, snapshotId: number): Promise<void>;
	goToServerScriptsList(serverSlug: string): Promise<void>;
	goToKeysMenu(): Promise<void>;
	goToHooksMenu(): Promise<void>;
	goToScriptsMenu(): Promise<void>;
	runCreateServer(): Promise<void>;
	runReboot(slug: string): Promise<void>;
	runFetchFile(slug: string): Promise<void>;
	runMetrics(slug: string): Promise<void>;
	runStop(slug: string): Promise<void>;
	runStart(slug: string): Promise<void>;
	runDeleteServer(slug: string): Promise<void>;
	runReinstall(slug: string): Promise<void>;
	runResize(slug: string): Promise<void>;
	runArchive(slug: string): Promise<void>;
	runDeleteSnapshot(serverSlug: string, snapshotId: number): Promise<void>;
	runRestoreSnapshot(serverSlug: string, snapshotId: number): Promise<void>;
	runDeleteScript(id: number): Promise<void>;
	runUpdateScript(id: number): Promise<void>;
	runDeleteShellUser(slug: string, userId: number): Promise<void>;
	runUpdateShellUser(serverSlug: string, shellUserId: number): Promise<void>;
	runDeleteSSHKey(id: number): Promise<void>;
	runDeleteServerScript(serverSlug: string, scriptId: number): Promise<void>;
	runExecuteServerScript(serverSlug: string, scriptId: number): Promise<void>;
	runCreateHook(): Promise<void>;
	runCreateSSHKey(): Promise<void>;
	runCreateSnapshot(slug: string): Promise<void>;
	runCreateShellUser(slug: string): Promise<void>;
	runCreateScript(): Promise<void>;
	runCreateServerScript(slug: string): Promise<void>;
}

export const navigator: INavigator = {
	async goToMain(): Promise<void> {
		const { main } = await import("./index.ts");
		return main();
	},
	async goToServerList(): Promise<void> {
		const { serverListScreen } = await import("./screens/servers/list.ts");
		return serverListScreen();
	},
	async goToServerActions(slug: string): Promise<void> {
		const { serverActionsScreen } = await import("./screens/servers/actions.ts");
		return serverActionsScreen(slug);
	},
	async goToServerScripts(slug: string): Promise<void> {
		const { serverScriptsMenuScreen } = await import("./screens/servers/scripts/menu.ts");
		return serverScriptsMenuScreen(slug);
	},
	async goToShellUsersMenu(slug: string): Promise<void> {
		const { shellUsersMenuScreen } = await import("./screens/shellusers/menu.ts");
		return shellUsersMenuScreen(slug);
	},
	async goToShellUsers(slug: string): Promise<void> {
		const { shellUsersListScreen } = await import("./screens/shellusers/list.ts");
		return shellUsersListScreen(slug);
	},
	async goToSnapshotsMenu(slug: string): Promise<void> {
		const { snapshotsMenuScreen } = await import("./screens/snapshots/menu.ts");
		return snapshotsMenuScreen(slug);
	},
	async goToSnapshots(slug: string): Promise<void> {
		const { snapshotsListScreen } = await import("./screens/snapshots/list.ts");
		return snapshotsListScreen(slug);
	},
	async goToScriptsList(): Promise<void> {
		const { scriptsListScreen } = await import("./screens/scripts/list.ts");
		return scriptsListScreen();
	},
	async goToHooksList(): Promise<void> {
		const { hooksListScreen } = await import("./screens/hooks/list.ts");
		return hooksListScreen();
	},
	async goToKeysList(): Promise<void> {
		const { keysListScreen } = await import("./screens/public-keys/list.ts");
		return keysListScreen();
	},
	async goToKeyActions(id: number): Promise<void> {
		const { keyActionsScreen } = await import("./screens/public-keys/actions.ts");
		return keyActionsScreen(id);
	},
	async goToScriptActions(id: number): Promise<void> {
		const { scriptActionsScreen } = await import("./screens/scripts/actions.ts");
		return scriptActionsScreen(id);
	},
	async goToSnapshotActions(serverSlug: string, snapshotId: number): Promise<void> {
		const { snapshotActionsScreen } = await import("./screens/snapshots/actions.ts");
		return snapshotActionsScreen(serverSlug, snapshotId);
	},
	async goToServerScriptsList(serverSlug: string): Promise<void> {
		const { serverScriptsActionsScreen } = await import("./screens/servers/scripts/actions.ts");
		return serverScriptsActionsScreen(serverSlug);
	},
	async goToKeysMenu(): Promise<void> {
		const { keysMenuScreen } = await import("./screens/public-keys/menu.ts");
		return keysMenuScreen();
	},
	async goToHooksMenu(): Promise<void> {
		const { hooksMenuScreen } = await import("./screens/hooks/menu.ts");
		return hooksMenuScreen();
	},
	async goToScriptsMenu(): Promise<void> {
		const { scriptsMenuScreen } = await import("./screens/scripts/menu.ts");
		return scriptsMenuScreen();
	},
	async runCreateServer(): Promise<void> {
		const { createWebdockServer } = await import("./flows/servers/create.ts");
		return createWebdockServer();
	},
	async runReboot(slug: string): Promise<void> {
		const { reboot } = await import("./flows/servers/reboot.ts");
		return reboot(slug);
	},
	async runFetchFile(slug: string): Promise<void> {
		const { fetchFile } = await import("./flows/servers/fetch-file.ts");
		return fetchFile(slug);
	},
	async runMetrics(slug: string): Promise<void> {
		const { metricsService } = await import("./flows/servers/metrics.ts");
		return metricsService(slug);
	},
	async runStop(slug: string): Promise<void> {
		const { stopServer } = await import("./flows/servers/stop.ts");
		return stopServer(slug);
	},
	async runStart(slug: string): Promise<void> {
		const { startServerAction } = await import("./flows/servers/start.ts");
		return startServerAction(slug);
	},
	async runDeleteServer(slug: string): Promise<void> {
		const { deleteServer } = await import("./flows/servers/delete.ts");
		return deleteServer(slug);
	},
	async runReinstall(slug: string): Promise<void> {
		const { reinstall } = await import("./flows/servers/reinstall.ts");
		return reinstall(slug);
	},
	async runResize(slug: string): Promise<void> {
		const { resizeServerAction } = await import("./flows/servers/resize.ts");
		return resizeServerAction(slug);
	},
	async runArchive(slug: string): Promise<void> {
		const { archive } = await import("./flows/servers/archive.ts");
		return archive(slug);
	},
	async runDeleteSnapshot(serverSlug: string, snapshotId: number): Promise<void> {
		const { deleteSnapshot } = await import("./flows/snapshots/delete.ts");
		return deleteSnapshot(serverSlug, snapshotId);
	},
	async runRestoreSnapshot(serverSlug: string, snapshotId: number): Promise<void> {
		const { restoreSnapshot } = await import("./flows/servers/restore.ts");
		return restoreSnapshot(serverSlug, snapshotId);
	},
	async runDeleteScript(id: number): Promise<void> {
		const { deleteScript } = await import("./flows/scripts/delete.ts");
		return deleteScript(id);
	},
	async runUpdateScript(id: number): Promise<void> {
		const { updateScript } = await import("./flows/scripts/update.ts");
		return updateScript(id);
	},
	async runDeleteShellUser(slug: string, userId: number): Promise<void> {
		const { deleteShellUser } = await import("./flows/servers/shellusers/delete.ts");
		return deleteShellUser({ slug, userId });
	},
	async runUpdateShellUser(serverSlug: string, shellUserId: number): Promise<void> {
		const { updateShellUserKeys } = await import("./flows/servers/shellusers/edit.ts");
		return updateShellUserKeys({ serverSlug, shellUserId });
	},
	async runDeleteSSHKey(id: number): Promise<void> {
		const { deleteSSHKey } = await import("./flows/public-keys/delete.ts");
		return deleteSSHKey(id);
	},
	async runDeleteServerScript(serverSlug: string, scriptId: number): Promise<void> {
		const { deleteServerScript } = await import("./flows/servers/scripts/delete.ts");
		return deleteServerScript(serverSlug, scriptId);
	},
	async runExecuteServerScript(serverSlug: string, scriptId: number): Promise<void> {
		const { executeScriptOnServer } = await import("./flows/servers/scripts/execute.ts");
		return executeScriptOnServer(serverSlug, scriptId);
	},
	async runCreateHook(): Promise<void> {
		const { createHook } = await import("./flows/hooks/create.ts");
		return createHook();
	},
	async runCreateSSHKey(): Promise<void> {
		const { createSSHKey } = await import("./flows/public-keys/create.ts");
		return createSSHKey();
	},
	async runCreateSnapshot(slug: string): Promise<void> {
		const { createSnapshot } = await import("./flows/snapshots/create.ts");
		return createSnapshot(slug);
	},
	async runCreateShellUser(slug: string): Promise<void> {
		const { createShellUser } = await import("./flows/servers/shellusers/create.ts");
		return createShellUser(slug);
	},
	async runCreateScript(): Promise<void> {
		const { createScript } = await import("./flows/scripts/create.ts");
		return createScript();
	},
	async runCreateServerScript(slug: string): Promise<void> {
		const { createServerScript } = await import("./flows/servers/scripts/create.ts");
		return createServerScript(slug);
	},
};
