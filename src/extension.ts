// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "custom-text-transform" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable_helloWorld = vscode.commands.registerCommand('custom-text-transform.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Custom Text Transform!');
	});

	context.subscriptions.push(disposable_helloWorld);


	// The function that implements the command
    let disposable_list_customTransforms = vscode.commands.registerCommand('custom-text-transform.listCustomTransforms', () => {
        // Access the custom setting
        const config = vscode.workspace.getConfiguration('custom-text-transform');
        const transforms = config.get<{ name: string, function: string }[]>('transforms');

        if (transforms && transforms.length > 0) {
			// Loop through and print the transforms:
			transforms.forEach((transform, index) => {
				const message = `(${index + 1}) ${transform.name}`;
				vscode.window.showInformationMessage(message);
			});           
        } else {
            vscode.window.showInformationMessage('No custom transforms defined. Add some to settings.json.');
        }
    });
    context.subscriptions.push(disposable_list_customTransforms);


    let disposable_transformSelectedText = vscode.commands.registerCommand('custom-text-transform.transformSelectedText', async () => {
        // Access the custom setting
        const config = vscode.workspace.getConfiguration('custom-text-transform');
        const transforms = config.get<{ name: string, function: string }[]>('transforms');

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('You need to open an editor to transform text.');
            return; // Exit if there is no open text editor
        }

        if (transforms && transforms.length > 0) {
            // Allow the user to type and pick a transform name with auto-complete
            const picked = await vscode.window.showQuickPick(
                transforms.map(transform => transform.name),
                {
                    placeHolder: 'Type or pick a transform to apply',
                    matchOnDetail: true
                }
            );
            
            const transform = transforms.find(t => t.name === picked);
            if (!transform) {
                vscode.window.showInformationMessage(`No transform selected.`);
                return;
            }

            // Execute the actual transformation if a selection is available
            const selection = editor.selection;
            const text = editor.document.getText(selection);

            // WARNING: Executing arbitrary code using eval has security implications and should be done with caution.
            try {
                // Here we're using `eval` to dynamically execute the function.
                // The function code is expected to be a string in which `input` is the parameter that represents the selected text.
                const transformedText = eval(`(function(input){${transform.function}})('${text.replace(/'/g, "\\'")}')`);

                // Apply the transformed text back to the document
                editor.edit((editBuilder) => {
                    editBuilder.replace(selection, transformedText);
                });

                vscode.window.showInformationMessage(`Using transform: ${transform.name}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error applying transform: ${transform.name}. Please check the function syntax.`);
            }
        } else {
            vscode.window.showInformationMessage('No custom transforms defined. Add some to settings.json.');
        }
    });
    context.subscriptions.push(disposable_transformSelectedText);


    // // Perform the selected transform
	// let disposable_transformSelectedText = vscode.commands.registerCommand('custom-text-transform.transformSelectedText', async () => {
    //     // Access the custom setting
    //     const config = vscode.workspace.getConfiguration('custom-text-transform');
    //     const transforms = config.get<{ name: string, function: string }[]>('transforms');

    //     const editor = vscode.window.activeTextEditor;
    //     if (!editor) {
    //         vscode.window.showInformationMessage('You need to open an editor to transform text.');
    //         return; // Exit if there is no open text editor
    //     }

    //     if (transforms && transforms.length > 0) {
    //         // Use the first transformation for demonstration purposes
    //         // const transform = transforms[0];
    //         // Allow the user to type and pick a transform name with auto-complete
    //         const picked = await vscode.window.showQuickPick(
    //             transforms.map(transform => transform.name),
    //             {
    //                 placeHolder: 'Type or pick a transform to apply',
    //                 matchOnDetail: true
    //             }
    //         );
            
    //         const transform = transforms.find(t => t.name === picked);
    //         if (!transform) {
    //             vscode.window.showInformationMessage(`No transform selected.`);
    //             return;
    //         }


    //         // Execute the actual transformation if a selection is available
    //         const selection = editor.selection;
    //         const text = editor.document.getText(selection);
            
    //         // WARNING: Executing arbitrary code using eval has security implications and should be done with caution.
    //         try {
    //             // Here we're using `eval` to dynamically execute the function.
    //             // The function code is expected to be a string in which `input` is the parameter that represents the selected text.
    //             const transformedText = eval(`(function(input){${transform.function}})('${text}')`);

    //             // Apply the transformed text back to the document
    //             editor.edit((editBuilder) => {
    //                 editBuilder.replace(selection, transformedText);
    //             });

    //             vscode.window.showInformationMessage(`Using transform: ${transform.name}`);
    //         } catch (error) {
    //             vscode.window.showErrorMessage(`Error applying transform: ${transform.name}. Please check the function syntax.`);
    //         }
    //     } else {
    //         vscode.window.showInformationMessage('No custom transforms defined. Add some to settings.json.');
    //     }
    // });
    // context.subscriptions.push(disposable_transformSelectedText);

	// Register a completion item provider for custom transforms
    const transformProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: '*' },  // Target all files and languages
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const config = vscode.workspace.getConfiguration('custom-text-transform');
                const transforms = config.get<{ name: string, function: string }[]>('transforms');

                if (!transforms) {
                    return [];
                }

                // Create completion items for each transform
                const completionItems: vscode.CompletionItem[] = transforms.map(transform => {
                    const item = new vscode.CompletionItem(transform.name, vscode.CompletionItemKind.Snippet);
                    item.detail = 'Custom Text Transform';
                    item.insertText = new vscode.SnippetString(`${transform.name}`);
                    item.command = { command: 'custom-text-transform.applySnippetTransform', title: 'Apply Transform', arguments: [transform.name] };

                    return item;
                });

                return completionItems;
            }
        },
        ' ' // Trigger completion after typing a space
    );

    context.subscriptions.push(transformProvider);


    context.subscriptions.push(
        vscode.commands.registerCommand('custom-text-transform.openEditor', () => {
            openTransformEditor(context);
        })
    );


}

// This method is called when your extension is deactivated
export function deactivate() {}


function openTransformEditor(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'transformEditor',
        'Text Transform Editor',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    panel.webview.html = getWebviewContent();

    // Handle messages from the WebView
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'testTransform':
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const input = editor.document.getText(editor.selection);
                    try {
                        const result = eval(message.function)(input);
                        panel.webview.postMessage({ command: 'transformResult', result });
                    } catch (error) {
                    if (error instanceof Error) {
                        panel.webview.postMessage({ command: 'error', error: error.message });
                    } else {
                        panel.webview.postMessage({ command: 'error', error: String(error) });
                    }
                }
                }
                break;
            case 'saveTransform':
                const config = vscode.workspace.getConfiguration('custom-text-transform');
                const transforms: { name: string, function: string }[] = config.get('transforms') || [];
                transforms.push({ name: message.name, function: message.function });
                await config.update('transforms', transforms, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Transform "${message.name}" saved.`);
                break;
        }
    });
}

function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Transform Editor</title>
        </head>
        <body>
            <h1>Create a New Transform</h1>
            <label for="name">Name:</label>
            <input type="text" id="name" placeholder="Transform Name" />
            <br />
            <label for="function">Function:</label>
            <textarea id="function" rows="10" cols="50" placeholder="Enter JavaScript Function"></textarea>
            <br />
            <button id="test">Test Transform</button>
            <button id="save">Save Transform</button>
            <div id="output"></div>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('test').addEventListener('click', () => {
                    const functionCode = document.getElementById('function').value;
                    vscode.postMessage({ command: 'testTransform', function: functionCode });
                });
                document.getElementById('save').addEventListener('click', () => {
                    const name = document.getElementById('name').value;
                    const functionCode = document.getElementById('function').value;
                    vscode.postMessage({ command: 'saveTransform', name, function: functionCode });
                });
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'transformResult') {
                        document.getElementById('output').innerText = "Result: " + message.result;
                    } else if (message.command === 'error') {
                        document.getElementById('output').innerText = "Error: " + message.error;
                    }
                });
            </script>
        </body>
        </html>
    `;
}


