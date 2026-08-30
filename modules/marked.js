const { marked } = require('marked');
const DOMPurify = require('isomorphic-dompurify');

const {
	markedRenderer,
	markedMath,
	purifyOptions,
} = require('../config');

const markedAlert = require('@zf.ran/zmd-alert');
const markedFootnote = require('marked-footnote');
const markedMoreLists = require('marked-more-lists');

const alertVariants = [
  { type: 'note',      icon: 'edit' },
  { type: 'abstract',  icon: 'assignment' },
  { type: 'info',      icon: 'info' },
  { type: 'todo',      icon: 'check_circle' },
  { type: 'tip',       icon: 'lightbulb' },
  { type: 'success',   icon: 'check' },
  { type: 'question',  icon: 'help' },
  { type: 'warning',   icon: 'warning' },
  { type: 'failure',   icon: 'close' },
  { type: 'danger',    icon: 'dangerous' },
  { type: 'bug',       icon: 'bug_report' },
  { type: 'important', icon: 'assignment_late' },
  { type: 'example',   icon: 'list' },
  { type: 'quote',     icon: 'format_quote' }
];

marked.use(
	markedAlert({
		variants: alertVariants,
		excludedVariants: ['caution'],
		iconRenderer:
			icon => `<span class="material-symbols-outlined">${icon}</span>`,
	}),
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