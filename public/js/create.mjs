import { EditorView, basicSetup } from 'https://esm.sh/codemirror';
import { tags } from 'https://esm.sh/@codemirror/highlight';

import { EditorState, EditorSelection } from 'https://esm.sh/@codemirror/state';

import {
	keymap,
	highlightSpecialChars,
	highlightActiveLine,
	highlightActiveLineGutter,
	drawSelection,
	rectangularSelection,
	dropCursor,
	lineNumbers
} from 'https://esm.sh/@codemirror/view';

import {
	HighlightStyle,
	indentUnit,
	syntaxHighlighting,
	indentOnInput,
	bracketMatching,
	foldGutter,
	foldKeymap
} from 'https://esm.sh/@codemirror/language';

import {
	defaultKeymap,
	history,
	historyKeymap,
	indentWithTab
} from 'https://esm.sh/@codemirror/commands';

import {
	searchKeymap,
	highlightSelectionMatches
} from 'https://esm.sh/@codemirror/search';

import {
	autocompletion,
	completionKeymap,
	closeBrackets,
	closeBracketsKeymap
} from 'https://esm.sh/@codemirror/autocomplete';

import { markdown, markdownLanguage } from 'https://esm.sh/@codemirror/lang-markdown';
import { languages } from 'https://esm.sh/@codemirror/language-data';

const customFoldGutter = foldGutter({
	markerDOM(open) {
		const element = document.createElement("span");

		element.textContent = open ? "▾" : "▸";
		element.classList.add("fold-marker");

		return element;
	}
});

const customEditorTheme = EditorView.theme({
	'&': {
		height: '100%',
		fontFamily: 'var(--font-family--monospace)',
		backgroundColor: 'transparent',
		color: 'var(--text-color)'
	},
	'.cm-content': {
		fontFamily: 'var(--font-family--monospace)',
		caretColor: 'var(--text-color)'
	},
	'.cm-gutters': {
		fontFamily: 'var(--font-family--monospace)',
		backgroundColor: 'var(--background)',
		color: 'var(--text-mute)',
		borderColor: 'var(--border-mute)'
	},

	// Cursor
	'.cm-cursor, .cm-dropCursor': {
		borderColor: 'var(--text-color)'
	},

	// Selection
	'&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
		backgroundColor: 'var(--secondary)'
	},
	'.cm-selectionBackground': {
		backgroundColor: 'var(--secondary)'
	},
	'.cm-selectionMatch, .cm-searchMatch': {
		backgroundColor: 'hsl(from var(--success) h s l / 25%)'
	},

	// Line
	'.cm-activeLine, .cm-activeLineGutter': {
		backgroundColor: 'hsl(from var(--secondary) h s l / 25%)'
	},

	// Panels
	'.cm-tooltip': {
		backgroundColor: 'var(--background)',
		borderColor: 'var(--border-mute)'
	},
	'.cm-tooltip-autocomplete': {
		backgroundColor: 'var(--background)'
	},
	'.cm-tooltip .cm-completionMatchedText': {
		textDecoration: 'none',
		color: 'var(--primary)',
		fontWeight: 'bold'
	},
	'.cm-tooltip li[aria-selected]': {
		backgroundColor: 'var(--primary)',
		color: 'var(--background)'
	},
	'.cm-tooltip li[aria-selected] .cm-completionMatchedText': {
		color: 'var(--secondary)'
	},

	// Fold
	'.cm-foldPlaceholder': {
		backgroundColor: 'transparent',
		borderColor: 'var(--border-mute)'
	}
})

const markdownColorScheme = HighlightStyle.define([
	// Headings
	{ tag: tags.heading,
		color: 'var(--primary)',
		fontWeight: 'bold' },

	// Metadata, such as `*` for italic, `#` for headings, etc.
	{ tag: tags.meta, color: 'var(--text-mute)' },

	// Language type in codeblock, footnotes, etc.
	{ tag: tags.name, color: 'var(--success)' },

	// Text styles
	{ tag: tags.emphasis, fontStyle: 'italic' },
	{ tag: tags.strong, fontWeight: 'bold' },
	{ tag: tags.url, color: 'var(--link)' },
	{ tag: tags.strikethrough, textDecoration: 'line-through' },

	// Horizontal rules
	{ tag: tags.contentSeparator, color: 'var(--text-mute)' },

	// Comments
	{ tag: tags.comment, color: 'var(--text-mute)' }
]);

window.createEditor = (element, initialValue = '') => {
	element.innerHTML = '';

	const editor = new EditorView({
		doc: initialValue,
		extensions: [
			// Basic Setups
			lineNumbers(),
			highlightActiveLineGutter(),
			highlightSpecialChars(),
			highlightActiveLine(),
			highlightSelectionMatches(),
			history(),
			drawSelection(),
			rectangularSelection(),
			dropCursor(),
			EditorState.allowMultipleSelections.of(true),
			indentOnInput(),
			bracketMatching(),
			closeBrackets(),
			autocompletion(),

			// Customs
			EditorView.lineWrapping,
			indentUnit.of('\t'),
			keymap.of([
				...closeBracketsKeymap,
				...defaultKeymap,
				...searchKeymap,
				...historyKeymap,
				...foldKeymap,
				...completionKeymap,
				indentWithTab
			]),
			customFoldGutter,
			customEditorTheme,

			markdown({ base: markdownLanguage }),
			markdownLanguage.data.of({
				closeBrackets: {
					brackets: ['(', '[', '{', '\'', '"', '`', '*', '_', '<']
				}
			}),

			syntaxHighlighting(markdownColorScheme)
		],
		parent: element
	});

	window.editorInstance = editor;
	return editor;
};

const editor = document.getElementById('editor');

createEditor(editor, editor.textContent);

const tools = document.querySelectorAll('.toolbar button');

const textStylePairs = {
	bold: [ '**', '**' ],
	italic: [ '*', '*' ],
	strikethrough: [ '~~', '~~' ],
	codespan: [ '`', '`' ],
	link: [ '[](', ')' ],
	'inline-math': [ '$', '$' ],
	codeblock: [ '```\n', '\n```' ],
	'display-math': [ '$$ ', ' $$' ],
	image: [ '![](', ')' ]
}

for (const tool of tools) {
	const type = tool.id.replace('tool-', '');

	switch (type) {
	case 'h1':
	case 'h2':
	case 'h3':
	case 'h4':
	case 'h5':
	case 'h6':
		tool.addEventListener('click', () => {
			prefixLine('#'.repeat(parseInt(type[1])) + ' ');
		});
		break;
	case 'bold':
	case 'italic':
	case 'strikethrough':
	case 'codespan':
	case 'link':
	case 'inline-math':
	case 'codeblock':
	case 'display-math':
	case 'image':
		tool.addEventListener('click', () => {
			wrapSelection(textStylePairs[type][0], textStylePairs[type][1]);
		});
		break;
	case 'unordered-list':
		tool.addEventListener('click', () => {
			prefixLine('- ');
		});
		break;
	case 'ordered-list':
		tool.addEventListener('click', () => {
			prefixLine('1. ');
		});
		break;
	case 'blockquote':
		tool.addEventListener('click', () => {
			prefixLine('> ');
		});
		break;
	}
}

const toggleMetaSidebar = document.getElementById('toggle-meta-sidebar');
const metaSidebar = document.getElementById('meta-sidebar');

toggleMetaSidebar.addEventListener('click', () => {
	if (metaSidebar.classList.contains('open'))
		metaSidebar.classList.remove('open');
	else
		metaSidebar.classList.add('open');
});

window.addEventListener('keydown', event => {
	if (event.key == 's' && event.ctrlKey) {
		event.preventDefault();

		metaSidebar.classList.add('open');
	}
})

function prefixLine(prefix) {
	editorInstance.dispatch(
		editorInstance.state.changeByRange(range => {
			const changes = [];

			const lineStart = editorInstance.state.doc.lineAt(range.from).number;
			const lineEnd = editorInstance.state.doc.lineAt(range.to).number;

			let firstLineChange = 0;
			let totalChange = 0;

			for (let i = lineStart; i <= lineEnd; i++) {
				const line = editorInstance.state.doc.line(i);

				if (line.text.startsWith(prefix)) {
					changes.push({ from: line.from, to: line.from + prefix.length, insert: '' });
					totalChange -= prefix.length;
					if (i === lineStart) firstLineChange = -prefix.length;
				} else {
					changes.push({ from: line.from, insert: prefix });
					totalChange += prefix.length;
					if (i === lineStart) firstLineChange = prefix.length;
				}
			}

			const newRange = EditorSelection.range(
				Math.max(range.from + firstLineChange, editorInstance.state.doc.line(lineStart).from),
				Math.max(range.to + totalChange, editorInstance.state.doc.line(lineStart).from)
			);

			return { changes, range: newRange };
		})
	);

	editorInstance.focus();
}

function wrapSelection(begin, end) {
	editorInstance.dispatch(
		editorInstance.state.changeByRange(range => {
			const changes = [
				{ from: range.from, insert: begin },
				{ from: range.to, insert: end }
			];

			const newRange = EditorSelection.range(
				range.from + begin.length,
				range.to + begin.length
			);

			return { changes, range: newRange };
		})
	);

	editorInstance.focus();
}