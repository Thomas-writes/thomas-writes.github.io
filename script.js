//global variables
const terminal = document.getElementById('terminal');
const input = document.getElementById('input');
const output = document.getElementById('output');
//used for tab-complete
let maxKeys = []
let autoCompleteIndex = 0
let original_input = ""
// ChatGPT: BEGIN CG-JS-01 added code (after original line 8).
// ChatGPT: Startup owns the prompt only until the intro finishes or a key skips it.
let startupRunning = false;
let startupTimer = null;
const startupCommands = ['neofetch', 'guestbook'];
let startupIndex = 0;
// ChatGPT: END CG-JS-01.

terminal.addEventListener('click', () => {
    input.focus();
});

input.addEventListener('focus', () => {
    input.select();
});

// ChatGPT: BEGIN CG-JS-02 modified code (original lines 18-19).
// ChatGPT: Keep your directory lists and add a source directory for inspecting this site.
let mainDirectories = ["professional", "hobbies", "src", "guestbook"]
let professionalFiles = ["resume.pdf", "projects.md", "aboutme.txt"];
// ChatGPT: END CG-JS-02.
let hobbiesFiles = ["workouts.md"]
// ChatGPT: BEGIN CG-JS-03 added code (after original line 20).
let sourceFiles = ["index.html", "styles.css", "script.js", "favicon.svg", "aboutme.txt", "resume.pdf", "projects.md", "workouts.md"];
let commandHistory = [];
let historyIndex = 0;
let historyDraft = "";
// ChatGPT: Guestbook notes are database records, exposed as virtual text files.
let guestbookFiles = [];
let noteDraft = null;
// ChatGPT: END CG-JS-03.
let curDirectory = `/`;
let span = document.getElementById('mainspan');

input.addEventListener('keydown', (event) => {
// ChatGPT: BEGIN CG-JS-04 added code (after original line 24).
    if (startupRunning) {
        if (event.ctrlKey || event.metaKey || event.altKey || ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(event.key)) return;
        event.preventDefault();
        finishStartup();
        return;
    }
    if (input.readOnly) return;
    if (noteDraft) {
        if (event.key === 'Escape' || (event.ctrlKey && event.key.toLowerCase() === 'c')) {
            event.preventDefault();
            closeNoteDraft('Note cancelled.');
        }else if (event.key === 'Enter') {
            event.preventDefault();
            acceptNoteInput(input.value);
        }else if (event.key === 'Tab') event.preventDefault();
        return;
    }
    if (event.key !== 'Tab') resetCompletion();
// ChatGPT: END CG-JS-04.
    if (event.key === 'Enter') {
        event.preventDefault();
    
        let userInput = input.value.trim();
// ChatGPT: BEGIN CG-JS-05 added code (after original line 28).
        if (!userInput) return;
        commandHistory.push(userInput);
        historyIndex = commandHistory.length;
        historyDraft = "";
// ChatGPT: END CG-JS-05.
        let newLine = document.createElement('div');
// ChatGPT: BEGIN CG-JS-06 modified code (original lines 30-30).
        newLine.className = 'command-line';
        newLine.textContent = `$ ${curDirectory} ${userInput}`;
// ChatGPT: END CG-JS-06.
        output.appendChild(newLine);

        input.value = '';
// ChatGPT: BEGIN CG-JS-07 added code (after original line 33).
        // ChatGPT: Reading files requires cat; bare filenames and portfolio labels are not commands.
        const command = userInput.split(/\s+/)[0];
        const argument = userInput.slice(command.length).trim();
        // ChatGPT: The guide is separate from help, and writing a note is an interactive command.
        if (userInput === 'guestbook') {
            guestbookGuide();
        }else if (command === 'leave-note') {
            startNoteDraft(argument);
        }
// ChatGPT: END CG-JS-07.
        //clear function
// ChatGPT: BEGIN CG-JS-08 modified code (original lines 35-35).
        else if (userInput.trim() === 'clear') {
// ChatGPT: END CG-JS-08.
            output.innerHTML = '';
        }
        //ls function
// ChatGPT: BEGIN CG-JS-09 modified code (original lines 39-39).
        else if (command === 'ls'){
            if (resolvePath(argument || curDirectory) === '/guestbook') { listGuestbook(); return; }
// ChatGPT: END CG-JS-09.
            output.appendChild(document.createElement('br'));
            let lsLine = document.createElement('div');
            lsLine.textContent = ` `
            
// ChatGPT: BEGIN CG-JS-10 modified code (original lines 44-55).
            // ChatGPT: The same lists now support ls with an absolute or relative path.
            let files = directoryFiles(resolvePath(argument || curDirectory));
            if (!files) {
                errorOutput('Directory not found.');
                return;
            }
            for (let i = 0; i < files.length; i++){
                lsLine.textContent += `${files[i]} `;
// ChatGPT: END CG-JS-10.
            }
            output.appendChild(lsLine)
            output.appendChild(document.createElement('br'));
        }
        //cd function
// ChatGPT: BEGIN CG-JS-11 modified code (original lines 61-74).
        else if (command === 'cd') {
            // ChatGPT: Resolve paths before updating your existing directory and prompt variables.
            let dirName = resolvePath(argument || '/');
            if (directoryFiles(dirName)) {
                curDirectory = dirName === '/' ? '/' : `${dirName}/`;
                let changeDirOutput = document.createElement('div');
                changeDirOutput.textContent = `Changed directory to ${curDirectory}`;
                itemWithBr(changeDirOutput);
                span.textContent = `$ ${curDirectory}`;
                if (dirName === '/guestbook') listGuestbook();
            }else{
                errorOutput("Directory not found. Type 'ls' for directories.");
// ChatGPT: END CG-JS-11.
            }
// ChatGPT: BEGIN CG-JS-12 modified code (original lines 76-92).
        }
        else if (userInput === 'pwd') {
            let pathOutput = document.createElement('div');
            pathOutput.textContent = curDirectory;
            itemWithBr(pathOutput);
        }
        // ChatGPT: A site profile inspired by neofetch, without claiming to read the visitor's system.
        else if (userInput === 'neofetch') {
            neofetch();
// ChatGPT: END CG-JS-12.
        }
        //help function
        else if (userInput === "help") {
            let helpOutput = document.createElement('div');
            helpOutput.textContent = `Available commands:`;
            output.appendChild(document.createElement('br'));
            output.appendChild(helpOutput);
            
            const commands = [
// ChatGPT: BEGIN CG-JS-13 modified code (original lines 102-103).
                "- ls [path]: List directories and files",
                "- cd [directory]: Change directory; supports /, ~, . and ..",
                "- pwd: Show the current directory",
                "- guestbook: Show how to leave and read notes",
                "- leave-note [filename]: Write a named guestbook note",
                "- neofetch: Show ASCII artwork and the site profile",
                "- open /professional/resume.pdf: View my resume",
                "- cd /src: Browse this website source",
// ChatGPT: END CG-JS-13.
                "- clear: Clear the terminal screen",
                "- open [file]: open this file in a new tab",
                "- help: Show this help message",
// ChatGPT: BEGIN CG-JS-14 modified code (original lines 107-107).
                "- cat [file]: Open the file in terminal"
// ChatGPT: END CG-JS-14.
            ];
            
            commands.forEach(command => {
                let commandLine = document.createElement('div');
                commandLine.textContent = command;
                output.appendChild(commandLine);
            });
            
            output.appendChild(document.createElement('br'));
        }
        //open function
// ChatGPT: BEGIN CG-JS-15 modified code (original lines 119-125).
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
// ChatGPT: END CG-JS-15.
                    output.appendChild(document.createElement('br'));
                }
                else if (fileName === "aboutme.txt"){
// ChatGPT: BEGIN CG-JS-16 modified code (original lines 129-129).
                    window.open('aboutme.txt', '_blank', 'noopener');
// ChatGPT: END CG-JS-16.
                    output.appendChild(document.createElement('br'));
                }
                else if (fileName === "projects.md"){
// ChatGPT: BEGIN CG-JS-17 modified code (original lines 133-135).
                    openMarkdownFile('./projects.md');
// ChatGPT: END CG-JS-17.
                    output.appendChild(document.createElement('br'));
                }
                else{
                    errorOutput();
                }
            }
// ChatGPT: BEGIN CG-JS-18 modified code (original lines 142-142).
            else if (fileDirectory == `/hobbies/`){
// ChatGPT: END CG-JS-18.
                if (fileName === "workouts.md"){
// ChatGPT: BEGIN CG-JS-19 modified code (original lines 144-146).
                    openMarkdownFile('./workouts.md');
// ChatGPT: END CG-JS-19.
                    output.appendChild(document.createElement('br'));
                }
                else{
                    errorOutput();
                }
            }
// ChatGPT: BEGIN CG-JS-20 added code (after original line 152).
            else if (fileDirectory === '/src/' && sourceFiles.includes(fileName)) {
                if (fileName === 'resume.pdf') window.open('resume.pdf', '_blank', 'noopener');
                else openSourceFile(fileName);
            }
// ChatGPT: END CG-JS-20.
            else{
                errorOutput();
            }
        }
        //cat function
// ChatGPT: BEGIN CG-JS-21 modified code (original lines 158-160).
        else if (command === 'cat'){
            // ChatGPT: Split a resolved path so your existing per-directory handlers still work.
            let filePath = resolvePath(argument);
            let fileName = filePath.slice(filePath.lastIndexOf('/') + 1);
            let fileDirectory = filePath.slice(0, filePath.lastIndexOf('/') + 1);
            if (!argument) { errorOutput('Usage: cat <file>'); return; }
            if (fileDirectory === '/guestbook/') { readGuestbookNote(fileName); return; }
            if (fileDirectory == `/professional/`){
// ChatGPT: END CG-JS-21.
                if (fileName === "aboutme.txt"){
// ChatGPT: BEGIN CG-JS-22 modified code (original lines 162-163).
                    readLocalFile('./aboutme.txt')
// ChatGPT: END CG-JS-22.
                    //response.text() gets passed as out short for output - same for all cat calls
                    //response.text() has the text of the file
                    .then(out => {catFunc(out, fileName);
// ChatGPT: BEGIN CG-JS-23 modified code (original lines 167-167).
                    }).catch(error => errorOutput(error.message));
// ChatGPT: END CG-JS-23.
                }
// ChatGPT: BEGIN CG-JS-24 modified code (original lines 169-173).
                else if (fileName === "resume.pdf"){
                    errorOutput('Try open resume.pdf instead.');
// ChatGPT: END CG-JS-24.
                }
                else if (fileName === "projects.md"){
// ChatGPT: BEGIN CG-JS-25 modified code (original lines 176-177).
                    readLocalFile('./projects.md')
// ChatGPT: END CG-JS-25.
                    .then(out => {catFunc(out, fileName);
// ChatGPT: BEGIN CG-JS-26 modified code (original lines 179-179).
                    }).catch(error => errorOutput(error.message));
// ChatGPT: END CG-JS-26.
                }
                else{
                    errorOutput();
                }
// ChatGPT: BEGIN CG-JS-27 modified code (original lines 184-184).
            }else if (fileDirectory == `/hobbies/`){
// ChatGPT: END CG-JS-27.
                if (fileName === "workouts.md"){
// ChatGPT: BEGIN CG-JS-28 modified code (original lines 186-187).
                    readLocalFile('./workouts.md')
// ChatGPT: END CG-JS-28.
                    .then(out => {catFunc(out, fileName);
// ChatGPT: BEGIN CG-JS-29 modified code (original lines 189-189).
                    }).catch(error => errorOutput(error.message));
// ChatGPT: END CG-JS-29.
                }
                else{
                    errorOutput();
                }
// ChatGPT: BEGIN CG-JS-30 added code (after original line 193).
            }else if (fileDirectory === '/src/' && sourceFiles.includes(fileName)) {
                if (fileName === 'resume.pdf') errorOutput('Try open resume.pdf instead.');
                else readLocalFile(fileName).then(out => catFunc(out, fileName)).catch(error => errorOutput(error.message));
// ChatGPT: END CG-JS-30.
            }else{
                errorOutput();
            }
        }
        else {
            let unknownCommand = document.createElement('div');
// ChatGPT: BEGIN CG-JS-31 modified code (original lines 200-200).
            unknownCommand.className = 'terminal-error';
            unknownCommand.textContent = `${userInput}: command not found. Use cat <file> to read a file, or help for commands.`;
// ChatGPT: END CG-JS-31.
            itemWithBr(unknownCommand);
        }    
// ChatGPT: BEGIN CG-JS-32 added code (after original line 202).
    }else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        // ChatGPT: Save the unfinished input so Down can restore it after browsing history.
        event.preventDefault();
        if (historyIndex === commandHistory.length) historyDraft = input.value;
        historyIndex += event.key === 'ArrowUp' ? -1 : 1;
        historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex));
        input.value = historyIndex === commandHistory.length ? historyDraft : commandHistory[historyIndex];
        input.setSelectionRange(input.value.length, input.value.length);
// ChatGPT: END CG-JS-32.
    }else if (event.key == "Tab"){
// ChatGPT: BEGIN CG-JS-33 modified code (original lines 204-210).
        event.preventDefault();
        // ChatGPT: Empty input stays empty; only complete a typed prefix at the end of the input.
        if (!input.value.trim()) { resetCompletion(); return; }
        if (input.selectionStart !== input.value.length || input.selectionEnd !== input.value.length) return;
        if (maxKeys.length === 0) {
            original_input = input.value;
            let listOfCommands = ["ls", "cd", "cat", "help", "open", "clear", "pwd", "neofetch", "guestbook", "leave-note"];
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
// ChatGPT: END CG-JS-33.
        if (maxKeys.length > 0){
            input.value = maxKeys[autoCompleteIndex];
// ChatGPT: BEGIN CG-JS-34 added code (after original line 212).
            input.setSelectionRange(input.value.length, input.value.length);
// ChatGPT: END CG-JS-34.
            //mod sends it back to 0
            autoCompleteIndex = (autoCompleteIndex + 1) % maxKeys.length;
// ChatGPT: CG-JS-35 removed original lines 215-244; see CHATGPT-CHANGES.md.
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

// ChatGPT: BEGIN CG-JS-36 modified code (original lines 262-262).
function openMarkdownInNewTab(markdownText, newTab) {
    // ChatGPT: Fall back to plain text if the external Markdown library is unavailable.
    if (typeof marked === 'undefined') {
        let pre = newTab.document.createElement('pre');
        pre.textContent = markdownText;
        newTab.document.body.replaceChildren(pre);
        return;
    }
// ChatGPT: END CG-JS-36.
    let text = marked.parse(markdownText);
// ChatGPT: CG-JS-37 removed original lines 264-264; see CHATGPT-CHANGES.md.
    
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

// ChatGPT: BEGIN CG-JS-38 modified code (original lines 298-298).
function errorOutput(message){
// ChatGPT: END CG-JS-38.
    let errorText = document.createElement('div');
// ChatGPT: BEGIN CG-JS-39 modified code (original lines 300-300).
    errorText.className = 'terminal-error';
    errorText.textContent = message || `File not found. Type 'help' for a list of commands and 'ls' for files and directories`;
// ChatGPT: END CG-JS-39.
    output.appendChild(document.createElement('br'));
    output.appendChild(errorText);
    output.appendChild(document.createElement('br'));
// ChatGPT: BEGIN CG-JS-40 modified code (original lines 304-304).
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
    if (path === '/guestbook') return guestbookFiles;
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
    // ChatGPT: Preserve the user-provided Unicode dragon and its Braille spacing.
    art.textContent = [
        "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣤⣤⣤⡼⠀⢀⡀⣀⢱⡄⡀⠀⠀⠀⢲⣤⣤⣤⣤⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
        "⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣾⣿⣿⣿⣿⣿⡿⠛⠋⠁⣤⣿⣿⣿⣧⣷⠀⠀⠘⠉⠛⢻⣷⣿⣽⣿⣿⣷⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀",
        "⠀⠀⠀⠀⠀⠀⢀⣴⣞⣽⣿⣿⣿⣿⣿⣿⣿⠁⠀⠀⠠⣿⣿⡟⢻⣿⣿⣇⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣟⢦⡀⠀⠀⠀⠀⠀⠀",
        "⠀⠀⠀⠀⠀⣠⣿⡾⣿⣿⣿⣿⣿⠿⣻⣿⣿⡀⠀⠀⠀⢻⣿⣷⡀⠻⣧⣿⠆⠀⠀⠀⠀⣿⣿⣿⡻⣿⣿⣿⣿⣿⠿⣽⣦⡀⠀⠀⠀⠀",
        "⠀⠀⠀⠀⣼⠟⣩⣾⣿⣿⣿⢟⣵⣾⣿⣿⣿⣧⠀⠀⠀⠈⠿⣿⣿⣷⣈⠁⠀⠀⠀⠀⣰⣿⣿⣿⣿⣮⣟⢯⣿⣿⣷⣬⡻⣷⡄⠀⠀⠀",
        "⠀⠀⢀⡜⣡⣾⣿⢿⣿⣿⣿⣿⣿⢟⣵⣿⣿⣿⣷⣄⠀⣰⣿⣿⣿⣿⣿⣷⣄⠀⢀⣼⣿⣿⣿⣷⡹⣿⣿⣿⣿⣿⣿⢿⣿⣮⡳⡄⠀⠀",
        "⠀⢠⢟⣿⡿⠋⣠⣾⢿⣿⣿⠟⢃⣾⢟⣿⢿⣿⣿⣿⣾⡿⠟⠻⣿⣻⣿⣏⠻⣿⣾⣿⣿⣿⣿⡛⣿⡌⠻⣿⣿⡿⣿⣦⡙⢿⣿⡝⣆⠀",
        "⠀⢯⣿⠏⣠⠞⠋⠀⣠⡿⠋⢀⣿⠁⢸⡏⣿⠿⣿⣿⠃⢠⣴⣾⣿⣿⣿⡟⠀⠘⢹⣿⠟⣿⣾⣷⠈⣿⡄⠘⢿⣦⠀⠈⠻⣆⠙⣿⣜⠆",
        "⢀⣿⠃⡴⠃⢀⡠⠞⠋⠀⠀⠼⠋⠀⠸⡇⠻⠀⠈⠃⠀⣧⢋⣼⣿⣿⣿⣷⣆⠀⠈⠁⠀⠟⠁⡟⠀⠈⠻⠀⠀⠉⠳⢦⡀⠈⢣⠈⢿⡄",
        "⣸⠇⢠⣷⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⠿⠿⠋⠀⢻⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢾⣆⠈⣷",
        "⡟⠀⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣶⣤⡀⢸⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡄⢹",
        "⡇⠀⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠈⣿⣼⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠃⢸",
        "⢡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⠶⣶⡟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼",
        "⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡾⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁",
        "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡁⢠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
        "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣼⣀⣠⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀"
    ].join('\n');
    let info = document.createElement('div');
    info.className = 'neofetch-info';
    let title = document.createElement('strong');
    title.textContent = 'thomas@vercel';
    info.appendChild(title);
    const details = [
        ['Site', 'thomas.savasten.com'],
        ['Major', 'Computer Science + Mathematics'],
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


// ChatGPT: Explain the guestbook at startup while keeping help available as a command.
function guestbookGuide() {
    let guide = document.createElement('div');
    guide.className = 'guestbook-guide';
    guide.textContent = `Leave something behind.

  leave-note hello-thomas.txt

Choose a filename, add your name (or stay anonymous), and write a message.
You can also type leave-note to be guided through every step.
Review your note, then type y to submit it for Thomas to approve.
Approved notes are public. Escape or Ctrl+C cancels a draft.

Read the guestbook:  ls /guestbook
Read one note:      cat /guestbook/hello-thomas.txt
Explore the site:   help`;
    itemWithBr(guide);
}

function noteMessage(text) {
    let line = document.createElement('div');
    line.className = 'guestbook-message';
    line.textContent = text;
    itemWithBr(line);
}

function noteFilename(value) {
    let name = value.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name.endsWith('.txt')) name += '.txt';
    return /^[a-z0-9][a-z0-9_-]{0,47}\.txt$/.test(name) ? name : null;
}

function setNoteStep(step, label) {
    noteDraft.step = step;
    input.value = '';
    span.textContent = label;
    input.setAttribute('aria-label', label);
    resetCompletion();
}

function startNoteDraft(filename) {
    let name = filename ? noteFilename(filename) : '';
    if (filename && !name) {
        errorOutput('Use a filename with 1–48 letters, numbers, hyphens, or underscores, plus .txt.');
        return;
    }
    noteDraft = { filename: name, author: '', message: '', step: 'filename', requestId: crypto.randomUUID() };
    noteMessage('Write a guestbook note. Approved notes will be public. Escape or Ctrl+C cancels.');
    if (name) {
        noteMessage('Filename: ' + name);
        setNoteStep('author', 'Your name (optional):');
    }else{
        setNoteStep('filename', 'Note filename:');
    }
}

function closeNoteDraft(message) {
    noteDraft = null;
    input.value = '';
    span.textContent = `$ ${curDirectory}`;
    input.setAttribute('aria-label', 'Terminal command');
    resetCompletion();
    if (message) noteMessage(message);
}

function reviewNoteDraft() {
    noteMessage(`${noteDraft.filename}\nBy ${noteDraft.author}\n\n${noteDraft.message}\n\nThis note will be public after approval.`);
    setNoteStep('confirm', 'Submit? [y/n]:');
}

function acceptNoteInput(value) {
    const text = value.trim();
    if (noteDraft.step === 'filename') {
        const name = noteFilename(text);
        if (!name) { errorOutput('Use 1–48 letters, numbers, hyphens, or underscores for the filename.'); return; }
        noteDraft.filename = name;
        noteMessage('Filename: ' + name);
        if (noteDraft.message) reviewNoteDraft();
        else setNoteStep('author', 'Your name (optional):');
    }else if (noteDraft.step === 'author') {
        if (text.length > 60) { errorOutput('Keep your name under 61 characters.'); return; }
        noteDraft.author = text || 'Anonymous';
        setNoteStep('message', 'Message:');
        noteMessage('Write up to 1,000 characters, then press Enter to review.');
    }else if (noteDraft.step === 'message') {
        if (!text || text.length > 1000) { errorOutput('Write a message between 1 and 1,000 characters.'); return; }
        noteDraft.message = text;
        reviewNoteDraft();
    }else if (noteDraft.step === 'confirm') {
        if (text.toLowerCase() === 'n') { closeNoteDraft('Note cancelled.'); return; }
        if (text.toLowerCase() !== 'y') { errorOutput('Type y to submit or n to cancel.'); return; }
        submitNoteDraft();
    }
}

async function guestbookRequest(path, options = {}) {
    const response = await fetch('/api/notes' + path, { ...options, signal: AbortSignal.timeout(15000) });
    let data;
    try { data = await response.json(); }
    catch { throw new Error('The guestbook is not connected yet. Your note has not been saved.'); }
    if (!response.ok) {
        const error = new Error(data.error || 'The guestbook is unavailable. Please try again later.');
        error.status = response.status;
        throw error;
    }
    return data;
}

async function submitNoteDraft() {
    input.readOnly = true;
    try {
        await guestbookRequest('', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: noteDraft.filename, author: noteDraft.author, message: noteDraft.message, requestId: noteDraft.requestId })
        });
        closeNoteDraft('Note submitted for review. It will appear in /guestbook after approval.');
    }catch (error) {
        errorOutput(error.message);
        if (error.status === 409) {
            noteMessage('Choose another filename. Your message is still here.');
            setNoteStep('filename', 'Note filename:');
        }else{
            noteMessage('Your draft is still here. Type y to retry, or n to cancel.');
            setNoteStep('confirm', 'Retry? [y/n]:');
        }
    }finally{
        input.readOnly = false;
    }
}

async function listGuestbook() {
    input.readOnly = true;
    try {
        const data = await guestbookRequest('');
        guestbookFiles = data.notes.map(note => note.filename);
        noteMessage(guestbookFiles.length ? guestbookFiles.join('  ') : 'No approved notes yet. Be the first: leave-note');
    }catch (error) { errorOutput(error.message); }
    finally { input.readOnly = false; }
}

async function readGuestbookNote(filename) {
    input.readOnly = true;
    try {
        const data = await guestbookRequest('?filename=' + encodeURIComponent(filename));
        catFunc(`${data.note.author} · ${new Date(data.note.createdAt).toLocaleDateString()}\n\n${data.note.message}`, data.note.filename);
    }catch (error) { errorOutput(error.message); }
    finally { input.readOnly = false; }
}

// ChatGPT: Run both intro commands through your existing Enter handler in order.
function runStartupCommand() {
    startupRunning = false;
    input.readOnly = false;
    input.value = startupCommands[startupIndex++];
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    startupRunning = startupIndex < startupCommands.length;
    input.readOnly = startupRunning;
    if (!startupRunning) input.setAttribute('aria-label', 'Terminal command');
}

function startStartup() {
    startupRunning = true;
    startupIndex = 0;
    input.readOnly = true;
    input.setAttribute('aria-label', 'Starting terminal. Press a key to skip the intro.');
    function typeCommand() {
        const command = startupCommands[startupIndex];
        let index = 0;
        function typeNextLetter() {
            input.value = command.slice(0, ++index);
            input.setSelectionRange(input.value.length, input.value.length);
            startupTimer = setTimeout(index < command.length ? typeNextLetter : () => {
                runStartupCommand();
                startupTimer = startupRunning ? setTimeout(typeCommand, 450) : null;
            }, index < command.length ? 95 : 250);
        }
        typeNextLetter();
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finishStartup();
    }else{
        startupTimer = setTimeout(typeCommand, 350);
    }
}

function finishStartup() {
    if (!startupRunning) return;
    clearTimeout(startupTimer);
    startupTimer = null;
    while (startupIndex < startupCommands.length) runStartupCommand();
}

// ChatGPT: Follow new output unless the visitor scrolls up to read earlier lines.
let followPrompt = true;
let lastScrollY = window.scrollY;
let scrollFrame = null;
function keepPromptVisible() {
    if (!followPrompt || scrollFrame !== null) return;
    scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        if (!followPrompt) return;
        const promptBounds = document.getElementById('input-line').getBoundingClientRect();
        if (promptBounds.bottom > window.innerHeight - 24) {
            window.scrollBy({ top: promptBounds.bottom - window.innerHeight + 24, behavior: 'instant' });
        }
        lastScrollY = window.scrollY;
    });
}
window.addEventListener('wheel', event => {
    if (event.deltaY < 0) followPrompt = false;
}, { passive: true });
window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY < lastScrollY) followPrompt = false;
    else if (currentScrollY > lastScrollY) {
        const bounds = document.getElementById('input-line').getBoundingClientRect();
        if (bounds.bottom <= window.innerHeight && bounds.top >= 0) followPrompt = true;
    }
    lastScrollY = currentScrollY;
}, { passive: true });
window.addEventListener('resize', keepPromptVisible);
new MutationObserver(keepPromptVisible).observe(output, { childList: true, subtree: true, characterData: true });
new ResizeObserver(keepPromptVisible).observe(terminal);

startStartup();
// ChatGPT: END CG-JS-40.
