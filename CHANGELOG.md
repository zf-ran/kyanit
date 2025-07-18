# Version Changelogs

## 1.0.0-beta.5.1

-	Renamed `module/validateBody.js` to `module/bodyValidator.js`.
-	Removed `.js` suffix in `require()`.
-	Added standardization routes error handling to
	```js
	if(condition) {
		return res.status(code).json(data);
	}
	```
-	Separated the `/min` routes into `routes/minified.js`.
-	Separated API docs to `docs/api-reference.md` from `README.md`.
-	Updated the favicon.

## 1.0.0-beta.5

Refactored validation and error handling across routes.

-	Added `validateBody` middleware.
-	Added module `express-rate-limit`.
-	Changed `JSONErrorResponse` to accept a single error message string.
-	Changed Save button on user profile to have wait property.
-	Changed minimum password length to 8 characters.
-	Updated routes to utilize new validation rules.
-	Changed note sorting by trending score instead of view count,
	-	Trending score is calculated by

		$$ \frac{\text{views}}{(\text{time since published})^5}. $$


## 1.0.0-beta.4

- Fixed `PATCH /api/users`, `displayName` to `display_name`.
- Added `updated_at` at `PATCH /api/notes`.

## 1.0.0-beta.3

- Changed the logo from eNotes to Kyanit.

## 1.0.0-beta.2

- Removed Socket.IO.
- Added API `POST /api/notes/{noteId}/views`.

## 1.0.0-beta

- Added JWT authentication with access and refresh tokens, including middleware for token validation.
- Added privacy policy documentation.
- Added Vercel deployment settings.
- Added PostgreSQL as a database.
- Changed login and signup views to use `username` instead of `name` for clarity.
- Changed note views to handle created and updated timestamps more accurately.
- Changed comment handling in note views, ensuring proper display of commenter information.

## 1.0.0-alpha+001

- Added `body-parser` package.
- Added APIs:
	- `POST /api/signup`.
	- `POST /api/login`.
	- `PATCH /api/users/{username}`.
	- `DELETE /api/notes/{noteId}`.
	- `POST /api/notes/{noteId}/comments`.
	- `DELETE /api/notes/{noteId}/comments/{commentId}`.
	- `POST /api/notes/{noteId}/comments/{commentId}/votes`.
- Added classes `JSONResponse` and `JSONErrorResponse` to `modules/Kyanit.js`.
- Added invalid request handling on `GET /api/notes/{noteId}/comments`.
- Added `import` statements in client-side and split up the functions in `public/main.js`.
- Changed API `GET /api/comments` to `GET /api/notes/{noteId}/comments`.
- Changed socket event names listed below.
  | Old                     | New            |
  | ----------------------- | -------------- |
  | `connect-to-note`       | `note:connect` |
  | `add--view-timeout`     | `note:view`    |
- Removed socket events listed below to change to HTTP requests.
	- `get--usernames`.
	- `set--user`.
	- `set--user-infomation`
	- `get--is-password-correct`.
	- `get--user-password`.
	- `set--note`.
	- `edit--note`.
	- `delete--note`.
	- `set--comment`.
	- `delete--comment`.
	- `set--comment-vote`.
	- `get--user-to-display-name`.
	- `req--check-operator-key`.
	- `req--database`.
- Removed operator utilities.

## 250613

- Rewriting `index.js` to be more readable and easier to work with.
- Rewriting all `views/*.ejs` that need rewriting.
- Fixed the classes from `./modules`.
- Renamed `modules/EN.js` to `modules/Kyanit.js`.
- Moved logos from the cloud to local.
- Created `GET /api/comments` to fetch comments from a note.
- Fixed minor bugs.
- Thumbnail is not shown at index, until I make a “Show Thumbnail” setting.
- Deleted the font Kawkab and Noto Sans Condensed from.
- Updated licence.

## 250601

eNotes is now Kyanit!

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
