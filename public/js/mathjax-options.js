MathJax = {
	loader: { load: [ 'output/svg' ] },
	tex: {
		inlineMath: [['$', '$'], ['\\(', '\\)']]
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