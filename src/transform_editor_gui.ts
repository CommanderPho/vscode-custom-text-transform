import * as vscode from 'vscode';
// import "@vscode-elements/elements/dist/vscode-button/index.js";


// Modify the test area HTML to support multiple test pairs:
const test_area_htmls = `<div id="test_area_widgets">
    <div id="test-pairs-container">
        <!-- Test pairs will be dynamically added here -->
    </div>
    <vscode-button id="add-test-pair" appearance="secondary">Add Test Pair</vscode-button>
    <vscode-button id="run-all-tests" appearance="primary">Run All Tests</vscode-button>
</div>`;

// Add this template function for creating test pair elements:
function createTestPairHTML(index: number, input: string = '', expected: string = '') {
    return `
        <div class="test-pair" data-index="${index}">
            <h3>Test Pair ${index + 1}</h3>
            <vscode-textarea class="test-input" placeholder="Input text" rows="3">${input}</vscode-textarea>
            <vscode-textarea class="test-expected" placeholder="Expected output" rows="3">${expected}</vscode-textarea>
            <vscode-textarea class="test-actual" placeholder="Actual output" rows="3" readonly></vscode-textarea>
            <vscode-button class="run-test" appearance="secondary">Run Test</vscode-button>
            <vscode-button class="remove-test" appearance="secondary">Remove</vscode-button>
        </div>
    `;
}



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
					transforms = transforms.map(t => ({ name: t.name, function: t.function.replace(/;(?!\n)/g, ';\n'), flattened_function: t.function, test_texts: t.test_texts })); // Add newlines for display

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
                        // transforms.push({ name: message.name, function: message.function, test_texts: message.test_texts });
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
					// const text = message.test_texts
					
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
				<vscode-textfield monospace id="function_flattened" placeholder="Flattened JavaScript Function" readonly="true" style="width: 100%;>
					<vscode-icon slot="content-before" name="filter" action-icon></vscode-icon>
				</vscode-textfield>
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
							// When loading transforms, populate test pairs
							// document.getElementById('test-input').value = "";
							// Clear and populate test pairs if a transform is selected
							const selectedTransform = message.transforms.find(t => t.name === select.value);
							if (selectedTransform?.test_texts) {
								const container = document.getElementById('test-pairs-container');
								container.innerHTML = '';
								selectedTransform.test_texts.forEach((test, index) => {
									container.insertAdjacentHTML('beforeend', createTestPairHTML(index, test.input, test.expected));
								});
							}

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
							document.getElementById('function_flattened').value = selectedTransform.flattened_function;

							// const test_texts = selectedTransform.test_texts || [];
							// if len(test_texts) > 0 {
							// 	document.getElementById('test-input').value = selectedTransform.test_texts[0];
							// }

                        }
                    });

					// Save transform - include test pairs
                    document.getElementById('save').addEventListener('click', () => {
                        const name = document.getElementById('name').value;
                        const functionCode = document.getElementById('function').value;
						const testPairs = Array.from(document.querySelectorAll('.test-pair')).map(pair => ({
							input: pair.querySelector('.test-input').value,
							expected: pair.querySelector('.test-expected').value
						}));
						vscode.postMessage({ 
							command: 'saveTransform', 
							name, 
							function: functionCode,
							test_texts: testPairs
						});
						// vscode.postMessage({ command: 'saveTransform', name, function: functionCode });
						// const test_texts = [document.getElementById('test-input').value];
                        // vscode.postMessage({ command: 'saveTransform', name, function: functionCode, test_texts: test_texts });
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


					// Add test pair button handler
					document.getElementById('add-test-pair').addEventListener('click', () => {
						const container = document.getElementById('test-pairs-container');
						const index = container.children.length;
						container.insertAdjacentHTML('beforeend', createTestPairHTML(index));
					});

					// Run all tests button handler
					document.getElementById('run-all-tests').addEventListener('click', () => {
						document.querySelectorAll('.test-pair').forEach(pair => {
							const input = pair.querySelector('.test-input').value;
							const functionCode = document.getElementById('function').value;
							vscode.postMessage({ 
								command: 'executeTransform',
								name: document.getElementById('name').value,
								function: functionCode,
								arguments: input,
								testIndex: pair.dataset.index
							});
						});
					});

                    // Request to load transforms on initialization
                    vscode.postMessage({ command: 'loadTransforms' });

                </script>
			</body>
			</html>
        `;

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



