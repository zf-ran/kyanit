---
title: 'Basic Guide to Write a Note'
created_at: '2023-07-27T18:43:29.505Z'
updated_at: '2025-07-12T20:50:00Z'
---

# 1—Writing a Note {#creating}

To write a note, you must be logged in. Open the side menu **≡** > **Start Writing**.

## 1.1—Title {#1-1-title}

Don’t forgot to edit your note’s title at the top of the editor!

## 1.2—Headings {#1-2-header}

Use `#` to create headings, for example:

```markdown
# Heading 1
## Subheading 1 to Heading 1
### Sub-sub-heading to Sub-heading 1
## Subheading 2 to Heading 1
```

To add your heading to the content list, add a unique ID to your heading.  
You could add an ID to your heading by adding `{#some-id}` after the heading, like:

```markdown
# Heading that will appear in the content list {#and-this-is-the-id}
```

It’s recommended to use `kebab-case` for the heading ID, meaning hyphens are used for spaces, and no capital letters. For example, `this-is-a-text-written-using-kebab-case`.

### 1.2.1—Difference between Heading 1–6 {#1-2-2-header-difference}

Heading 1 (H1 for short) is often referred to as the “main heading”, while H2–H6 are referred to as “subheadings” because they indicate sub-levels.

## 1.3—Paragraphs {#1-3-paragraph}

Normal text is automatically a paragraph.  
And to separate a paragraph, add an empty line; for example:

```md
Lorem ipsum dolor sit amet, consectetur adipisicing elit. Cupiditate nostrum eaque modi molestiae officiis. Veniam magni, quam harum
deserunt dignissimos impedit quo itaque doloribus debitis molestiae adipisci quas inventore reprehenderit. *Put an empty line after this*.

*Put an empty line before this*. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Cumque voluptatem voluptatum ad vero nemo aliquid eligendi asperiores rerum,
neque rem inventore temporibus velit voluptates quam quo iure? Repellat voluptate voluptates enim laboriosam asperiores sapiente,
provident incidunt accusamus illum deleniti vero!
```

To get:

>	Lorem ipsum dolor sit amet, consectetur adipisicing elit. Cupiditate nostrum eaque modi molestiae officiis. Veniam magni, quam harum
>	deserunt dignissimos impedit quo itaque doloribus debitis molestiae adipisci quas inventore reprehenderit. *Put an empty line after this*.
>
>	*Put an empty line before this*. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Cumque voluptatem voluptatum ad vero nemo aliquid eligendi asperiores rerum,
>	neque rem inventore temporibus velit voluptates quam quo iure? Repellat voluptate voluptates enim laboriosam asperiores sapiente,
>	provident incidunt accusamus illum deleniti vero!

### 1.3.1—Line Breaks {#1-3-1-line-break}

If you want to add a new line (line break) without creating a new paragraph, add two spaces at the end of the line to add a line break, for example:

```markdown
This is some text, a line of text, add two spaces after this␣␣
and this is a text after a line break.
```

to get:

>	This is some text, a line of text, add two spaces after this  
>	and this is a text after a line break.

## 1.4—Text Styles {#1-4-styling}

Kyanit uses *Github Flavoured Markdown* (GFM) to style text (by using the module `marked.js`).

### 1.4.1—Bold {#1-4-1-bold}

Type `**bold**` to get **bold**.

### 1.4.2—Italic {#1-4-2-italic}

Type `*italic*` to get *italic*.

### 1.4.3—Strikethrough {#1-4-3-strikethrough}

Type `~strike~` to get ~strike~.

### 1.4.4—Code {#1-4-4-code}

Type  ``` `code` ```  to get `code`.

### 1.4.5—Links {#1-4-5-link}

Type `[Link Text](https://example.com)` to get [Link Text](https://example.com).

Or use `<https://example.com>` if you don’t want to add the text, <https://example.com>.

### 1.4.6—Footnotes {#1-4-6-footnote}

Type

```markdown
This is not a part of markdown syntax, but a part of GFM[^gfm]. This will be followed by another footnote.[^2]

[^gfm]: GitHub Flavoured Markdown.
[^2]: Another footnote.
```

to get

>	This is not a part of markdown syntax, but a part of GFM[^gfm]. This will be followed by another footnote.[^2]
>
>	[^gfm]: GitHub Flavoured Markdown.
>	[^2]: Another footnote.

You can place the foot note definition (`[^1]: Definition`) anywhere, `marked.js` will automatically put it at the bottom.

You also can label the footnote anyway you like, `[^1]`, `[^footnote]`, `[^one two three]`, and so on, `marked.js` will automatically number it.

### *Not enough?* {#1-4-7-html}

If you want more styling, you can use HTML.

## 1.5—Images {#1-5-image}

Type `![Alt text](/assets/header.svg)` to get
![Alt text](/assets/header.svg)

## 1.6—Lists {#1-6-lists}

### 1.6.1—Ordered

Type:
```
1.	This
2.	Is
3.	An
4.	Ordered
5.	List
```

to get:

1.	This
2.	Is
3.	An
4.	Ordered
5.	List

### 1.6.2—Unordered

Type:
```
-	This
-	Is
-	Unordered
-	List
```
alternatively, you can use `+` and `*` instead of `-`; to get:

-	This
-	Is
-	Unordered
-	List

### 1.6.3—Nested

Type:
```
- This is unordered
	1. That have an ordered list
		* That have another one
		* Like this.
	2. This is the second list
- More
	* And this too
```
to get:

- This is unordered
	1. That have an ordered list
		* That have another one
		* Like this.
	2. This is the second list
- More
	*	And this too

## 1.7—Blockquotes {#1-7-blockquotes}

Type:

```md
>	This is a block quote.
```

to get:
>	This is a block quote.

## 1.8—Codeblocks {#1-8-codeblocks}

Type:

``````markdown
```js
// some code
const CONSTANT = 400;
console.log(400);
```
``````

or

```
	// some code
	const CONSTANT = 400;
	console.log(400);
```

to get:

```js
// some code
const CONSTANT = 400;
console.log(400);
```

## 1.9—Horizontal Rules {#1-9-horizontal-rules}

Type at least 3 hyphens to create a horizontal rule,
and add an empty line before the hyphens. For example:

```
Below this text will be a horizontal rule.

-------------------
```

to get:

>	Below this text will be a horizontal rule.
>
>	-------------------

If you don't add an empty space, the text will be a heading 1.

## 1.10—Tables {#1-10-tables}

Type:

```markdown
| Heading 1			| Heading 2					|
| ----------------- | ------------------------- |
| Some table cells	| Some another table cells	|
| Lorem ipsum		| muspi meroL				|
```

to get:

| Heading 1			| Heading 2					|
| ----------------- | ------------------------- |
| Soe table cells	| Some another table cells	|
| Lorem ipsum		| muspi meroL				|

## 1.11—LaTeX Math Equations {#1-11-maths}

Kyanit uses MathJax to display math equations and uses LaTeX syntax.

If you don't want to bother to learn LaTeX, you could use <https://latexeditor.lagrida.com/>.

### 1.11.1—Inline Math

Use single dollar sign `$` for inline math.

Type

```tex
$ \sin(\alpha) = \frac{a}{b} = \text{sine wave} $
```

to write $ \sin(\alpha) = \frac{a}{b} = \text{sine wave} $.

Inline math, *as the name suggest*, will display the math equation in the same line of the paragraph.

### 1.11.2—Display Math

Use double dollar sign `$$` for display (block) math.

Type

```tex
$$ \begin{align*} \tan(\beta) = \frac{\sin}{\cos} &= \text{tangent}. \\\\ \Aboxed{f(x) &= x^2} \end{align*} $$
```

to write

$$ \begin{align*} \tan(\beta) = \frac{\sin}{\cos} &= \text{tangent}. \\\\ \Aboxed{f(x) &= x^2} \end{align*} $$

Display math will be displayed centered and on a separate line.

# 2—Publishing {#publishing}

After you’re done, you can publish your note by clicking the publish button at top-right corner. If you click it, it will open a dialog box that says

>	Thumbnail URL  
>	[_____________________]
>
>	Keywords  
>	[_____________________]

-	**Thumbnail URL** is optional, thumbnail must be a PNG or JPEG below 100 kB.
-	**Keywords** is optional too, but if you want your note to be searchable, use it.  
	You can add multiple keyword by separating it with a space, for example:

	```keyword1 keyword2 keyword3```

# 3—Visibility {#visibility}

## 3.1—Public {#3-1-public}

**Visibility: Public** means everyone can search your note, or see it on your profile.

## 3.2—Unlisted {#3-2-unlisted}

**Visibility: Unlisted** means only someone with the link that can open your note.