import ElementBuilder from '/js/modules/element-builder.mjs';
import dialog from '/js/modules/dialog.mjs';
import toast from '/js/modules/toast.mjs';
import { generateUUID } from '/js/modules/uuid.mjs';

const username = JSON.parse(document.getElementById('metadata--username').textContent);
const noteAuthor = JSON.parse(document.getElementById('metadata--note-author-name').textContent);
const noteId = JSON.parse(document.getElementById('metadata--note-id').textContent);

const PERMISSION_SCHEMES = Object.freeze([
	{
		icon: 'cloud_upload',
		label: 'Republish',
		name: 'can-publish',
		key: 'canPublish',
	},
	{
		icon: 'delete',
		label: 'Delete',
		name: 'can-delete',
		key: 'canDelete',
	},
	{
		icon: 'title',
		label: 'Change title',
		name: 'can-change-title',
		key: 'canChangeTitle',
	},
	{
		icon: 'tag',
		label: 'Change keywords',
		name: 'can-change-keywords',
		key: 'canChangeKeywords',
	},
	{
		icon: 'image',
		label: 'Change thumbnail',
		name: 'can-change-thumbnail',
		key: 'canChangeThumbnail',
	},
	{
		icon: 'visibility',
		label: 'Change visibility',
		name: 'can-change-visibility',
		key: 'canChangeVisibility',
	},
]);

//* ADD COLLABORATOR
const addCollaboratorButton = document.getElementById('add-collaborator');

if (addCollaboratorButton) {
	addCollaboratorButton.addEventListener('click', async () => {
		const data = await dialog.form({
			title: 'Add collaborator',
			message: 'Add a collaborator to your note, put their username.',
			cancelIcon: 'close',
			cancelText: 'Cancel',
			confirmIcon: 'person_add',
			confirmText: 'Add',
			fields: [
				{
					name: 'collaboratorName',
					label: 'Collaborator Username',
					type: 'text',
					required: true,
					icon: 'alternate_email',
				},
			],
		});

		if (data === null)
			return;

		const { collaboratorName } = data;

		if (collaboratorName === username) {
			toast({
				message: "You're the author…",
			});

			return;
		}

		const uuid = generateUUID();
		const displayName = await fetchDisplayName(collaboratorName);

		if (!displayName)
			return;

		const { element: detailsElement } = new ElementBuilder('details')
			.classes(['collaborator'])
			.id(`collaborator-${uuid}`)
			.attributes({
				open: '',
				name: `collaborator-${uuid}`,
				'data-username': collaboratorName,
				'data-uuid': uuid,
			});

		addCollaboratorButton.before(detailsElement);

		const summaryElement = new ElementBuilder('summary')
			.appendTo(detailsElement);

		new ElementBuilder('span') // icon
			.classes(['material-symbols-outlined', 'chevron'])
			.text('chevron_right')
			.appendTo(summaryElement);

		const infoElement = new ElementBuilder('span')
			.classes(['collaborator--info'])
			.appendTo(summaryElement);

		new ElementBuilder('span') // display name
			.classes(['collaborator--info--display-name'])
			.text(displayName)
			.appendTo(infoElement);

		new ElementBuilder('span') // username
			.classes(['collaborator--info--username'])
			.text(`@${collaboratorName}`)
			.appendTo(infoElement);

		const deleteCollaboratorButton = new ElementBuilder('button')
			.classes(['small', 'tertiary', 'icon', 'destructive', 'delete-collaborator'])
			.attributes({
				'data-username': collaboratorName,
				'data-uuid': uuid,
			})
			.appendTo(summaryElement);

		new ElementBuilder('span')
			.classes(['material-symbols-outlined'])
			.text('delete')
			.appendTo(deleteCollaboratorButton);

		const permissionsElement = new ElementBuilder('div')
			.classes(['accordion-details', 'permissions'])
			.appendTo(detailsElement);

		for (const permission of PERMISSION_SCHEMES) {
			const checkboxWrapper = new ElementBuilder('div')
				.classes(['checkbox-wrapper'])
				.appendTo(permissionsElement);

			new ElementBuilder('span') // icon
				.classes(['material-symbols-outlined', 'checkbox-icon'])
				.text(permission.icon)
				.appendTo(checkboxWrapper);

			const labelElement = new ElementBuilder('label')
				.attributes({
					for: `permission--${uuid}--${permission.name}`,
				})
				.appendTo(checkboxWrapper);

			new ElementBuilder('span') // label
				.classes(['checkbox-label'])
				.text(permission.label)
				.appendTo(labelElement);

			new ElementBuilder('input') // checkbox
				.id(`permission--${uuid}--${permission.name}`)
				.attributes({
					type: 'checkbox',
				})
				.appendTo(labelElement);
		}

		deleteCollaboratorButton.addEventListener('click', async () => {
			const confirm = await confirmDeleteCollaborator();

			if (confirm)
				detailsElement.remove();
		});
	});
}

const deleteCollaboratorButtons = document.getElementsByClassName('delete-collaborator');

for (const deleteCollaboratorButton of deleteCollaboratorButtons) {
	deleteCollaboratorButton.addEventListener('click', async () => {
		const confirm = await confirmDeleteCollaborator();

		if (!confirm)
			return;

		const { uuid } = deleteCollaboratorButton.dataset;

		const detailsElement = document.getElementById(`collaborator-${uuid}`);

		detailsElement.remove();
	});
}

function confirmDeleteCollaborator() {
	return dialog.confirm({
		title: 'Remove collaborator?',
		message: 'You can add them later',
		cancelIcon: 'close',
		cancelText: 'Cancel',
		confirmIcon: 'delete',
		confirmText: 'Delte',
		destructive: true,
	});
}

//* SAVE COLLABORATORS
const saveCollaboratorsButton = document.getElementById('save-collaborators');

if (saveCollaboratorsButton) {
	saveCollaboratorsButton.addEventListener('click', async () => {
		if (!noteId) {
			toast({
				title: 'Publish first',
				message: 'Publish your note before adding a collaborator',
			});

			return;
		}

		const collaborators = [...document.querySelectorAll('details.collaborator')]
			.map(collaboratorElement => {
				const { username: collaboratorName, uuid } = collaboratorElement.dataset;

				const isChecked = key => {
					const checkbox = collaboratorElement
						.querySelector(`input#permission--${uuid}--${key}`);

					return checkbox ? checkbox.checked : false;
				};

				const permission = {
					name: collaboratorName,
				};

				for (const { key, name } of PERMISSION_SCHEMES)
					permission[key] = isChecked(name);

				return permission;
			});

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const body = JSON.stringify({ collaborators });

		const response = await fetch(`/api/notes/${noteId}/collaborators`, {
			method: 'PUT',
			headers, body,
		});

		const json = await response.json();

		if (response.status === 404) {
			await dialog.alert({
				title: 'Note not found',
				message: 'Note might be deleted',
				dismissIcon: 'close',
				dismissText: 'Close',
			});

			return;
		}

		if (!response.ok) {
			await dialog.alert({
				title: 'Error',
				message: json.error,
				dismissIcon: 'close',
				dismissText: 'Close',
			});

			return;
		}

		toast({
			message: 'Collaborators updated',
		});
	});
}

/**
 * @param {string} username
 * @returns {string|null}
 */
async function fetchDisplayName(username) {
	const response = await fetch(`/api/users/${encodeURIComponent(username)}/display-name`);
	const json = await response.json();

	if (response.status === 404) {
		await dialog.alert({
			title: 'User not found',
			message: `There is no user with username <code>${username}</code>.`,
			dismissIcon: 'close',
			dismissText: 'Close',
		});

		return null;
	}

	if (!response.ok) {
		await dialog.alert({
			title: 'Error',
			message: json.error,
			dismissIcon: 'close',
			dismissText: 'Close',
		});

		return null;
	}

	return json.data.displayName;
}