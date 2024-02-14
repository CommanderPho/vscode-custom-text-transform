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
        }
    ]
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


