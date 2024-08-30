# custom-text-transform README

Allows applying arbitrary user-defined transforms to the selected code.

## Extension Settings

To define custom transforms:
```
        "custom-text-transform.transforms": [
        
            {
                "name": "Variable list into Python dictionary",
                "function": "const variableList = input.split(',').map(varName => varName.trim()); return '{' + variableList.map(varName => `'${varName}':${varName}`).join(', ') + '}';"
            },
            {
                "name": "Variable list into kwargs",
                "function": "const variableList = input.split(',').map(varName => varName.trim()); return variableList.map(varName => `${varName}=${varName}`).join(', ');"
            },
            {
                "name": "Function definition into classdef method definition",
                "function": "const lines = input.trim().split('\\n'); const funcName = lines[0].trim().split(' ')[1].split('(')[0]; const args = lines[0].trim().split('(')[1].split(')')[0].split(',').map(arg => arg.trim()); const body = lines.slice(1, -1).join('\\n'); return `def ${funcName}(self, ${args.join(', ')}):${body ? '\\n' + body : ''}`;"
            },
            {
                "name": "Python function definition to kwargs call",
                "function": "return input.replace(/def\\s+(\\w+)\\(([^)]*)\\):[\\s\\S]*/, (_, fnName, params) => fnName + '(' + params.replace(/\\w+\\s*(?:\\:[^=,]+)?\\s*(=\\s*[^,]+)?/g, (p) => p.trim().split('=')[0].trim() + '=' + p.trim().split('=')[0].trim()).split(',').join(', ') + ')');"
            },
        ],

```


## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release.

---

# Related Emojis

♻↪️
✔️➡
🌀
↗
🌟✨💫⚡
🆕


