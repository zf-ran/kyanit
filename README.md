Kyanit is a note sharing platform. It’s simple to use, no ads, no bloats! *Still needs optimization though.*

A user can post a note. Here, a note is like an article, or a post; that has a title, content, comments, and votes.

>	[!TIP] Feedback
>	**This project is still in development.** If you have a bug report, feature request, or feedbacks, don’t mind putting it in <https://github.com/zf-ran/kyanit/issues>.

# TODOs

## Refactors

- [ ] Fix the code.
	- [80%] Refactor back-end.
	- [10%] Refactor front-end.
- [ ] Remove unnecessary try-catch blocks.
- [ ] Document APIs.

## New stuff

- [ ] Vote system for note.
- [ ] Log out.
- [ ] Delete account.
- [ ] Add sorting and filters to the search page and dashboard.
- [ ] Make better homepage, explaining the website better.

# Environments

-	`PORT={number}`.
-	`MAINTENANCE={boolean}` — Server maintenance mode.
-	`MAINTENANCE_USERS={string.split('\n')}`. — Users that has access to maintenance, split with a `\n`.
-	`DATABASE_INDENTATION={number|null}`.

# API

with prefix `/api`.

## GET

-	`/note/{noteId}/comments` - returns comments from the note with ID `{noteId}`.

## POST

-	`/signup`.
-	`/login`.
-	`/notes`.
-	`/notes/{noteId}/comments`.
-	`/notes/{noteId}/comments/{commentId}/votes`.

## DELETE

-	`/notes/{noteId}`.
-	`/notes/{noteId}/comments/{commentId}`.

## PATCH

-	`/users`.
-	`/notes/{noteId}`.

# Socket Events

## Client to Server

-	`note:connect(noteId)`.
-	`note:view(uername, noteId)`.