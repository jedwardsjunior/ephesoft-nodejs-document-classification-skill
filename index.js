'use strict';

/**
 * @author - jedwards
 * @date - September 2017
 */

// Load the required NPM modules
const BoxSkillsMetadataBuilder = require('metadata-builder');
const BoxSkillsMetadataSaver = require('metadata-saver');
const BoxSDK = require('box-node-sdk');
const Request = require('request');
const Unescape = require('unescape-js');
const XML2JS = require('xml2js');

/**
 * exports.handler()
 *
 * This is the main function that the Lamba will call when invoked.
 *
 * Inputs:
 * (JSON) event - data from the event, including the payload of the webhook, that triggered this function call
 * (JSON) context - additional context information from the request (unused in this example)
 * (function) callback - the function to call back to once finished
 *
 * Outputs:
 * (void)
 */
exports.handler = (event, context, callback) => {
	var sdk = new BoxSDK({
		clientID: process.env.BOX_CLIENT_ID,
		clientSecret: process.env.BOX_CLIENT_SECRET,
		appAuth: {
			keyID: process.env.BOX_KEY_ID,
			privateKey: Unescape(process.env.BOX_PRIVATE_KEY),
			passphrase: process.env.BOX_PASSPHRASE
		},
	});

	var enterpriseID = process.env.BOX_ENTERPRISE_ID;
	var webhookData = JSON.parse(event.body);
	var fileID = webhookData.source.id;

	var client = sdk.getAppAuthClient('enterprise', enterpriseID);
	getDocumentClassification(client, fileID, (error, documentClassificationResponse) => {
		BoxSkillsMetadataSaver.saveMetadata(client, fileID, BoxSkillsMetadataBuilder.getMetadataValueForDocumentClassification(documentClassificationResponse), callback);
    });
};

/**
 * getDocumentClassification()
 *
 * Helper function to pass the contents of the PDF file to the Ephesoft OcrClassifyExtract API to classify the
 * document's type.
 *
 * Inputs:
 * (Object) client - the Box API client that we will use to read in the file contents
 * (int) fileID - the ID of the PDF file to classify
 * (function) callback - the function to call back to once finished
 *
 * Output:
 * (void)
 */
const getDocumentClassification = (client, fileID, callback) => {
	client.files.getReadStream(fileID, null, (error, stream) => {
		if (error) {
			console.log(error);
			callback(error);
		}

		var buffer = new Buffer('', 'base64');
	    stream.on('data', (chunk) => {
			buffer = Buffer.concat([buffer, chunk]);
	    });

	    stream.on('end', () => {
			var options = {
				uri: 'http://52.175.200.59:8080/base64/api/EphesoftPostFile',
				multipart: [{
					body: buffer.toString('base64')
				}]
			}

			Request.post(options, (error, response, body) => {
				if (error) {
					console.log(error);
					callback(error);
				}

				var parseString = XML2JS.parseString;
				parseString(body, (error, result) => {
					if (error) {
						console.log(error);
						callback(error);
					}

					callback(null, result);
				});
			});
		});
	});
}
