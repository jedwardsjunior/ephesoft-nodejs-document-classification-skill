'use strict';

/**
 * @author - jedwards
 * @date - September 2017
 */

/**
 * exports.getMetadataValueForDocumentClassification()
 *
 * Helper function to convert the document type found by the Ephesoft OcrClassifyExtract API to custom metadata on Box.
 *
 * Input:
 * (JSON) documentClassificationResponse - the response returned by the Ephesoft OcrClassifyExtract API
 *
 * Output:
 * (JSON) - the formatted metadata with the classification(s) of the document
 */
exports.getMetadataValueForDocumentClassification = (documentClassificationResponse) => {
	var metadata = {};
	if (documentClassificationResponse && documentClassificationResponse.hasOwnProperty('Web_Service_Result')) {
		var documentTypes = '';
		var documents = documentClassificationResponse['Web_Service_Result']['Result'][0]['Batch'][0]['Documents'][0]['Document'];

		for (var i = 0; i < documents.length; i++) {
			var document = documents[i];
			var documentType = document['Type'][0]

			var fields = document['DocumentLevelFields'][0]['DocumentLevelField'];
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var key = field['Name'][0];
				var value = field['Value'][0];
				if (metadata.hasOwnProperty(key)) {
					metadata[key] += ', ' + value;
				} else {
					metadata[key] = value;
				}
			}

			documentTypes+= documentType + ', '
		}

		documentTypes = documentTypes.slice(0, -2);
		metadata['Document Type'] = documentTypes;
	}

	return metadata;
}
