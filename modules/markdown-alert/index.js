const { createSyntaxPattern, resolveVariants, sentenceCase } = require('./utils.js');
const marked = require('marked');

/**
 * A [marked](https://marked.js.org/) extension to support [GFM alerts](https://github.com/orgs/community/discussions/16925).
 */
function markedAlert(options = {}) {
  const { className = 'markdown-alert', variants = [] } = options;
  const resolvedVariants = resolveVariants(variants);

  return {
    walkTokens(token) {
      if (token.type !== 'blockquote') return;

      const matchedVariant = resolvedVariants.find(
				({ type }) => createSyntaxPattern(type).test(token.text)
      );

      if (matchedVariant) {
				const typeRegExp = createSyntaxPattern(matchedVariant.type);

				const alertTitle = token.text.match(typeRegExp)[1] || sentenceCase(matchedVariant.type);
				matchedVariant.title = alertTitle;

        const {
          type: variantType,
          icon,
          title,
          titleClassName = `${className}-title`
        } = matchedVariant;

        Object.assign(token, {
          type: 'alert',
          meta: {
            className,
            variant: variantType,
            icon,
            title,
            titleClassName
          }
        });

        const firstLine = token.tokens?.[0];
        const firstLineText = firstLine.raw?.replace(typeRegExp, '').trim();

        if (firstLineText) {
          const patternToken = firstLine.tokens[0];

          Object.assign(patternToken, {
            raw: patternToken.raw.replace(typeRegExp, ''),
            text: patternToken.text.replace(typeRegExp, '')
          });

          if (firstLine.tokens[1]?.type === 'br') {
            firstLine.tokens.splice(1, 1);
          }
        } else {
          token.tokens?.shift();
        }
      }
    },
    extensions: [
      {
        name: 'alert',
        level: 'block',
        renderer({ meta, tokens = [] }) {
          let template = '';
					template += `<div class="${meta.className} ${meta.className}-${meta.variant}">\n`;
          template += `<p class="${meta.titleClassName}">`;
          template += `<span class="markdown-alert-icon">${meta.icon}</span>`;
          template += `<span class="markdown-alert-title-text">${marked.parseInline(meta.title)}</span>`;
          template += '</p>\n';
          template += this.parser.parse(tokens);
          template += '</div>\n';

          return template;
        }
      }
    ]
  };
}

module.exports = markedAlert;