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

	let disposable_transformSelectedText = vscode.commands.registerCommand('custom-text-transform.transformSelectedText', () => {
        // Access the custom setting
        const config = vscode.workspace.getConfiguration('custom-text-transform');
        const transforms = config.get<{ name: string, function: string }[]>('transforms');

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('You need to open an editor to transform text.');
            return; // Exit if there is no open text editor
        }

        if (transforms && transforms.length > 0) {
            // Use the first transformation for demonstration purposes
            const transform = transforms[0];

            // Execute the actual transformation if a selection is available
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            
            // WARNING: Executing arbitrary code using eval has security implications and should be done with caution.
            try {
                // Here we're using `eval` to dynamically execute the function.
                // The function code is expected to be a string in which `input` is the parameter that represents the selected text.
                const transformedText = eval(`(function(input){${transform.function}})('${text}')`);

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


}

// This method is called when your extension is deactivated
export function deactivate() {}
