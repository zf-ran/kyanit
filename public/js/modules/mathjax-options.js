MathJax = {
	loader: {
		load: ['[tex]/ams', '[tex]/mathtools']
	},
	tex: {
		inlineMath: [['$', '$'], ['\\(', '\\)']],
		packages: {
			'[+]': ['ams', 'mathtools']
		}
	},
	options: {
		ignoreHtmlClass: 'code-text',
		enableMenu: false
	},
	output: { font: 'mathjax-fira' },
	chtml: { mtextInheritFont: true }
}