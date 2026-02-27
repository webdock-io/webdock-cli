import { uselessFacts } from "../utils/useless-facts.ts";

export class FunFact {
	async show(): Promise<void> {
		console.log(">> Did you know: " + await uselessFacts());
	}
}
