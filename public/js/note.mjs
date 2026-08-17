const isLoggedIn = JSON.parse(document.getElementById('metadata--is-logged-in').textContent);
const username = JSON.parse(document.getElementById('metadata--username').textContent);

const authorName = JSON.parse(document.getElementById('metadata--author-name').textContent);
const noteId = JSON.parse(document.getElementById('metadata--note-id').textContent);

//* ACTION BUTTONS
import dialog from '/js/modules/dialog.mjs';
import toast from '/js/modules/toast.mjs';

const rateButton = document.getElementById('rate-button');
const copyURLButton = document.getElementById('copy-url-button');

rateButton.addEventListener('click', () => {
	dialog.alert({
		title: 'Coming soon …',
		message: 'A user will be able to rate a note from 1 star to 5 star.',
		dismissIcon: 'thumb_up',
		dismissText: 'Alright'
	});
});

copyURLButton.addEventListener('click', () => {
	navigator.clipboard.writeText(location.href.split('#')[0]);

	toast({
		message: 'Note URL copied'
	});
});

if (authorName === username) {
	const editNoteButton = document.getElementById('edit-note-button');
	const deleteNoteButton = document.getElementById('delete-note-button');

	editNoteButton.addEventListener('click', () => {
		location.assign(`/edit/${noteId}`);
	});

	deleteNoteButton.addEventListener('click', async () => {
		const deleteConfirmation = await dialog.confirm({
			title: 'Delete note',
			message: 'Are you sure you want to delete this comment? This action is permanent.',
			cancelIcon: 'close',
			cancelText: 'Cancel',
			confirmIcon: 'delete',
			confirmText: 'Delete forever',
			destructive: true
		});

		if (!deleteConfirmation)
			return;

		try {
			const response = await fetch(`/api/notes/${noteId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const json = await response.json();

				toast({
					title: `Error ${response.status}`,
					message: json.error
				});
			} else {
				await dialog.alert({
					title: 'Success',
					message: 'Note deleted successfully',
					dismissText: 'Dismiss'
				});

				history.back();
			}
		} catch (error) {
			toast({
				title: 'Unexpected Error',
				message: error
			});
		}
	});
}

//* COMMENTS
import ElementBuilder from '/js/modules/element-builder.mjs';
import { relativeTime, absoluteTime } from '/js/modules/date-utils.mjs';

const commentsTab = document.getElementById('comments-tab');
const commentsPanel = document.getElementById('comments-panel');
const commentContainer = document.getElementById('comment-container');

commentsTab.addEventListener('click', async () => {
	if (!commentsPanel.dataset.loaded) {
		const comments = await fetchComments();
		commentsPanel.dataset.loaded = 'true';

		loadComments(comments);
	}
});

async function fetchComments() {
	try {
		const response = await fetch(`/api/notes/${noteId}/comments`);
		const json = await response.json();

		if(!response.ok) {
			dialog.alert({ title: 'Error', message: json.error });
			return [];
		}

		return json.data;
	} catch (error) {
		dialog.alert({
			title: 'Unexpected error',
			message: error
		});
	}
}

function loadComments(comments) {
	const commentMap = new Map();

	for (const comment of comments) {
		comment.children = [];
		commentMap.set(comment.id, comment);
	};

	const roots = [];

	for (const comment of comments) {
		if (comment.parentCommentId) {
			const parent = commentMap.get(comment.parentCommentId);
			if (parent)
				parent.children.push(comment);
		} else {
			roots.push(comment);
		}
	};

	for (const root of roots)
		renderCommentTree(root, commentContainer);
}

function renderCommentTree(comment, container) {
	const commentElement = renderComment(comment, container);

	for (const child of comment.children)
		renderCommentTree(child, commentElement.querySelector('.comment-replies'));
}

function renderComment(comment, container) {
	const commentElement = new ElementBuilder('div')
		.classes(['comment'])
		.id(`comment-${comment.id}`)
		.appendTo(container);

	createCommentMetadata(comment, commentElement);
	createCommentContent(comment, commentElement);
	createCommentActions(comment, commentElement);

	new ElementBuilder('div')
		.classes(['comment-replies'])
		.appendTo(commentElement);

	return commentElement;
}

function createCommentMetadata(comment, element) {
	// Display Name · @username · relative time · absolute time (on hover)
	const commentMetadataElement = new ElementBuilder('div')
		.classes(['comment-metadata'])
		.appendTo(element);

	const commenterName = new ElementBuilder('a')
		.attributes({ href: `/user/${encodeURIComponent(comment.commenterName)}` })
		.text(comment.commenterDisplayName)
		.classes(['comment-author-display-name'])
		.appendTo(commentMetadataElement);
	new ElementBuilder('span')
		.text(`@${comment.commenterName}`)
		.classes(['comment-author-name'])
		.appendTo(commentMetadataElement);

	if (comment.commenterName === authorName)
		commenterName.classList.add('author');

	const commentMetadataTimeElement = new ElementBuilder('span')
		.classes(['comment-time'])
		.appendTo(commentMetadataElement);
	new ElementBuilder('span')
		.text(relativeTime(new Date(comment.createdAt)))
		.classes(['comment-relative-time'])
		.appendTo(commentMetadataTimeElement);
	new ElementBuilder('span')
		.text(absoluteTime(new Date(comment.createdAt)))
		.classes(['comment-absolute-time'])
		.appendTo(commentMetadataTimeElement);
}

function createCommentContent(comment, element) {
	new ElementBuilder('div')
		.innerHTML(comment.content)
		.classes(['comment-content', 'markdown-document'])
		.appendTo(element);
}

function createCommentActions(comment, element) {
	const commentActionsElement = new ElementBuilder('div')
		.classes(['comment-actions'])
		.appendTo(element);

	const commentVoteGroup = new ElementBuilder('div')
		.classes(['vote-group'])
		.appendTo(commentActionsElement);

	const upvoteButton = new ElementBuilder('button')
		.classes(['small', 'icon', 'upvote-button', 'vote-button'])
		.attributes({ 'data-vote': '1', 'data-voted': 'false' })
		.appendTo(commentVoteGroup);
	new ElementBuilder('span')
		.text('arrow_upward')
		.classes(['material-symbols-outlined'])
		.appendTo(upvoteButton);

	const voteCountElement = new ElementBuilder('span')
		.text(comment.voteCount)
		.classes(['vote-count'])
		.appendTo(commentVoteGroup);

	const downvoteButton = new ElementBuilder('button')
		.classes(['small', 'icon', 'downvote-button', 'vote-button'])
		.attributes({ 'data-vote': '-1', 'data-voted': 'false' })
		.appendTo(commentVoteGroup);
	new ElementBuilder('span')
		.text('arrow_downward')
		.classes(['material-symbols-outlined'])
		.appendTo(downvoteButton);

	const commentButtonGroup = new ElementBuilder('div')
		.classes(['button-group'])
		.attributes({ role: 'group' })
		.appendTo(commentActionsElement);

	addVoteHandler(comment, { upvoteButton, downvoteButton, voteCountElement });

	if (!isLoggedIn)
		return;

	const replyButton = new ElementBuilder('button')
		.classes(['secondary', 'small'])
		.appendTo(commentButtonGroup);
	new ElementBuilder('span')
		.classes(['material-symbols-outlined'])
		.text('reply')
		.appendTo(replyButton);
	new ElementBuilder('span')
		.classes(['button-label'])
		.text('Reply')
		.appendTo(replyButton);

	replyButton.addEventListener('click', () => {
		dialog.alert({
			title: 'Coming soon …',
			message: 'Sending comments and replying work in progress.',
			dismissIcon: 'thumb_up',
			dismissText: 'Alright'
		})
	});

	if (comment.commenterName !== username)
		return;

	const deleteButton = new ElementBuilder('button')
		.classes(['secondary', 'small', 'destructive'])
		.appendTo(commentButtonGroup);
	new ElementBuilder('span')
		.classes(['material-symbols-outlined'])
		.text('delete')
		.appendTo(deleteButton);
	new ElementBuilder('span')
		.classes(['button-label'])
		.text('Delete')
		.appendTo(deleteButton);

	deleteButton.addEventListener('click', async () => {
		const deleteConfirmation = await dialog.confirm({
			title: 'Delete comment',
			message: 'Are you sure you want to delete this comment? This action is permanent.',
			cancelIcon: 'close',
			cancelText: 'Cancel',
			confirmIcon: 'delete',
			confirmText: 'Delete forever',
			destructive: true
		});

		if (!deleteConfirmation)
			return;

		try {
			const response = await fetch(`/api/notes/${noteId}/comments/${comment.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const json = await response.json();

				toast({
					title: 'Error',
					message: json.error
				});
			} else {
				commentElement.remove();
			}
		} catch (error) {
			toast({
				title: 'Unexpected error',
				message: error
			});
		}
	});
}

function addVoteHandler(comment, { upvoteButton, downvoteButton, voteCountElement }) {
	if (!isLoggedIn) {
		upvoteButton.addEventListener('click', () => { promptLogin(); });
		downvoteButton.addEventListener('click', () => { promptLogin(); });
		return;
	}

	const commentVote = comment.votes.find(commentVote => commentVote.voterName === username);

	if (commentVote) {
		upvoteButton.dataset.voted = (commentVote.value === 1);
		downvoteButton.dataset.voted = (commentVote.value === -1);
	}

	upvoteButton.addEventListener('click', event => { vote(comment, event.currentTarget, { upvoteButton, downvoteButton, voteCountElement }); });
	downvoteButton.addEventListener('click', event => { vote(comment, event.currentTarget, { upvoteButton, downvoteButton, voteCountElement }); });
}

async function vote(comment, button, { upvoteButton, downvoteButton, voteCountElement }) {
	const value = parseInt(button.dataset.vote);

	try {
		const headers = new Headers({ 'Content-Type': 'application/json' });
		const body = { value };

		const response = await fetch(`/api/notes/${noteId}/comments/${comment.id}/votes`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body)
		});

		const json = await response.json();

		if (!response.ok) {
			toast({
				title: 'Error',
				message: json.error
			});
			return;
		}

		voteCountElement.innerText = json.data.currentCount;

		if (value === 1) {
			upvoteButton.dataset.voted = JSON.stringify(!JSON.parse(upvoteButton.dataset.voted));
			downvoteButton.dataset.voted = 'false';
		} else if (value === -1) {
			upvoteButton.dataset.voted = 'false';
			downvoteButton.dataset.voted = JSON.stringify(!JSON.parse(downvoteButton.dataset.voted));
		}
	} catch (error) {
		toast({
			title: 'Unexpected error',
			message: error
		});
	}
}

function promptLogin() {
	dialog.alert({
		title: 'Login first',
		message: 'To vote and reply, you have to log in first!',
		dismissText: 'Alright'
	});
}