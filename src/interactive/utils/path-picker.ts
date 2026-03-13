#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-sys --allow-net --allow-run

import { join } from 'node:path';
import { readdirSync, accessSync, constants } from 'node:fs';
import { homedir, platform } from 'node:os';
import type { Dirent } from 'node:fs';
import { Select } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";


type Entry = {
    label: string;
    path: string;
    kind: "dir" | "file" | "action" | "volume";
    accessible: boolean;
};

type Volume = {
    label: string;
    path: string;
};


async function runCommand(cmd: string[]): Promise<string> {
    try {
        const proc = new Deno.Command(cmd[0], { args: cmd.slice(1), stdout: "piped", stderr: "null" });
        const { stdout } = await proc.output();
        return new TextDecoder().decode(stdout);
    } catch {
        return "";
    }
}

async function getVolumes(): Promise<Volume[]> {
    const os = platform();

    if (os === "win32") {
        return getWindowsPartitions();
    } else if (os === "darwin") {
        return getMacVolumes();
    } else {
        return getLinuxVolumes();
    }
}

async function getWindowsPartitions(): Promise<Volume[]> {
    // Use PowerShell to list logical drives with labels
    const out = await runCommand([
        "powershell", "-NoProfile", "-Command",
        "Get-PSDrive -PSProvider FileSystem | Select-Object -Property Name,Root,Description | ConvertTo-Json"
    ]);

    try {
        const drives = JSON.parse(out);
        const arr = Array.isArray(drives) ? drives : [drives];
        return arr
            .filter((d: { Root?: string }) => d.Root)
            .map((d: { Name: string; Root: string; Description?: string }) => ({
                label: d.Description ? `${d.Name}: — ${d.Description}` : `${d.Name}:`,
                path: d.Root,
            }));
    } catch {
        // Fallback: probe A-Z
        const volumes: Volume[] = [];
        for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
            const root = `${letter}:\\`;
            try {
                accessSync(root, constants.R_OK);
                volumes.push({ label: `${letter}:`, path: root });
            } catch { /* skip */ }
        }
        return volumes;
    }
}

async function getMacVolumes(): Promise<Volume[]> {

    const volumesDir = "/Volumes";
    const volumes: Volume[] = [{ label: "/ (Root)", path: "/" }];

    try {
        const entries = readdirSync(volumesDir, { withFileTypes: true });
        for (const e of entries) {
            if (e.isDirectory() || e.isSymbolicLink()) {
                const p = join(volumesDir, e.name);
                try {
                    accessSync(p, constants.R_OK);
                    volumes.push({ label: `📀 ${e.name}`, path: p });
                } catch { /* no access */ }
            }
        }
    } catch { /* /Volumes not accessible */ }

    return volumes;
}

async function getLinuxVolumes(): Promise<Volume[]> {
    const volumes: Volume[] = [];

    // Try lsblk for mounted filesystems
    const lsblkOut = await runCommand([
        "lsblk", "-J", "-o", "NAME,MOUNTPOINT,LABEL,FSTYPE,SIZE"
    ]);

    if (lsblkOut) {
        try {
            const data = JSON.parse(lsblkOut);
            const flatten = (devices: LsblkDevice[]): LsblkDevice[] =>
                devices.flatMap(d => [d, ...(d.children ? flatten(d.children) : [])]);

            type LsblkDevice = {
                name: string;
                mountpoint?: string;
                label?: string;
                fstype?: string;
                size?: string;
                children?: LsblkDevice[];
            };

            for (const dev of flatten(data.blockdevices ?? [])) {
                if (!dev.mountpoint || dev.mountpoint === "[SWAP]") continue;
                const name = dev.label
                    ? `${dev.label} (${dev.name}) ${dev.size ?? ""}`
                    : `${dev.name} ${dev.size ?? ""}`;
                volumes.push({ label: `💽 ${name} → ${dev.mountpoint}`, path: dev.mountpoint });
            }
        } catch { /* parse error */ }
    }

    // Fallback: parse /proc/mounts
    if (volumes.length === 0) {
        try {
            const mounts = await Deno.readTextFile("/proc/mounts");
            const seen = new Set<string>();
            for (const line of mounts.split("\n")) {
                const [device, mountpoint, fstype] = line.split(" ");
                if (!mountpoint || seen.has(mountpoint)) continue;
                if (["tmpfs", "devtmpfs", "sysfs", "proc", "devpts", "cgroup", "cgroup2",
                    "pstore", "bpf", "tracefs", "debugfs", "securityfs", "fusectl",
                    "hugetlbfs", "mqueue", "autofs"].includes(fstype)) continue;
                seen.add(mountpoint);
                const label = device.startsWith("/dev/")
                    ? `💽 ${device.replace("/dev/", "")} → ${mountpoint}`
                    : `🔗 ${mountpoint}`;
                volumes.push({ label, path: mountpoint });
            }
        } catch { /* no /proc/mounts */ }
    }

    // Always ensure root is present
    if (!volumes.find(v => v.path === "/")) {
        volumes.unshift({ label: "/ (Root)", path: "/" });
    }

    return volumes;
}


export class PathPicker {
    constructor(private readonly root = homedir()) { }

    async pickDir(): Promise<string> {
        const start = await this.pickVolume();
        return this.navigate(start, { dirsOnly: true });
    }

    async pickFile(): Promise<string> {
        const start = await this.pickVolume();
        return this.navigate(start, { dirsOnly: false });
    }


    private async pickVolume(): Promise<string> {
        const volumes = await getVolumes();

        if (volumes.length === 0) return this.root;
        if (volumes.length === 1) return volumes[0].path;

        // Add home dir as a quick shortcut
        const homeEntry: Volume = { label: `🏠 Home (${this.root})`, path: this.root };
        const all = [homeEntry, ...volumes];

        const options = all.map(v => ({
            name: `  ${colors.brightCyan(v.label)}`,
            value: v.path,
        }));

        return Select.prompt({
            message: colors.bold("  Select a volume / partition to browse"),
            indent: "  ",
            search: true,
            options,
        });
    }

    private async navigate(dir: string, opts: { dirsOnly: boolean }): Promise<string> {
        const entries = this.readDir(dir, opts.dirsOnly);
        const chosen = await this.prompt(dir, entries);

        switch (chosen.kind) {
            case "action": return chosen.path;
            case "volume": return this.pickVolume().then(v => this.navigate(v, opts));
            case "dir": return this.navigate(chosen.path, opts);
            case "file": return chosen.path;
        }
    }

    private async prompt(dir: string, entries: Entry[]): Promise<Entry> {
        return Select.prompt({
            search: true,
            message: `  ${colors.dim(dir)}`,
            indent: "  ",
            options: entries.map(e => ({
                name: this.format(e),
                value: e,
                disabled: !e.accessible,
            })),
        });
    }

    private readDir(dir: string, dirsOnly: boolean): Entry[] {
        if (!this.canRead(dir)) return [];

        const nav: Entry[] = [
            { label: "✔  Choose here", path: dir, kind: "action", accessible: true },
            { label: "⬆  Change volume / partition", path: "", kind: "volume", accessible: true },
            { label: ".", path: dir, kind: "dir", accessible: true },
            { label: "..", path: join(dir, ".."), kind: "dir", accessible: true },
        ];

        let children: Entry[];
        try {
            children = readdirSync(dir, { withFileTypes: true })
                .filter((e: Dirent) => !dirsOnly || e.isDirectory())
                .map((e: Dirent): Entry => ({
                    label: e.name,
                    path: join(dir, e.name),
                    kind: e.isDirectory() ? "dir" : "file",
                    accessible: this.canRead(join(dir, e.name)),
                }));
        } catch {
            children = [];
        }

        return [...nav, ...children];
    }

    private format(e: Entry): string {
        const icon = { action: "  ", volume: "  ", dir: "📁 ", file: "📄 " }[e.kind];
        const label = e.accessible ? e.label : `${e.label} ${colors.red("(no access)")}`;
        const style =
            e.kind === "action" ? colors.brightGreen :
                e.kind === "volume" ? colors.brightMagenta :
                    colors.brightBlue;
        return `${icon}${style(label)}`;
    }

    private canRead(path: string): boolean {
        try { accessSync(path, constants.R_OK); return true; }
        catch { return false; }
    }
}
