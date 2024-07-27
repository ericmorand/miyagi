import fs from "node:fs";
import { createSynchronousEnvironment, createSynchronousFilesystemLoader } from "twing";

const loader = createSynchronousFilesystemLoader(fs);
const twing = createSynchronousEnvironment(loader);

export default {
	components: {
		folder: "tests/_setup/components",
	},
	docs: null,
	engine: {
		name: "twing",
		instance: twing,
	},
	files: {
		templates: {
			name: "<component>",
			extension: "twig",
		},
	},
	schema: {
		strict: false,
	},
};
