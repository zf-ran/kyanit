// note.ejs:162
const matches = {
  bold: textContent.match(/\\?\*\*/g) ?? [],
  italic: textContent.match(/\\?\-\-/g) ?? [],
  strike: textContent.match(/\\?~~/g) ?? [],
  underline: textContent.match(/\\?__/g) ?? [],
  code: textContent.match(/\\?```/g) ?? [],
  center: textContent.match(/\\?\|/g) ?? [],
  rtl: textContent.match(/\\?%%/g) ?? [],
  arabic: textContent.match(/\\?##/g) ?? []
};

const replaceWith = {
  bold: ['<strong>', '</strong>'],
  italic: ['<em>', '</em>'],
  strike: ['<del>', '</del>'],
  underline: ['<ins>', '</ins>'],
  code: ['<span class="code-text">', '</span>'],
  center: ['<div class="centered">', '</div>'],
  rtl: ['<div class="rtl">', '</div>'],
  arabic: ['<span class="arabic">', '</span>']
};

const notation = {
	bold: '**',
	italic: '--',
	strike: '~~',
	underline: '__',
	code: '```',
	center: '|',
	rtl: '%%',
	arabic: '##'
};

for (let i = 0; i < Object.keys(matches).length; i++) {
  const match = [Object.keys(matches)[i], Object.values(matches)[i]];

  let index = 0;

  for (let j = 0; j < match[1].length; j++) {
    if(match[1][j].startsWith('\\')) { 
      textContent = textContent.replace(match[1][j], `$${match[0]}notation`);
      continue;
    }

    textContent = textContent.replace(match[1][j], replaceWith[match[0]][index % 2]);

    index++;
  }

  textContent = textContent.replaceAll(`$${match[0]}notation`, `${notation[match[0]]}`);
}