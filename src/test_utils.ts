export const isTesting = true;

export function extractIdsFromStdOut(stdout: string) {
	const ids = [...stdout.matchAll(/<id>(\d+)<\/id>/g)]
		.map((match) => parseInt(match[1], 10)).filter((value) => !isNaN(value));
	return ids;
}

export function extractSlugsFromStdOut(stdout: string) {
	const slugs = [...stdout.matchAll(/<slug>(.+?)<\/slug>/gs)]
		.map((match) => match[1]);
	return slugs;
}

export function wrapSlug(slug: string) {
	return isTesting ? `<slug>${slug}</slug>` : slug;
}

export function wrapId(id: string | number) {
	return isTesting ? `<id>${id}</id>` : id;
}
