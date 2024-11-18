import * as vscode from 'vscode';

class TransformEditorViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'custom-text-transform.transformEditorGuiView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// webviewView.webview.onDidReceiveMessage(data => {
		// 	switch (data.type) {
		// 		case 'colorSelected':
		// 			{
		// 				vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
		// 				break;
		// 			}
		// 	}
		// });

        // Handle messages from the WebView
        webviewView.webview.onDidReceiveMessage(async (message) => {
            const config = vscode.workspace.getConfiguration('custom-text-transform');
            let transforms = config.get<any[]>('transforms') || [];

            switch (message.command) {
                case 'loadTransforms':
                    if (!Array.isArray(transforms)) {
                        transforms = [];
                    }
                    webviewView.webview.postMessage({ command: 'loadTransforms', transforms });
                    break;

                case 'saveTransform':
                    const existingIndex = transforms.findIndex(t => t.name === message.name);
                    if (existingIndex >= 0) {
                        transforms[existingIndex] = { name: message.name, function: message.function };
                    } else {
                        transforms.push({ name: message.name, function: message.function });
                    }
                    await config.update('transforms', transforms, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage(`Transform "${message.name}" saved.`);
                    break;

                case 'deleteTransform':
                    transforms = transforms.filter(t => t.name !== message.name);
                    await config.update('transforms', transforms, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage(`Transform "${message.name}" deleted.`);
                    break;
            }
        });

	}

    public addTransform() {
        if (this._view) {
            this._view.show?.(true);
            this._view.webview.postMessage({ command: 'addTransform' });
        }
    }

	// public addColor() {
	// 	if (this._view) {
	// 		this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
	// 		this._view.webview.postMessage({ type: 'addColor' });
	// 	}
	// }

	// public clearColors() {
	// 	if (this._view) {
	// 		this._view.webview.postMessage({ type: 'clearColors' });
	// 	}
	// }

	private _getHtmlForWebview(webview: vscode.Webview) {
		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Transform Editor</title>
			</head>
			<body>
				<h1>Text Transform Editor</h1>
				<label for="existing">Existing Transforms:</label>
				<select id="existing">
					<option value="" disabled selected>Select a transform</option>
				</select>
				<br />
				<label for="name">Name:</label>
				<input type="text" id="name" placeholder="Transform Name" />
				<br />
				<label for="function">Function:</label>
				<textarea id="function" rows="10" cols="50" placeholder="Enter JavaScript Function"></textarea>
				<br />
				<button id="save">Save Transform</button>
				<button id="delete">Delete Transform</button>
				<div id="output"></div>
				<script>
					const vscode = acquireVsCodeApi();

					// Populate existing transforms
					window.addEventListener('message', event => {
						const message = event.data;
						if (message.command === 'loadTransforms') {
							const select = document.getElementById('existing');
							select.dataset.transforms = JSON.stringify(message.transforms); // Store transforms for later use

							message.transforms.forEach(transform => {
								const option = document.createElement('option');
								option.value = transform.name;
								option.textContent = transform.name;
								select.appendChild(option);
							});
						}
					});

					document.getElementById('existing').addEventListener('change', (event) => {
						const selectedName = event.target.value;
						const transforms = JSON.parse(event.target.dataset.transforms || '[]');
						const selectedTransform = transforms.find(t => t.name === selectedName);
						if (selectedTransform) {
							document.getElementById('name').value = selectedTransform.name;
							document.getElementById('function').value = selectedTransform.function;
						}
					});

					document.getElementById('save').addEventListener('click', () => {
						const name = document.getElementById('name').value;
						const functionCode = document.getElementById('function').value;
						vscode.postMessage({ command: 'saveTransform', name, function: functionCode });
					});

					document.getElementById('delete').addEventListener('click', () => {
						const name = document.getElementById('name').value;
						vscode.postMessage({ command: 'deleteTransform', name });
					});
				</script>
			</body>
			</html>
			`;

		// // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		// const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// // Do the same for the stylesheet.
		// const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		// const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		// const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// // Use a nonce to only allow a specific script to be run.
		// const nonce = getNonce();

		// return `<!DOCTYPE html>
		// 	<html lang="en">
		// 	<head>
		// 		<meta charset="UTF-8">

		// 		<!--
		// 			Use a content security policy to only allow loading styles from our extension directory,
		// 			and only allow scripts that have a specific nonce.
		// 			(See the 'webview-sample' extension sample for img-src content security policy examples)
		// 		-->
		// 		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

		// 		<meta name="viewport" content="width=device-width, initial-scale=1.0">

		// 		<link href="${styleResetUri}" rel="stylesheet">
		// 		<link href="${styleVSCodeUri}" rel="stylesheet">
		// 		<link href="${styleMainUri}" rel="stylesheet">

		// 		<title>Cat Colors</title>
		// 	</head>
		// 	<body>
		// 		<ul class="color-list">
		// 		</ul>

		// 		<button class="add-color-button">Add Color</button>

		// 		<script nonce="${nonce}" src="${scriptUri}"></script>
		// 	</body>
		// 	</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}



async function openTransformEditor(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'transformEditor',
        'Text Transform Editor',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    // Fetch existing transforms
    const config = vscode.workspace.getConfiguration('custom-text-transform');
    const transforms: { name: string, function: string }[] = config.get('transforms') || [];

    panel.webview.html = getWebviewContent();

    // Send the existing transforms to the WebView
    panel.webview.postMessage({ command: 'loadTransforms', transforms });

    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'saveTransform':
                const updatedTransforms = Array.isArray(transforms) ? [...transforms] : [];
                const existingIndex = updatedTransforms.findIndex((t: any) => t.name === message.name);
                if (existingIndex >= 0) {
                    updatedTransforms[existingIndex] = { name: message.name, function: message.function };
                } else {
                    updatedTransforms.push({ name: message.name, function: message.function });
                }
                await config.update('transforms', updatedTransforms, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Transform "${message.name}" saved.`);
                break;
            case 'deleteTransform':
                const filteredTransforms = transforms.filter((t: any) => t.name !== message.name);
                await config.update('transforms', filteredTransforms, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Transform "${message.name}" deleted.`);
                break;
        }
    });
}


// function getWebviewContent() {
//     return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Transform Editor</title>
//     </head>
//     <body>
//         <h1>Text Transform Editor</h1>
//         <label for="existing">Existing Transforms:</label>
//         <select id="existing">
//             <option value="" disabled selected>Select a transform</option>
//         </select>
//         <br />
//         <label for="name">Name:</label>
//         <input type="text" id="name" placeholder="Transform Name" />
//         <br />
//         <label for="function">Function:</label>
//         <textarea id="function" rows="10" cols="50" placeholder="Enter JavaScript Function"></textarea>
//         <br />
//         <button id="save">Save Transform</button>
//         <button id="delete">Delete Transform</button>
//         <div id="output"></div>
//         <script>
//             const vscode = acquireVsCodeApi();

//             // Populate existing transforms
//             window.addEventListener('message', event => {
//                 const message = event.data;
//                 if (message.command === 'loadTransforms') {
//                     const select = document.getElementById('existing');
//                     select.dataset.transforms = JSON.stringify(message.transforms); // Store transforms for later use

//                     message.transforms.forEach(transform => {
//                         const option = document.createElement('option');
//                         option.value = transform.name;
//                         option.textContent = transform.name;
//                         select.appendChild(option);
//                     });
//                 }
//             });

//             document.getElementById('existing').addEventListener('change', (event) => {
//                 const selectedName = event.target.value;
//                 const transforms = JSON.parse(event.target.dataset.transforms || '[]');
//                 const selectedTransform = transforms.find(t => t.name === selectedName);
//                 if (selectedTransform) {
//                     document.getElementById('name').value = selectedTransform.name;
//                     document.getElementById('function').value = selectedTransform.function;
//                 }
//             });

//             document.getElementById('save').addEventListener('click', () => {
//                 const name = document.getElementById('name').value;
//                 const functionCode = document.getElementById('function').value;
//                 vscode.postMessage({ command: 'saveTransform', name, function: functionCode });
//             });

//             document.getElementById('delete').addEventListener('click', () => {
//                 const name = document.getElementById('name').value;
//                 vscode.postMessage({ command: 'deleteTransform', name });
//             });
//         </script>
//     </body>
//     </html>
//     `;
// }




