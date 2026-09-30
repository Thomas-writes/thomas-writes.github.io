//global variables
const terminal = document.getElementById('terminal');
const input = document.getElementById('input');
const output = document.getElementById('output');
//used for tab-complete
let maxKeys = []
let autoCompleteIndex = 0
let original_input = ""
// ChatGPT: Startup owns the prompt only until the intro finishes or a key skips it.
let startupRunning = false;
let startupTimer = null;

terminal.addEventListener('click', () => {
    input.focus();
});

input.addEventListener('focus', () => {
    input.select();
});

// ChatGPT: Keep your directory lists and add a source directory for inspecting this site.
let mainDirectories = ["professional", "hobbies", "src"]
let professionalFiles = ["resume.pdf", "projects.md", "aboutme.txt"];
let hobbiesFiles = ["workouts.md"]
let sourceFiles = ["index.html", "styles.css", "script.js", "aboutme.txt", "resume.pdf", "projects.md", "workouts.md"];
let commandHistory = [];
let historyIndex = 0;
let historyDraft = "";
let curDirectory = `/`;
let span = document.getElementById('mainspan');

input.addEventListener('keydown', (event) => {
    if (startupRunning) {
        if (event.ctrlKey || event.metaKey || event.altKey || ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(event.key)) return;
        event.preventDefault();
        finishStartup();
        return;
    }
    if (input.readOnly) return;
    if (event.key !== 'Tab') resetCompletion();
    if (event.key === 'Enter') {
        event.preventDefault();
    
        let userInput = input.value.trim();
        if (!userInput) return;
        commandHistory.push(userInput);
        historyIndex = commandHistory.length;
        historyDraft = "";
        let newLine = document.createElement('div');
        newLine.className = 'command-line';
        newLine.textContent = `$ ${curDirectory} ${userInput}`;
        output.appendChild(newLine);

        input.value = '';
        // ChatGPT: Reading files requires cat; bare filenames and portfolio labels are not commands.
        const command = userInput.split(/\s+/)[0];
        const argument = userInput.slice(command.length).trim();
        //clear function
        if (userInput.trim() === 'clear') {
            output.innerHTML = '';
        }
        //ls function
        else if (command === 'ls'){
            output.appendChild(document.createElement('br'));
            let lsLine = document.createElement('div');
            lsLine.textContent = ` `
            
            // ChatGPT: The same lists now support ls with an absolute or relative path.
            let files = directoryFiles(resolvePath(argument || curDirectory));
            if (!files) {
                errorOutput('Directory not found.');
                return;
            }
            for (let i = 0; i < files.length; i++){
                lsLine.textContent += `${files[i]} `;
            }
            output.appendChild(lsLine)
            output.appendChild(document.createElement('br'));
        }
        //cd function
        else if (command === 'cd') {
            // ChatGPT: Resolve paths before updating your existing directory and prompt variables.
            let dirName = resolvePath(argument || '/');
            if (directoryFiles(dirName)) {
                curDirectory = dirName === '/' ? '/' : `${dirName}/`;
                let changeDirOutput = document.createElement('div');
                changeDirOutput.textContent = `Changed directory to ${curDirectory}`;
                itemWithBr(changeDirOutput);
                span.textContent = `$ ${curDirectory}`;
            }else{
                errorOutput("Directory not found. Type 'ls' for directories.");
            }
        }
        else if (userInput === 'pwd') {
            let pathOutput = document.createElement('div');
            pathOutput.textContent = curDirectory;
            itemWithBr(pathOutput);
        }
        // ChatGPT: A site profile inspired by neofetch, without claiming to read the visitor's system.
        else if (userInput === 'neofetch') {
            neofetch();
        }
        //help function
        else if (userInput === "help") {
            let helpOutput = document.createElement('div');
            helpOutput.textContent = `Available commands:`;
            output.appendChild(document.createElement('br'));
            output.appendChild(helpOutput);
            
            const commands = [
                "- ls [path]: List directories and files",
                "- cd [directory]: Change directory; supports /, ~, . and ..",
                "- pwd: Show the current directory",
                "- neofetch: Show ASCII artwork and the site profile",
                "- open /professional/resume.pdf: View my resume",
                "- cd /src: Browse this website source",
                "- Tab: Complete commands and paths; Up/Down: Command history",
                "- clear: Clear the terminal screen",
                "- open [file]: open this file in a new tab",
                "- help: Show this help message",
                "- cat [file]: Open the file in terminal"
            ];
            
            commands.forEach(command => {
                let commandLine = document.createElement('div');
                commandLine.textContent = command;
                output.appendChild(commandLine);
            });
            
            output.appendChild(document.createElement('br'));
        }
        //open function
        else if (command === 'open'){
            // ChatGPT: Split a resolved path so your existing per-directory handlers still work.
            let filePath = resolvePath(argument);
            let fileName = filePath.slice(filePath.lastIndexOf('/') + 1);
            let fileDirectory = filePath.slice(0, filePath.lastIndexOf('/') + 1);
            if (!argument) { errorOutput('Usage: open <file>'); return; }
            if (fileDirectory == `/professional/`){
                if (fileName === "resume.pdf"){
                    // ChatGPT: Let the browser's PDF viewer display the original resume.
                    window.open('resume.pdf', '_blank', 'noopener');
                    output.appendChild(document.createElement('br'));
                }
                else if (fileName === "aboutme.txt"){
                    window.open('aboutme.txt', '_blank', 'noopener');
                    output.appendChild(document.createElement('br'));
                }
                else if (fileName === "projects.md"){
                    openMarkdownFile('./projects.md');
                    output.appendChild(document.createElement('br'));
                }
                else{
                    errorOutput();
                }
            }
            else if (fileDirectory == `/hobbies/`){
                if (fileName === "workouts.md"){
                    openMarkdownFile('./workouts.md');
                    output.appendChild(document.createElement('br'));
                }
                else{
                    errorOutput();
                }
            }
            else if (fileDirectory === '/src/' && sourceFiles.includes(fileName)) {
                if (fileName === 'resume.pdf') window.open('resume.pdf', '_blank', 'noopener');
                else openSourceFile(fileName);
            }
            else{
                errorOutput();
            }
        }
        //cat function
        else if (command === 'cat'){
            // ChatGPT: Split a resolved path so your existing per-directory handlers still work.
            let filePath = resolvePath(argument);
            let fileName = filePath.slice(filePath.lastIndexOf('/') + 1);
            let fileDirectory = filePath.slice(0, filePath.lastIndexOf('/') + 1);
            if (!argument) { errorOutput('Usage: cat <file>'); return; }
            if (fileDirectory == `/professional/`){
                if (fileName === "aboutme.txt"){
                    readLocalFile('./aboutme.txt')
                    //response.text() gets passed as out short for output - same for all cat calls
                    //response.text() has the text of the file
                    .then(out => {catFunc(out, fileName);
                    }).catch(error => errorOutput(error.message));
                }
                else if (fileName === "resume.pdf"){
                    errorOutput('Try open resume.pdf instead.');
                }
                else if (fileName === "projects.md"){
                    readLocalFile('./projects.md')
                    .then(out => {catFunc(out, fileName);
                    }).catch(error => errorOutput(error.message));
                }
                else{
                    errorOutput();
                }
            }else if (fileDirectory == `/hobbies/`){
                if (fileName === "workouts.md"){
                    readLocalFile('./workouts.md')
                    .then(out => {catFunc(out, fileName);
                    }).catch(error => errorOutput(error.message));
                }
                else{
                    errorOutput();
                }
            }else if (fileDirectory === '/src/' && sourceFiles.includes(fileName)) {
                if (fileName === 'resume.pdf') errorOutput('Try open resume.pdf instead.');
                else readLocalFile(fileName).then(out => catFunc(out, fileName)).catch(error => errorOutput(error.message));
            }else{
                errorOutput();
            }
        }
        else {
            let unknownCommand = document.createElement('div');
            unknownCommand.className = 'terminal-error';
            unknownCommand.textContent = `${userInput}: command not found. Use cat <file> to read a file, or help for commands.`;
            itemWithBr(unknownCommand);
        }    
    }else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        // ChatGPT: Save the unfinished input so Down can restore it after browsing history.
        event.preventDefault();
        if (historyIndex === commandHistory.length) historyDraft = input.value;
        historyIndex += event.key === 'ArrowUp' ? -1 : 1;
        historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex));
        input.value = historyIndex === commandHistory.length ? historyDraft : commandHistory[historyIndex];
        input.setSelectionRange(input.value.length, input.value.length);
    }else if (event.key == "Tab"){
        event.preventDefault();
        // ChatGPT: Empty input stays empty; only complete a typed prefix at the end of the input.
        if (!input.value.trim()) { resetCompletion(); return; }
        if (input.selectionStart !== input.value.length || input.selectionEnd !== input.value.length) return;
        if (maxKeys.length === 0) {
            original_input = input.value;
            let listOfCommands = ["ls", "cd", "cat", "help", "open", "clear", "pwd", "neofetch"];
            let match = original_input.match(/^(.*\s)?([^\s]*)$/);
            let prefix = match[1] || '';
            let fragment = match[2];
            if (!fragment) return;
            if (!prefix) {
                maxKeys = listOfCommands.filter(command => command.startsWith(fragment));
            }else if (['ls', 'cd', 'cat', 'open'].includes(prefix.trim())) {
                let slash = fragment.lastIndexOf('/');
                let parent = fragment.slice(0, slash + 1);
                let partial = fragment.slice(slash + 1);
                let files = directoryFiles(resolvePath(parent || '.')) || [];
                maxKeys = files.filter(name => name.startsWith(partial))
                    .filter(name => prefix.trim() !== 'cd' || name.endsWith('/'))
                    .map(name => prefix + parent + name);
            }
        }
        if (maxKeys.length > 0){
            input.value = maxKeys[autoCompleteIndex];
            input.setSelectionRange(input.value.length, input.value.length);
            //mod sends it back to 0
            autoCompleteIndex = (autoCompleteIndex + 1) % maxKeys.length;
        }
    }
});

function catFunc(out, fileName) {
    output.appendChild(document.createElement('br'));
    let header = document.createElement('div');
    header.textContent = `This is the content of ${fileName}:`;
    output.appendChild(header);
    output.appendChild(document.createElement('br'));
    let outputtext = document.createElement('div');
    outputtext.innerText = out;
    outputtext.style.paddingLeft = "20px";
    output.appendChild(outputtext);
    output.appendChild(document.createElement('br'));
};

function openMarkdownInNewTab(markdownText, newTab) {
    // ChatGPT: Fall back to plain text if the external Markdown library is unavailable.
    if (typeof marked === 'undefined') {
        let pre = newTab.document.createElement('pre');
        pre.textContent = markdownText;
        newTab.document.body.replaceChildren(pre);
        return;
    }
    let text = marked.parse(markdownText);
    
    if (newTab) {
        newTab.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Markdown</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown.css">
            <style>
                body {
                    margin: auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                }
            </style>
        </head>
        <body class="markdown-body">
            ${text}
        </body>
        </html>`);
        newTab.document.close();
    }
}


function itemWithBr(element){
    output.appendChild(document.createElement('br'));
    output.appendChild(element);
    output.appendChild(document.createElement('br'));
};

function errorOutput(message){
    let errorText = document.createElement('div');
    errorText.className = 'terminal-error';
    errorText.textContent = message || `File not found. Type 'help' for a list of commands and 'ls' for files and directories`;
    output.appendChild(document.createElement('br'));
    output.appendChild(errorText);
    output.appendChild(document.createElement('br'));
}

// ChatGPT: These helpers extend your handlers without changing the on-disk file layout.
function resetCompletion() {
    maxKeys = [];
    autoCompleteIndex = 0;
    original_input = '';
}
input.addEventListener('input', resetCompletion);

function resolvePath(path) {
    if (path === '~' || path.startsWith('~/')) path = '/' + path.slice(2);
    let parts = (path.startsWith('/') ? path : curDirectory + path).split('/');
    let resolved = [];
    for (let part of parts) {
        if (part === '..') resolved.pop();
        else if (part && part !== '.') resolved.push(part);
    }
    return '/' + resolved.join('/');
}

function directoryFiles(path) {
    if (path === '/') return mainDirectories.map(name => name + '/');
    if (path === '/professional') return professionalFiles;
    if (path === '/hobbies') return hobbiesFiles;
    if (path === '/src') return sourceFiles;
    return null;
}

function readLocalFile(fileName) {
    // ChatGPT: Keep commands in order while loading and report HTTP errors to the caller.
    input.readOnly = true;
    return fetch(fileName)
        .then(response => {
            if (!response.ok) throw new Error(`Unable to read ${fileName} (${response.status}).`);
            return response.text();
        })
        .finally(() => { input.readOnly = false; });
}

function openMarkdownFile(fileName) {
    // ChatGPT: Reserve the tab before fetching so popup blockers see the original key event.
    let newTab = window.open();
    if (!newTab) { errorOutput('Popup blocked. Allow popups or use cat to read the file.'); return; }
    newTab.opener = null;
    newTab.document.body.textContent = 'Loading…';
    readLocalFile(fileName)
        .then(markdownText => { if (!newTab.closed) openMarkdownInNewTab(markdownText, newTab); })
        .catch(error => {
            if (!newTab.closed) newTab.document.body.textContent = error.message;
            errorOutput(error.message);
        });
}

function openSourceFile(fileName) {
    // ChatGPT: Source files open as text, so viewing index.html does not launch another terminal.
    let newTab = window.open();
    if (!newTab) { errorOutput('Popup blocked. Allow popups or use cat to read the file.'); return; }
    newTab.opener = null;
    newTab.document.body.textContent = 'Loading…';
    readLocalFile(fileName).then(text => {
        if (newTab.closed) return;
        newTab.document.title = fileName;
        let pre = newTab.document.createElement('pre');
        pre.textContent = text;
        newTab.document.body.replaceChildren(pre);
    }).catch(error => {
        if (!newTab.closed) newTab.document.body.textContent = error.message;
        errorOutput(error.message);
    });
}


// ChatGPT: Keep ASCII spacing in a pre element and use textContent for every line.
function neofetch() {
    let fetchOutput = document.createElement('div');
    fetchOutput.className = 'neofetch';
    let art = document.createElement('pre');
    art.className = 'neofetch-art';
    art.textContent = [
        '        .--------------------.',
        '       / .----------------. /|',
        '      / /                 / /|',
        '     / /   >_ THOMAS     / / |',
        '    / /                 / /  |',
        '   / /   [ systems ]   / /   |',
        '  / /_________________/ /    |',
        ' /_____________________/     |',
        ' |  . . .              |    /',
        ' |_____________________|   /',
        '       /________/      |  /',
        '      /________/       | /',
        '     /________/        |/',
        '    /_________________/'
    ].join('\n');
    let info = document.createElement('div');
    info.className = 'neofetch-info';
    let title = document.createElement('strong');
    title.textContent = 'thomas@terminal-website';
    info.appendChild(title);
    const details = [
        ['Site', 'Thomas Savasten'],
        ['Studies', 'Computer Science + Mathematics'],
        ['University', 'University of Kansas'],
        ['Shell', 'JavaScript / virtual filesystem'],
        ['Theme', 'Catppuccin Mocha'],
        ['Font', 'JetBrainsMono Nerd Font'],
        ['Path', curDirectory]
    ];
    details.forEach(([label, value]) => {
        let line = document.createElement('div');
        let key = document.createElement('span');
        key.className = 'neofetch-label';
        key.textContent = label + ': ';
        line.appendChild(key);
        let text = document.createElement('span');
        text.textContent = value;
        line.appendChild(text);
        info.appendChild(line);
    });
    let palette = document.createElement('div');
    palette.className = 'neofetch-palette';
    palette.setAttribute('aria-label', 'Catppuccin Mocha color palette');
    ['#f38ba8', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5', '#89b4fa', '#cba6f7', '#f5c2e7'].forEach(color => {
        let swatch = document.createElement('span');
        swatch.style.backgroundColor = color;
        palette.appendChild(swatch);
    });
    info.appendChild(palette);
    fetchOutput.appendChild(art);
    fetchOutput.appendChild(info);
    itemWithBr(fetchOutput);
}


// ChatGPT: Type the intro into your existing input, then run its normal Enter handler.
function startStartup() {
    startupRunning = true;
    input.readOnly = true;
    input.setAttribute('aria-label', 'Starting terminal. Press a key to skip the intro.');
    const command = 'neofetch';
    let index = 0;
    function typeNextLetter() {
        input.value = command.slice(0, ++index);
        input.setSelectionRange(input.value.length, input.value.length);
        startupTimer = setTimeout(index < command.length ? typeNextLetter : finishStartup, index < command.length ? 95 : 250);
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finishStartup();
    }else{
        startupTimer = setTimeout(typeNextLetter, 350);
    }
}

function finishStartup() {
    if (!startupRunning) return;
    clearTimeout(startupTimer);
    startupTimer = null;
    startupRunning = false;
    input.readOnly = false;
    input.setAttribute('aria-label', 'Terminal command');
    input.value = 'neofetch';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
}

startStartup();
