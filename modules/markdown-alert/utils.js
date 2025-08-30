/**
 * The default configuration for alert variants.
 */
const defaultAlertVariant = [
  {
    type: 'note',
    icon: '<span class="material-symbols-outlined">edit</span>'
  },
  {
    type: 'abstract',
    icon: '<span class="material-symbols-outlined">assignment</span>'
  },
  {
    type: 'info',
    icon: '<span class="material-symbols-outlined">info</span>'
  },
  {
    type: 'todo',
    icon: '<span class="material-symbols-outlined">check_circle</span>'
  },
  {
    type: 'tip',
    icon: '<span class="material-symbols-outlined">lightbulb</span>'
  },
  {
    type: 'success',
    icon: '<span class="material-symbols-outlined">check</span>'
  },
  {
    type: 'question',
    icon: '<span class="material-symbols-outlined">help</span>'
  },
  {
    type: 'warning',
    icon: '<span class="material-symbols-outlined">warning</span>'
  },
  {
    type: 'failure',
    icon: '<span class="material-symbols-outlined">close</span>'
  },
  {
    type: 'danger',
    icon: '<span class="material-symbols-outlined">dangerous</span>'
  },
  {
    type: 'bug',
    icon: '<span class="material-symbols-outlined">bug_report</span>'
  },
  {
    type: 'important',
    icon: '<span class="material-symbols-outlined">assignment_late</span>'
  },
  {
    type: 'example',
    icon: '<span class="material-symbols-outlined">list</span>'
  },
  {
    type: 'quote',
    icon: '<span class="material-symbols-outlined">format_quote</span>'
  }
];

/**
 * Resolves the variants configuration, combining the provided variants with
 * the default variants.
 */
function resolveVariants(variants) {
  if (!variants.length) return defaultAlertVariant;

  return Object.values(
    [...defaultAlertVariant, ...variants].reduce(
      (map, item) => {
        map[item.type] = item;
        return map;
      },
      {}
    )
  );
}

/**
 * Returns regex pattern to match alert syntax.
 */
function createSyntaxPattern(type) {
  return new RegExp(`^(?:\\[!${type}\\]) *(.*)\n*`, 'i');
}

/**
 * Capitalizes the first letter of a string.
 */
function sentenceCase(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = { resolveVariants, createSyntaxPattern, sentenceCase };