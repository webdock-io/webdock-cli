type Location = {
	id: string;
	name: string;
	city: string;
	country: string;
};

export function resolveLocationId(
	serverLocation: string,
	locations: Location[],
): string | null {
	const normalizedServerLocation = normalize(serverLocation);

	for (const location of locations) {
		const variants = [
			location.id,
			location.name,
			location.city,
			location.country,
			`${location.city}, ${location.country}`,
			`${location.name} (${location.city}, ${location.country})`,
		].map(normalize);

		if (variants.includes(normalizedServerLocation)) {
			return location.id;
		}
	}

	return null;
}

function normalize(value: string) {
	return value.trim().toLowerCase();
}
