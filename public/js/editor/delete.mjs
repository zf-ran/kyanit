import dialog from '/js/modules/dialog.mjs';
import toast from '/js/modules/toast.mjs';

const deleteButton = document.getElementById('delete');

if (deleteButton) {
	deleteButton.addEventListener('click', async () => {
		const noteId = JSON.parse(document.getElementById('metadata--note-id').textContent);

		const data = await dialog.form({
			title: 'Delete note',
			message: 'Type <code>DELETE</code> to confirm. This action is permanent.',
			cancelIcon: 'close',
			cancelText: 'Cancel',
			confirmIcon: 'delete',
			confirmText: 'Delete forever',
			destructive: true,
			fields: [
				{
					name: 'inputText',
					label: 'Delete',
					required: true,
					type: 'text',
					icon: 'approval',
				},
			],
		});

		if (data === null)
			return;

		if (data.inputText !== 'DELETE') {
			toast({
				title: 'Canceled',
				message: `Note deletion canceled, you didn't type <code>DELETE</code>`
			});
			return;
		}

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
