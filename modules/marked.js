const { marked } = require('marked');
const DOMPurify = require('isomorphic-dompurify');

const {
	markedRenderer,
	markedMath,
	purifyOptions,
} = require('../config');

const markedAlert = require('./markdown-alert/index');
const markedFootnote = require('marked-footnote');
const markedMoreLists = require('marked-more-lists');
marked.use(
	markedAlert(),
	markedFootnote({
		refMarkers: true,
		footnoteDivider: true
	}),
	markedMoreLists(),
	{ renderer: markedRenderer, extensions: [ markedMath ] }
);

/**
 * Parse markdown source to HTML.
 * @param {string} source The markdown input
 * @returns {string} The HTML output
 */
function parseAndPurify(source) {
	return DOMPurify.sanitize(marked.parse(source), purifyOptions);
}

module.exports = {
	marked,
	parseAndPurify,
}