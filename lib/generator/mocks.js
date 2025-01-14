import schemaFaker from "@stoplight/json-schema-sampler";
import jsYaml from "js-yaml";
import fs from "fs";
import path from "path";
import log from "../logger.js";
import { t } from "../i18n/index.js";

/**
 * Module for creating dummy mock data based on JSON schema
 * @module generatorMocks
 * @param {string} folderPath - the path for the component that should be created
 * @param {object} filesConfig - the files configuration from the user configuration object
 */
export default async function mockGenerator(folderPath, filesConfig) {
	return new Promise((resolve, reject) => {
		if (!folderPath) {
			log("error", t("dataGenerator.noComponentFolderDefined"));

			reject(t("dataGenerator.noComponentFolderDefined"));
		}

		log(
			"info",
			t("dataGenerator.starting").replace("{{fileName}}", folderPath),
		);

		const mockFilePath = `${path.join(folderPath, filesConfig.mocks.name)}.${
			filesConfig.mocks.extension[0]
		}`;
		const schemaFilePath = `${path.join(folderPath, filesConfig.schema.name)}.${
			filesConfig.schema.extension
		}`;

		readFile(schemaFilePath, filesConfig)
			.then((result) => {
				try {
					const content = getContent(filesConfig.mocks.extension[0], result);

					readFile(mockFilePath, filesConfig)
						.then((res) => {
							if (res === "") {
								createFile(content, mockFilePath)
									.then(() => resolve())
									.catch((message) => reject(message));
							} else {
								const message = t("dataGenerator.dataFileExists").replace(
									"{{fileName}}",
									mockFilePath,
								);
								log("error", message);
								reject(message);
							}
						})
						.catch(() => {
							createFile(content, mockFilePath)
								.then(() => resolve())
								.catch((message) => reject(message));
						});
					// eslint-disable-next-line no-unused-vars
				} catch (e) {
					const message = t("dataGenerator.schemaFileCantBeParsed").replace(
						"{{fileName}}",
						schemaFilePath,
					);
					log("error", message);
					reject(message);
				}
			})
			.catch(() => {
				const message = t("dataGenerator.noSchemaFile").replace(
					"{{fileName}}",
					schemaFilePath,
				);
				log("error", message);
				reject(message);
			});
	});
}

/**
 * Returns the dummy mock data in the correct format
 * @param {string} fileType - the file type of the mock data that should be created
 * @param {object} schema - the JSON schema object
 * @returns {string} the dummy mock data
 */
function getContent(fileType, schema) {
	let content;
	const data = schemaFaker.sample(schema);

	switch (fileType) {
		case "yaml":
		case "yml":
			content = jsYaml.dump(data);
			break;
		case "json":
			content = JSON.stringify(data, null, 2);
			break;
		case "js":
			content = `module.exports = ${JSON.stringify(data, null, 2)}
      `;
			break;
		default:
			content = "";
	}

	return content;
}

/**
 * Creates the mock file with the dummy mock data
 * @param {string} content - the content for the mock file
 * @param {string} mockFilePath - the path to the mock file
 */
function createFile(content, mockFilePath) {
	return new Promise((resolve, reject) => {
		fs.writeFile(mockFilePath, content, (err) => {
			if (err) {
				log("error", err);
				reject(err);
			} else {
				log("success", t("generator.done"));
				resolve();
			}
		});
	});
}

/**
 * Reads the content of a given file
 * @param {string} filePath - path to a file that should be read
 * @param {object} filesConfig
 * @returns {Promise} gets resolved when the file has been read
 */
function readFile(filePath, filesConfig) {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, "utf8", (err, result) => {
			if (err) {
				reject(err);
			} else {
				try {
					if (["yaml", "yml"].includes(filesConfig.schema.extension)) {
						resolve(jsYaml.load(result));
					} else {
						resolve(JSON.parse(result));
					}
				} catch (err) {
					reject(err);
				}
			}
		});
	});
}
