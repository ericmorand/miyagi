import path from "path";
import config from "../../../default-config.js";
import * as helpers from "../../../helpers.js";
import { getThemeMode, getComponentTextDirection } from "../../helpers.js";

/**
 * @param {object} object - parameter object
 * @param {object} object.res - the express response object
 * @param {object} object.component
 * @param {string} [object.variation] - the variation name
 * @param {Function} [object.cb] - callback function
 * @param {object} object.cookies
 */
export default async function renderMainComponent({
	res,
	component,
	variation,
	cb,
	cookies,
}) {
	let iframeSrc = component.route.default;
	const themeMode = getThemeMode(cookies);
	const componentTextDirection = getComponentTextDirection(cookies);

	if (variation) {
		if (global.config.isBuild) {
			iframeSrc = iframeSrc.replace(
				/\.html$/,
				`-variation-${helpers.normalizeString(variation)}.html`,
			);
		} else {
			iframeSrc += `&variation=${variation}`;
		}
	}

	if (global.config.isBuild) {
		iframeSrc = iframeSrc.replace(/\.html$/, "-embedded.html");
	} else {
		iframeSrc += "&embedded=true";
	}

	await res.render(
		"main.twig",
		{
			lang: global.config.ui.lang,
			namespaces: {
				miyagi: path.join(import.meta.dirname, "../../../../frontend/views"),
			},
			folders: global.state.menu,
			components: global.state.components,
			flatUrlPattern: global.config.isBuild
				? "/show-{{component}}.html"
				: "/show?file={{component}}",
			iframeSrc,
			requestedComponent: component.paths.dir.short,
			requestedVariation: variation,
			projectName: config.projectName,
			userProjectName: global.config.projectName,
			indexPath: global.config.indexPath.embedded,
			miyagiDev: !!process.env.MIYAGI_DEVELOPMENT,
			isBuild: global.config.isBuild,
			theme: themeMode
				? Object.assign(global.config.ui.theme, { mode: themeMode })
				: global.config.ui.theme,
			componentTextDirection:
				componentTextDirection || global.config.components.textDirection,
			basePath: global.config.isBuild ? global.config.build.basePath : "/",
			uiTextDirection: global.config.ui.textDirection,
		},
		(html) => {
			if (res.send) {
				res.send(html);
			}

			if (cb) {
				cb(null, html);
			}
		},
	);
}
