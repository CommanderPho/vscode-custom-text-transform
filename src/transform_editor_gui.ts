import * as vscode from 'vscode';
// import "@vscode-elements/elements/dist/vscode-button/index.js";


export class TransformEditorViewProvider implements vscode.WebviewViewProvider {

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
		/* ================================================================================================================== */
		/* Basic TextArea Version                                                                                             */
		/* ================================================================================================================== */
        webviewView.webview.onDidReceiveMessage(async (message) => {
            const config = vscode.workspace.getConfiguration('custom-text-transform');
            let transforms = config.get<any[]>('transforms') || [];

            switch (message.command) {
                case 'loadTransforms':
                    if (!Array.isArray(transforms)) {
                        transforms = [];
                    }
					// transforms = transforms.map(t => ({ name: t.name, function: t.function.replace(/;/g, ';\n') })); // Add newlines for display
					transforms = transforms.map(t => ({ name: t.name, function: t.function.replace(/;(?!\n)/g, ';\n') })); // Add newlines for display

                    webviewView.webview.postMessage({ command: 'loadTransforms', transforms });
					// webviewView.webview.postMessage({
					// 	command: 'populateEditor',
					// 	function: selectedTransform.function
					// });

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

                case 'executeTransform':
                    // transforms = transforms.filter(t => t.name !== message.name);
					// message.function = message.function.replace(/;(?!\n)/g, ';\n'); // Add newlines for display
					const function_code = message.function;
					const text = message.arguments
					
					// WARNING: Executing arbitrary code using eval has security implications and should be done with caution.
					try {
						// Here we're using `eval` to dynamically execute the function.
						// The function code is expected to be a string in which `input` is the parameter that represents the selected text.
						const transformedText = eval(`(function(input){${function_code}})('${text.replace(/'/g, "\\'")}')`);

						// Apply the transformed text back to the document
						vscode.window.showInformationMessage(`Using transform: ${message.name}`);
						webviewView.webview.postMessage({ command: 'updateTestingText', transformedText });

					} catch (error) {
						vscode.window.showErrorMessage(`Error applying transform: ${message.name}. Please check the function syntax.`);
					}
                    break;


            }
        });

		// /* ================================================================================================================== */
		// /* VSCode-elements version:                                                                                           */
		// /* ================================================================================================================== */
		// webviewView.webview.onDidReceiveMessage(async (message) => {
		// 	const config = vscode.workspace.getConfiguration('custom-text-transform');
		// 	let transforms = config.get<any[]>('transforms') || [];

		// 	switch (message.command) {
		// 		case 'loadTransforms':
		// 			if (!Array.isArray(transforms)) {
		// 				transforms = [];
		// 			}
		// 			webviewView.webview.postMessage({ command: 'loadTransforms', transforms });
		// 			break;

		// 		case 'saveTransform':
		// 			// Check if the transform already exists
		// 			const existingIndex = transforms.findIndex((t) => t.name === message.name);
		// 			if (existingIndex >= 0) {
		// 				transforms[existingIndex] = { name: message.name, function: message.function };
		// 			} else {
		// 				transforms.push({ name: message.name, function: message.function });
		// 			}

		// 			// Save to settings
		// 			await config.update('transforms', transforms, vscode.ConfigurationTarget.Global);
		// 			vscode.window.showInformationMessage(`Transform "${message.name}" saved.`);
		// 			break;

		// 		case 'deleteTransform':
		// 			// Remove the selected transform
		// 			transforms = transforms.filter((t) => t.name !== message.name);
		// 			await config.update('transforms', transforms, vscode.ConfigurationTarget.Global);
		// 			vscode.window.showInformationMessage(`Transform "${message.name}" deleted.`);
		// 			break;

		// 		default:
		// 			vscode.window.showErrorMessage(`Unknown command: ${message.command}`);
		// 	}
		// });

		// // Send initial transforms to WebView
		// const config = vscode.workspace.getConfiguration('custom-text-transform');
		// const transforms = config.get<any[]>('transforms') || [];
		// webviewView.webview.postMessage({ command: 'loadTransforms', transforms });

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
        const nonce = getNonce();
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'bundled.js') // Adjust to your bundled file location
		);


		const test_area_htmls = `<div id="test_area_widgets">
		<vscode-textarea id="test-input" placeholder="Enter test text" rows="5" style="width: 100%; margin-top: 20px;"></vscode-textarea>
		<vscode-textarea id="test-output" placeholder="Transform result" rows="5" readonly style="width: 100%; margin-top: 10px;"></vscode-textarea>
		<vscode-button id="apply-transform" appearance="secondary" style="margin-top: 10px;">Apply Transform</vscode-button>
		</div>`;

		// /* ================================================================================================================== */
		// /* Basic TextArea Version                                                                                             */
		// /* ================================================================================================================== */
        // return `
        //     <!DOCTYPE html>
        //     <html lang="en">
        //     <head>
        //         <meta charset="UTF-8">
        //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
        //         <title>Transform Editor</title>
		// 		<script type="module" src="${scriptUri}" nonce="${nonce}"></script>
		// 		<style>
		// 			body {
		// 				font-family: var(--vscode-font-family);
		// 				margin: 0;
		// 				padding: 0 10px;
		// 			}
		// 			vscode-dropdown, vscode-textfield, vscode-textarea {
		// 				width: 100%;
		// 				margin-bottom: 10px;
		// 			}
		// 			#function {
		// 				font-family: monospace;
		// 				font-size: 12px;
		// 				width: 100%;
		// 				height: 200px;
		// 				margin-bottom: 10px;
		// 			}
		// 			vscode-button {
		// 				margin-right: 10px;
		// 			}
		// 		</style>
        //     </head>
        //     <body>
        //         <h1>Text Transform Editor</h1>
        //         <label for="existing">Existing Transforms:</label>
        //         <select id="existing">
        //             <option value="" disabled selected>Select a transform</option>
        //         </select>
        //         <br />
        //         <label for="name">Name:</label>
        //         <input type="text" id="name" placeholder="Transform Name" style="width: 90%;" />
        //         <br />
        //         <label for="function">Function:</label>
		// 		<textarea id="function" rows="10" cols="120" placeholder="Enter JavaScript Function" style="font-size: 12px; font-family: monospace;"></textarea>
        //         <br />
		// 		<vscode-button id="save" appearance="primary">Save Transform</vscode-button>
		// 		<vscode-button id="delete" appearance="secondary">Delete Transform</vscode-button>
		// 		${test_area_htmls}
        //         <div id="output"></div>
        //         <script nonce="${nonce}">
        //             const vscode = acquireVsCodeApi();

        //             // Populate existing transforms
        //             window.addEventListener('message', event => {
        //                 const message = event.data;
        //                 if (message.command === 'loadTransforms') {
        //                     const select = document.getElementById('existing');
        //                     select.dataset.transforms = JSON.stringify(message.transforms); // Store transforms for later use

        //                     select.innerHTML = '<option value="" disabled selected>Select a transform</option>';
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
		// 					document.getElementById('function').value = selectedTransform.function;
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

        //             // Request to load transforms on initialization
        //             vscode.postMessage({ command: 'loadTransforms' });
        //         </script>
        //     </body>
        //     </html>
        // `;

		/* ================================================================================================================== */
		/* VSCode-elements version:                                                                                           */
		/* ================================================================================================================== */
        return `
			<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Transform Editor</title>
				<script type="module" src="${scriptUri}" nonce="${nonce}"></script>
				<style>
					body {
						font-family: var(--vscode-font-family);
						margin: 0;
						padding: 0 10px;
					}
					vscode-dropdown, vscode-textfield, vscode-textarea {
						width: 100%;
						margin-bottom: 10px;
					}
					#function {
						font-family: monospace;
						font-size: 12px;
						width: 100%;
						height: 200px;
						margin-bottom: 10px;
					}
					vscode-button {
						margin-right: 10px;
					}
				</style>
            </head>
			<body>
				<h1>Text Transform Editor</h1>
                <vscode-label for="existing">Existing Transforms:</vscode-label>
                <vscode-single-select id="existing">
                    <vscode-option value="" disabled selected>Select a transform</vscode-option>
                </vscode-single-select>
				<vscode-textfield id="name" placeholder="Transform Name" aria-label="Transform Name"></vscode-textfield>
				<vscode-label for="function">Function:</vscode-label>
				<vscode-textarea monospace id="function" placeholder="Enter JavaScript Function"></vscode-textarea>
				<vscode-button id="save" appearance="primary">Save Transform</vscode-button>
				<vscode-button id="delete" appearance="secondary">Delete Transform</vscode-button>
				${test_area_htmls}
				<div id="output"></div>
				<script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();

                    // Populate existing transforms
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'loadTransforms') {
                            const select = document.getElementById('existing');
                            select.dataset.transforms = JSON.stringify(message.transforms); // Store transforms for later use

                            select.innerHTML = '<vscode-option value="" disabled selected>Select a transform</vscode-option>';
                            message.transforms.forEach(transform => {
                                const option = document.createElement('vscode-option');
                                option.value = transform.name;
                                option.textContent = transform.name;
                                select.appendChild(option);
                            });
                        }
						else if (message.command === 'updateTestingText') {
							document.getElementById('test-output').value = message.transformedText;

						}

                    });

					// GUI Element Event Listeners:
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

                    document.getElementById('apply-transform').addEventListener('click', () => {
                        const name = document.getElementById('name').value;
                        const functionCode = document.getElementById('function').value; // get the function code
						const testInputText = document.getElementById('test-input').value; // get the test input text
                        // vscode.postMessage({ command: 'custom-text-transform.applySnippetTransform', name, function: functionCode });
						vscode.postMessage({ command: 'executeTransform', name, function: functionCode, arguments: testInputText });
                    });


                    // Request to load transforms on initialization
                    vscode.postMessage({ command: 'loadTransforms' });

                </script>
			</body>
			</html>
        `;


		/* ================================================================================================================== */
		/* More complex editor (Monoco Editor):                                                                               */
		/* ================================================================================================================== */
		// return `
		// 	<!DOCTYPE html>
		// 	<html lang="en">
		// 	<head>
		// 		<meta charset="UTF-8">
		// 		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		// 		<title>Transform Editor</title>
		// 		<script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.42.0/min/vs/loader.js" nonce="${nonce}"></script>
		// 		<style>
		// 			#function-editor {
		// 				width: 100%;
		// 				height: 300px;
		// 				border: 1px solid #ccc;
		// 				margin-top: 8px;
		// 				border-radius: 4px;
		// 			}
		// 		</style>
		// 	</head>
		// 	<body>
		// 		<h1>Text Transform Editor</h1>
		// 		<label for="existing">Existing Transforms:</label>
		// 		<select id="existing">
		// 			<option value="" disabled selected>Select a transform</option>
		// 		</select>
		// 		<br />
		// 		<label for="name">Name:</label>
		// 		<input type="text" id="name" placeholder="Transform Name" />
		// 		<br />
		// 		<label for="function">Function:</label>
		// 		<div id="function-editor"></div>
		// 		<br />
		// 		<button id="save">Save Transform</button>
		// 		<button id="delete">Delete Transform</button>
		// 		<div id="output"></div>
		// 		<script nonce="${nonce}">
		// 			const vscode = acquireVsCodeApi();

		// 			// Load Monaco Editor when the page is ready
		// 			require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.42.0/min/vs' } });
		// 			require(['vs/editor/editor.main'], function () {
		// 				const editor = monaco.editor.create(document.getElementById('function-editor'), {
		// 					value: '', // Initial empty value
		// 					language: 'javascript', // Use 'typescript' for TypeScript
		// 					theme: 'vs-dark', // Optional: 'vs' for light theme
		// 					automaticLayout: true, // Automatically resize with the container
		// 					fontSize: 12 // Smaller font size
		// 				});

		// 				// Populate editor content when a transform is selected
		// 				window.addEventListener('message', (event) => {
		// 					const message = event.data;
		// 					if (message.command === 'loadTransforms') {
		// 						const select = document.getElementById('existing');
		// 						select.dataset.transforms = JSON.stringify(message.transforms);

		// 						select.innerHTML = '<option value="" disabled selected>Select a transform</option>';
		// 						message.transforms.forEach(transform => {
		// 							const option = document.createElement('option');
		// 							option.value = transform.name;
		// 							option.textContent = transform.name;
		// 							select.appendChild(option);
		// 						});
		// 					} else if (message.command === 'populateEditor') {
		// 						editor.setValue(message.function);
		// 					}
		// 				});

		// 				// Handle Save Button
		// 				document.getElementById('save').addEventListener('click', () => {
		// 					const name = document.getElementById('name').value;
		// 					const functionCode = editor.getValue();
		// 					vscode.postMessage({ command: 'saveTransform', name, function: functionCode });
		// 				});

		// 				// Notify Extension on Change
		// 				document.getElementById('existing').addEventListener('change', (event) => {
		// 					const selectedName = event.target.value;
		// 					const transforms = JSON.parse(event.target.dataset.transforms || '[]');
		// 					const selectedTransform = transforms.find(t => t.name === selectedName);
		// 					if (selectedTransform) {
		// 						document.getElementById('name').value = selectedTransform.name;
		// 						vscode.postMessage({ command: 'populateEditor', function: selectedTransform.function });
		// 					}
		// 				});
		// 			});
		// 		</script>
		// 	</body>
		// 	</html>
		// `;

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



// async function openTransformEditor(context: vscode.ExtensionContext) {
//     const panel = vscode.window.createWebviewPanel(
//         'transformEditor',
//         'Text Transform Editor',
//         vscode.ViewColumn.One,
//         {
//             enableScripts: true
//         }
//     );

//     // Fetch existing transforms
//     const config = vscode.workspace.getConfiguration('custom-text-transform');
//     const transforms: { name: string, function: string }[] = config.get('transforms') || [];

//     panel.webview.html = getWebviewContent();

//     // Send the existing transforms to the WebView
//     panel.webview.postMessage({ command: 'loadTransforms', transforms });

//     panel.webview.onDidReceiveMessage(async (message) => {
//         switch (message.command) {
//             case 'saveTransform':
//                 const updatedTransforms = Array.isArray(transforms) ? [...transforms] : [];
//                 const existingIndex = updatedTransforms.findIndex((t: any) => t.name === message.name);
//                 if (existingIndex >= 0) {
//                     updatedTransforms[existingIndex] = { name: message.name, function: message.function };
//                 } else {
//                     updatedTransforms.push({ name: message.name, function: message.function });
//                 }
//                 await config.update('transforms', updatedTransforms, vscode.ConfigurationTarget.Global);
//                 vscode.window.showInformationMessage(`Transform "${message.name}" saved.`);
//                 break;
//             case 'deleteTransform':
//                 const filteredTransforms = transforms.filter((t: any) => t.name !== message.name);
//                 await config.update('transforms', filteredTransforms, vscode.ConfigurationTarget.Global);
//                 vscode.window.showInformationMessage(`Transform "${message.name}" deleted.`);
//                 break;
//         }
//     });
// }


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




