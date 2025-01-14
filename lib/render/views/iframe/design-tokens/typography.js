import path from "node:path";

import config from "../../../../default-config.js";
import { getThemeMode } from "../../../helpers.js";
import {
	getTypography,
	getMediaQueries,
} from "../../../../styleguide/index.js";

export default async function ({ res, cb, cookies }) {
	const typography = global.state.css
		? getTypography(
				global.state.css,
				global.config.assets.customProperties.prefixes.typo,
			)
		: [];
	const mediaQueries = global.state.css
		? getMediaQueries(global.state.css)
		: [];
	const themeMode = getThemeMode(cookies);

	await res.render(
		"design-tokens/typography.twig",
		{
			additionalCssFiles: global.config.assets?.customProperties?.files || [],
			isBuild: global.config.isBuild,
			lang: global.config.ui.lang,
			mediaQueries,
			miyagiDev: !!process.env.MIYAGI_DEVELOPMENT,
			namespaces: {
				miyagi: path.join(import.meta.dirname, "../../../../../frontend/views"),
			},
			typography: typography.length > 0 ? typography : null,
			projectName: config.projectName,
			theme: themeMode
				? Object.assign(global.config.ui.theme, { mode: themeMode })
				: global.config.ui.theme,
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
