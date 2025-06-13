# What is eNotes Kyanit?

Kyanit is a “note” (some-kind-of-an article) sharing platform, it’s straight-forward and easy to use, no ads, no bloats!

It’s still in development, if you have feedback, uhh... put it somewhere so that I could read it, maybe comment in [note/tutorial](/note/tutorial) (haven’t created feedback site yet).

# TODOs

- [ ] Vote system for note.<sup>!</sup>
- [ ] Make better homepage, explaining the website better.<sup>!</sup>
- [x] Fix the code.<sup style="color:gold">!!</sup>
- [ ] Add sorting and filters to the search page and dashboard.<sup style="color:gold">!!</sup>

# Environments

-	`PORT`.
-	`MAINTENANCE`.
-	`MAINTENANCE_USERS`.
-	`DATABASE_INDENTATION`.

# API

with prefix `/api`:

## GETs

-	`/comments?note_id` — returns comments from the note with ID `note_id`.

# Socket Events

-   `get--usernames(callback(usernames))`
-   `set--user(name, password)`
-   `get--is-password-correct(name, password, callback(isCorrect))`  
	maybe renamed to `--check-password`.
-   `get--user-password(name, passwordInCookie, callback(userPassword))`
-   `set--user-information(name, displayName, about, password)`
-   `set--note(name, title, content, unlisted, thumbnailURL, keywords)`
-   `edit--note(name, title, content, unlisted, thumbnailURL, noteId)`
-   `delete--note(name, password, noteId, callback())`
-   `connect-to-note(noteId)`
-   `set--comment(noteId, authorUsername, commenterUsername, content, parentId, callback())`
-   `delete--comment(noteId, commentId, callback)`
-   *`set--comment-vote(noteId, commentId, voterId, vote, callback)`*
-   *`delete--comment-vote(noteId, commentId, voterId, callback)`*
-   `get--user-to-display-name()`
-   `add--view-timeout(uername, noteId)`  
	maybe renamed to `set--`
-   `req--check-operator-key`
-   `req--database`

# Versions

## 250613

- Rewriting `index.js` to be more readable and easier to work with.
- Rewriting all `views/*.ejs` that need rewriting.
- Fixed the classes from `./modules`.
- Renamed `modules/EN.js` to `module/Kyanit.js`.
- Moved logos from the cloud to local.
- Created `GET /api/comments` to fetch comments from a note.
- Fixed minor bugs.
- Thumbnail is not shown at index, until I make a “Show Thumbnail” setting.
- Deleted the font Kawkab and Noto Sans Condensed from.
- Updated licence.

## 250601

eNotes is now Kyanit!

Very big change.

## 250530

Rewriting some of the code.

- Disallowing `gif`s as note thumbnails. Only whitelisting `png` and `jpeg`.
- Limiting the thumbnail size at 100 kB.

## 250402

-  The user’s about page is now in markdown and supports MathJax.

## 250324_1212

-  Turns out, millisecond is not a valid unit for relative time formats.

## 250101

-   The database key `commentVotes` is created. Structured as:
	| noteID | commentID | voterID | value |
	| ------ | --------- | ------- | ----- |
	| [id]   | [id]      | [id]    | 1     |
	| [id]   | [id]      | [id]    | -1    |

## 241231

-   The 'database' key `noteVotes` is created.
	Will be structured as:
	| noteID | voterID | value |
	| ------ | ------- | ----- |
	| [id]   | [id]    | 1     |
	| [id]   | [id]    | -1    |
	
	A `1` represents an upvote, and a `-1` represents a downvote.
-   UI at comments is now better

## 241207

-  Action button is at the bottom for mobile.

## 241116

-  Note has thumbnails now!

## 241110

-  Heading 4–6 have 75% opacity.

## 241019

-  Font for headings are now Noto Sans Condensed instead of Noto Sans.

## 240809

-  Fixed the backend
-  In `note.ejs`, it is using native ejs `<%  %>`

## 240705_1405

-  Removed
  > Made header disappear when scroll direction is to the bottom, and appear when scroll direction is to the top.
  > 
  > *240623_1730*
-  Added title bar, contains:
	1. Author.
	2. Title, *obviously*.
	3. Published date.
	4. Last edited date (if edited).
	5. View count.
	6. Comment count.

## 240703_2028

-  Changed image property, from always take 100% width, now image will be the original size (`max-width: 100%;`).
-  Added `1em` margin to images.
-  Added footnotes<sup>?</sup>, using `<span class="footnote" data-title="add reference/note/etc. here">The text will be here</span>`

## 240703_1654

-   Changed `@keyframes pop-in` animation
	1.  From:
		```css
		from {
		  transform: scale(0.9) rotateX(-45deg);
		  opacity: 0;
		}
		```
	2. To:
		```css
		from {
		  transform: scale(0.95);
		  opacity: 0;
		}
		```

## 240623_1730

-   Adding UI fixes to header (logo, search, and account)
	1.  Made header sticky, made its `backdrop-filter` to `blur(20px)`
	2.  Made header disappear when scroll direction is to the bottom, and appear when scroll direction is to the top.
	3.  Made header have `border-bottom` when not and only not at the top of the page.
	
## 240622

-   Added ripple animation to buttons, include:
	1.  Note card in `views/index.ejs` and `views/dashboard.ejs`.
	2.  Search bar.
	3.  Account button in header.
	4.  “Send comment botton.”

*any other updates before 240622 is not documented.*