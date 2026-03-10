import { colors } from "@cliffy/ansi/colors";

type ServerEntry = { status: string; name: string; slug: string; ipv4: string | null; location: string; profile: string; date: string };

export function formatServerOption(server: ServerEntry, index: number) {
	const {
		status,
		name,
		slug,
		ipv4,
		location,
		profile,
		date,
	} = server;

	const statusIcon = status === "running" ? "🟢" : "🔴";
	const paddedName = name.padEnd(20);
	const formattedDate = new Date(date).toLocaleDateString();
	const formattedProfile = colors.underline.bold.italic.bgBlue(
		`Resources: ${profile}`.padEnd(50).slice(0, 33),
	);
	return {
		name: `\n\t
  \t${index + 1}. ${statusIcon} ${paddedName.slice(0, 18)} | ${slug}
  \tIP: ${ipv4} | Location: ${location}
  \t${formattedProfile}  | Created: ${formattedDate}
  -----------------------------
      `.trim(),
		value: slug,
	};
}
