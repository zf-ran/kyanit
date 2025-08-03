---
title: 'HTML Components'
created_at: '2025-07-12T10:12:19.904Z'
updated_at: '2025-07-12T10:12:19.904Z'
---

# Buttons

**Default:** Primary, Medium.

## Icon

-	**Text Only**
	```html
	<button>Label</button>
	```
-	**Icon & Text**
	```html
	<button>
		<span class="material-symbols-outlined">icon_name</span>
		Label
	</button>
	```
-	**Icon Only**
	```html
	<button class="icon">
		<span class="material-symbols-outlined">icon_name</span>
	</button>
	```

## Types

-	**Primary** (default)
	```html
	<button>...</button>
	```

	or

	```html
	<button class="primary">...</button>
	```
-	**Secondary**
	```html
	<button class="secondary">...</button>
	```

## Sizes

-	**Small**
	```html
	<button class="small">...</button>
	```
-	**Medium** (default)
	```html
	<button>...</button>
	```
-	**Large**
	```html
	<button class="large">...</button>
	```

# Chips

## Toggle

-	**Enabled** (default)
	```html
	<label class="chip">
		<input type="checkbox" hidden />
		<span>...</span>
	</label>
	```
-	**Disabled**
	```html
	<label class="chip">
		<input type="checkbox" hidden disabled />
		<span>...</span>
	</label>
	```

## Info

```html
<label class="chip">Label</label>
```

# Headings

-	**Text Only**
	```html
	<h1>Heading</h1>
	```
-	**With Icon**
	```html
	<h1>
		<span class="material-symbols-outlined">icon_name</span>
		Heading
	</h1>
	```
-	**With Link**
	```html
	<h1>
		Heading
		<a href="{url}" class="link"><span class="material-symbols-outlined">link</span></a>
	</h1>
	```

*Icon* and *Link* type can be combined.

------------

# Note Cards

## Large

**Container:**

```html
<div class="note-card-container"></div>
```

**Card:**

```html
<div class="note-card">
	<a href="/note/{note_id}" class="link"></a>
	<div class="thumbnail">
		<img src="{thumbnail_url}"/>
	</div>
	<div class="meta-data">
		<div class="title">{title}</div>
		<div class="author">{author_name}</div>
		<div class="details">
			<span class="date">{relative_time_since_created}</span>
			<span class="views">{view_count} views</span>
			<span class="rating">{rating} <span class="material-symbols-outlined">star</span></span>
		</div>
		<div class="keyword-container">
			<label class="chip keyword"><a href="/explore?keyword={keyword}">{keyword}</a></label>
			...
		</div>
	</div>
</div>
```

## Small

## Large

**Container:**

```html
<div class="note-card-small-container"></div>
```

**Card:**

```html
<div class="note-card-small">
	[same as large]
</div>
```