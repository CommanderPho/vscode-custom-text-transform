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
    let disposable_list_customTransforms = vscode.commands.registerCommand('extension.listCustomTransforms', () => {
        // Access the custom setting
        const config = vscode.workspace.getConfiguration('custom-text-transform');
        const transforms = config.get<{ name: string, function: string }[]>('transforms');

        if (transforms && transforms.length > 0) {
            // Use the first transformation for demonstration purposes
            const transform = transforms[0];
            vscode.window.showInformationMessage(`Using transform: ${transform.name}`);
            
            // Execute the transformation function on the selected text
            // Note: Executing arbitrary code from settings could be dangerous and should be handled with caution
        } else {
            vscode.window.showInformationMessage('No custom transforms defined. Add some to settings.json.');
        }
    });
    context.subscriptions.push(disposable_list_customTransforms);



	let disposable_transformSelectedText = vscode.commands.registerCommand('extension.transformSelectedText', () => {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;

        // Check if there is an active editor
        if (editor) {
            // Get the selection range
            const selection = editor.selection;

            // Get the selected text from the document
            const text = editor.document.getText(selection);

            // Use the selected text as needed
            vscode.window.showInformationMessage(`Selected text: ${text}`);



        }
    });
    context.subscriptions.push(disposable_transformSelectedText);


}

// This method is called when your extension is deactivated
export function deactivate() {}
