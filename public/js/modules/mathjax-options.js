MathJax = {
	loader: {
		load: [
			'output/svg',
			'[tex]/mathtools'
		]
	},
	tex: {
		inlineMath: [['$', '$'], ['\\(', '\\)']],
		packages: {
			'[+]': ['mathtools']
		}
	},
	options: {
		ignoreHtmlClass: 'code-text',
		renderActions: {
			addMenu: []
		}
	},
	chtml: { mtextInheritFont: true },
	svg: { mtextInheritFont: true },
	showMathMenu: false
}