---
title: 'API Reference'
created_at: '2025-07-12T10:12:19.904Z'
updated_at: '2025-07-12T10:12:19.904Z'
---

# Environments

-	`PORT={number}`.
-	`MAINTENANCE={boolean}` — Server maintenance mode.
-	`MAINTENANCE_USERS={string[] split with \n}`. — Users that has access to maintenance, split with a `\n`.
-	`JWT_ACCESS_SECRET`.
-	`JWT_REFRESH_SECRET`.
-	`ACCESS_TOKEN_AGE={number in ms}`.
-	`REFRESH_TOKEN_AGE={number in ms}`.
-	`PG_HOST`.
-	`PG_DATABASE`.
-	`PG_USER`.
-	`PG_PASSWORD`.
-	`PG_PORT`.

# API Routes

with prefix `/api`.

## GET

-	`/note/{noteId}/comments` - returns comments from the note with ID `{noteId}`.

## POST

-	`/signup`.
-	`/login`.
-	`/notes`.
-	`/notes/{noteId}/views`.
-	`/notes/{noteId}/comments`.
-	`/notes/{noteId}/comments/{commentId}/votes`.

## DELETE

-	`/notes/{noteId}`.
-	`/notes/{noteId}/comments/{commentId}`.

## PATCH

-	`/users`.
-	`/notes/{noteId}`.