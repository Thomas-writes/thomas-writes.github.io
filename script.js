//global variables
// ChatGPT: BEGIN CG-JS-01 modified code (original lines 2-2).
const shell = document.getElementById('shell');
// ChatGPT: END CG-JS-01.
const input = document.getElementById('input');
const output = document.getElementById('output');
//used for tab-complete
let maxKeys = []
let autoCompleteIndex = 0
let original_input = ""
// ChatGPT: BEGIN CG-JS-02 added code (after original line 8).
// ChatGPT: Startup owns the prompt only until the intro finishes or a key skips it.
let startupRunning = false;
let startupTimer = null;
const startupCommands = ['neofetch', 'help'];
let startupIndex = 0;
// ChatGPT: END CG-JS-02.

// ChatGPT: BEGIN CG-JS-03 modified code (original lines 10-10).
shell.addEventListener('click', () => {
// ChatGPT: END CG-JS-03.
    input.focus();
});

input.addEventListener('focus', () => {
    input.select();
});

// ChatGPT: BEGIN CG-JS-04 modified code (original lines 18-19).
// ChatGPT: Keep your directory lists and expose contact links as virtual files.
let mainDirectories = ["professional", "hobbies", "contacts", "guestbook"]
let professionalFiles = ["resume.pdf", "projects.md", "aboutme.txt"];
// ChatGPT: END CG-JS-04.
let hobbiesFiles = ["workouts.md"]
// ChatGPT: BEGIN CG-JS-05 added code (after original line 20).
// ChatGPT: Reuse the existing header links so contact values have one source of truth.
const contactFiles = {
    linkedin: { label: 'LinkedIn', selector: '.contact-links a[href^="https://www.linkedin.com/"]' },
    phone: { label: 'Phone', selector: '.contact-links a[href^="tel:"]' },
    email: { label: 'Email', selector: '.contact-links a[href^="mailto:"]' }
};
let commandHistory = [];
let historyIndex = 0;
let historyDraft = "";
// ChatGPT: Guestbook notes are database records, exposed as virtual text files.
let guestbookFiles = [];
let noteDraft = null;
// ChatGPT: END CG-JS-05.
let curDirectory = `/`;
let span = document.getElementById('mainspan');

// ChatGPT: BEGIN CG-JS-06 added code (after original line 23).
// ChatGPT: Render prompt parts as text spans so history and the active prompt share Mocha colors.
function renderPrompt(element) {
    const path = curDirectory === '/' ? '~' : '~' + curDirectory.replace(/\/$/, '');
    element.replaceChildren();
    for (const [text, className] of [
        ['visitor@thomas', 'prompt-user'], [':', 'prompt-separator'],
        [path, 'prompt-path'], ['$', 'prompt-symbol']
    ]) {
        const part = document.createElement('span');
        part.className = className;
        part.textContent = text;
        element.appendChild(part);
    }
}
renderPrompt(span);

// ChatGPT: Highlight help syntax without interpreting angle brackets as HTML.
function renderHelpCommand(element, command) {
    // ChatGPT: Keep punctuation glyphs separate across colored placeholder boundaries.
    element.classList.add('help-command');
    const parts = command.split(/(<file>|\[directory\])/);
    for (const text of parts) {
        if (text === '<file>' || text === '[directory]') {
            const argument = document.createElement('span');
            argument.className = text === '<file>' ? 'help-file' : 'help-directory';
            argument.textContent = text;
            element.appendChild(argument);
        }else {
            element.appendChild(document.createTextNode(text));
        }
    }
}

// ChatGPT: END CG-JS-06.
input.addEventListener('keydown', (event) => {
// ChatGPT: BEGIN CG-JS-07 added code (after original line 24).
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
// ChatGPT: END CG-JS-07.
    if (event.key === 'Enter') {
        event.preventDefault();
    
        let userInput = input.value.trim();
// ChatGPT: BEGIN CG-JS-08 added code (after original line 28).
        if (!userInput) return;
        commandHistory.push(userInput);
        historyIndex = commandHistory.length;
        historyDraft = "";
// ChatGPT: END CG-JS-08.
        let newLine = document.createElement('div');
// ChatGPT: BEGIN CG-JS-09 modified code (original lines 30-30).
        newLine.className = 'command-line';
        renderPrompt(newLine);
        newLine.appendChild(document.createTextNode(' ' + userInput));
// ChatGPT: END CG-JS-09.
        output.appendChild(newLine);

        input.value = '';
// ChatGPT: BEGIN CG-JS-10 added code (after original line 33).
        // ChatGPT: Reading files requires cat; bare filenames and portfolio labels are not commands.
        const command = userInput.split(/\s+/)[0];
        const argument = userInput.slice(command.length).trim();
        // ChatGPT: Guestbook writes use a file command and resolve paths like cat and ls.
        if (command === 'touch') {
            if (!argument) { errorOutput('Usage: touch /guestbook/leave-note.txt'); return; }
            const path = resolvePath(argument);
            const slash = path.lastIndexOf('/');
            if (path.slice(0, slash) !== '/guestbook' || argument.endsWith('/')) {
                errorOutput('Only /guestbook is writable. Try touch /guestbook/leave-note.txt');
                return;
            }
            startNoteDraft(path.slice(slash + 1));
        }
// ChatGPT: END CG-JS-10.
        //clear function
// ChatGPT: BEGIN CG-JS-11 modified code (original lines 35-35).
        else if (userInput.trim() === 'clear') {
// ChatGPT: END CG-JS-11.
            output.innerHTML = '';
        }
        //ls function
// ChatGPT: BEGIN CG-JS-12 modified code (original lines 39-40).
        else if (command === 'ls'){
            if (resolvePath(argument || curDirectory) === '/guestbook') { listGuestbook(); return; }
// ChatGPT: END CG-JS-12.
            let lsLine = document.createElement('div');
// ChatGPT: BEGIN CG-JS-13 modified code (original lines 42-42).
            lsLine.className = 'shell-list';
            lsLine.textContent = '';
// ChatGPT: END CG-JS-13.
            
// ChatGPT: BEGIN CG-JS-14 modified code (original lines 44-55).
            // ChatGPT: The same lists now support ls with an absolute or relative path.
            let files = directoryFiles(resolvePath(argument || curDirectory));
            if (!files) {
                errorOutput('Directory not found.');
                return;
            }
            for (let i = 0; i < files.length; i++){
                appendListingEntry(lsLine, files[i]);
// ChatGPT: END CG-JS-14.
            }
            output.appendChild(lsLine)
// ChatGPT: CG-JS-15 removed original lines 58-58; see CHATGPT-CHANGES.md.
        }
        //cd function
// ChatGPT: BEGIN CG-JS-16 modified code (original lines 61-74).
        else if (command === 'cd') {
            // ChatGPT: Resolve paths before updating your existing directory and prompt variables.
            let dirName = resolvePath(argument || '/');
            if (directoryFiles(dirName)) {
                curDirectory = dirName === '/' ? '/' : `${dirName}/`;
                let changeDirOutput = document.createElement('div');
                changeDirOutput.textContent = `Changed directory to ${curDirectory}`;
                itemWithBr(changeDirOutput);
                renderPrompt(span);
            }else{
                errorOutput("Directory not found. Type 'ls' for directories.");
// ChatGPT: END CG-JS-16.
            }
// ChatGPT: BEGIN CG-JS-17 modified code (original lines 76-92).
        }
        else if (userInput === 'pwd') {
            let pathOutput = document.createElement('div');
            pathOutput.textContent = curDirectory;
            itemWithBr(pathOutput);
        }
        // ChatGPT: A site profile inspired by neofetch, without claiming to read the visitor's system.
        else if (userInput === 'neofetch') {
            neofetch();
// ChatGPT: END CG-JS-17.
        }
        //help function
        else if (userInput === "help") {
            let helpOutput = document.createElement('div');
            helpOutput.textContent = `Available commands:`;
// ChatGPT: CG-JS-18 removed original lines 98-98; see CHATGPT-CHANGES.md.
            output.appendChild(helpOutput);
            
// ChatGPT: BEGIN CG-JS-19 added code (after original line 100).
            // ChatGPT: Keep help alphabetical, with one general description per command.
// ChatGPT: END CG-JS-19.
            const commands = [
// ChatGPT: BEGIN CG-JS-20 modified code (original lines 102-107).
                "- cat <file>: Display a file in the shell",
                "- cd [directory]: Change the current directory",
                "- clear: Clear the shell screen",
                "- help: List available commands",
                "- ls [directory]: List files and directories",
                "- neofetch: Display artwork and site information",
                "- open <file>: Open a file in a new tab",
                "- pwd: Show the current directory path",
                "- touch <file>: Create a note in the guestbook directory"
// ChatGPT: END CG-JS-20.
            ];
            
            commands.forEach(command => {
                let commandLine = document.createElement('div');
// ChatGPT: BEGIN CG-JS-21 modified code (original lines 112-112).
                renderHelpCommand(commandLine, command);
// ChatGPT: END CG-JS-21.
                output.appendChild(commandLine);
            });
            
// ChatGPT: CG-JS-22 removed original lines 116-116; see CHATGPT-CHANGES.md.
        }
        //open function
// ChatGPT: BEGIN CG-JS-23 modified code (original lines 119-126).
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
// ChatGPT: END CG-JS-23.
                }
                else if (fileName === "aboutme.txt"){
// ChatGPT: BEGIN CG-JS-24 modified code (original lines 129-130).
                    openSourceFile('aboutme.txt');
// ChatGPT: END CG-JS-24.
                }
                else if (fileName === "projects.md"){
// ChatGPT: BEGIN CG-JS-25 modified code (original lines 133-136).
                    openMarkdownFile('./projects.md');
// ChatGPT: END CG-JS-25.
                }
                else{
                    errorOutput();
                }
            }
// ChatGPT: BEGIN CG-JS-26 modified code (original lines 142-142).
            else if (fileDirectory == `/hobbies/`){
// ChatGPT: END CG-JS-26.
                if (fileName === "workouts.md"){
// ChatGPT: BEGIN CG-JS-27 modified code (original lines 144-147).
                    openMarkdownFile('./workouts.md');
// ChatGPT: END CG-JS-27.
                }
                else{
                    errorOutput();
                }
// ChatGPT: BEGIN CG-JS-28 added code (after original line 151).
            }
            else if (fileDirectory === '/contacts/' && Object.hasOwn(contactFiles, fileName)) {
                const link = document.querySelector(contactFiles[fileName].selector);
                // ChatGPT: Use the same link behavior as the header, including mail and phone handlers.
                link.click();
// ChatGPT: END CG-JS-28.
            }
            else{
                errorOutput();
            }
        }
        //cat function
// ChatGPT: BEGIN CG-JS-29 modified code (original lines 158-160).
        else if (command === 'cat'){
            // ChatGPT: Split a resolved path so your existing per-directory handlers still work.
            let filePath = resolvePath(argument);
            let fileName = filePath.slice(filePath.lastIndexOf('/') + 1);
            let fileDirectory = filePath.slice(0, filePath.lastIndexOf('/') + 1);
            if (!argument) { errorOutput('Usage: cat <file>'); return; }
            if (fileDirectory === '/guestbook/') { readGuestbookNote(fileName); return; }
            if (fileDirectory == `/professional/`){
// ChatGPT: END CG-JS-29.
                if (fileName === "aboutme.txt"){
// ChatGPT: BEGIN CG-JS-30 modified code (original lines 162-163).
                    readLocalFile('./aboutme.txt')
// ChatGPT: END CG-JS-30.
                    //response.text() gets passed as out short for output - same for all cat calls
                    //response.text() has the text of the file
                    .then(out => {catFunc(out, fileName);
// ChatGPT: BEGIN CG-JS-31 modified code (original lines 167-167).
                    }).catch(error => errorOutput(error.message));
// ChatGPT: END CG-JS-31.
                }
// ChatGPT: BEGIN CG-JS-32 modified code (original lines 169-173).
                else if (fileName === "resume.pdf"){
                    errorOutput('Try open resume.pdf instead.');
// ChatGPT: END CG-JS-32.
                }
                else if (fileName === "projects.md"){
// ChatGPT: BEGIN CG-JS-33 modified code (original lines 176-177).
                    readLocalFile('./projects.md')
// ChatGPT: END CG-JS-33.
                    .then(out => {catFunc(out, fileName);
// ChatGPT: BEGIN CG-JS-34 modified code (original lines 179-179).
                    }).catch(error => errorOutput(error.message));
// ChatGPT: END CG-JS-34.
                }
                else{
                    errorOutput();
                }
// ChatGPT: BEGIN CG-JS-35 modified code (original lines 184-184).
            }else if (fileDirectory == `/hobbies/`){
// ChatGPT: END CG-JS-35.
                if (fileName === "workouts.md"){
// ChatGPT: BEGIN CG-JS-36 modified code (original lines 186-187).
                    readLocalFile('./workouts.md')
// ChatGPT: END CG-JS-36.
                    .then(out => {catFunc(out, fileName);
// ChatGPT: BEGIN CG-JS-37 modified code (original lines 189-189).
                    }).catch(error => errorOutput(error.message));
// ChatGPT: END CG-JS-37.
                }
                else{
                    errorOutput();
                }
// ChatGPT: BEGIN CG-JS-38 added code (after original line 193).
            }else if (fileDirectory === '/contacts/' && Object.hasOwn(contactFiles, fileName)) {
                const contact = contactFiles[fileName];
                const link = document.querySelector(contact.selector);
                catFunc(contact.label + ': ' + (fileName === 'linkedin' ? link.href : link.title), fileName);
// ChatGPT: END CG-JS-38.
            }else{
                errorOutput();
            }
        }
        else {
            let unknownCommand = document.createElement('div');
// ChatGPT: BEGIN CG-JS-39 modified code (original lines 200-200).
            unknownCommand.className = 'shell-error';
            unknownCommand.textContent = `${userInput}: command not found. Use cat <file> to read a file, or help for commands.`;
// ChatGPT: END CG-JS-39.
            itemWithBr(unknownCommand);
        }    
// ChatGPT: BEGIN CG-JS-40 added code (after original line 202).
    }else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        // ChatGPT: Save the unfinished input so Down can restore it after browsing history.
        event.preventDefault();
        if (historyIndex === commandHistory.length) historyDraft = input.value;
        historyIndex += event.key === 'ArrowUp' ? -1 : 1;
        historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex));
        input.value = historyIndex === commandHistory.length ? historyDraft : commandHistory[historyIndex];
        input.setSelectionRange(input.value.length, input.value.length);
// ChatGPT: END CG-JS-40.
    }else if (event.key == "Tab"){
// ChatGPT: BEGIN CG-JS-41 modified code (original lines 204-210).
        event.preventDefault();
        // ChatGPT: Empty input stays empty; only complete a typed prefix at the end of the input.
        if (!input.value.trim()) { resetCompletion(); return; }
        if (input.selectionStart !== input.value.length || input.selectionEnd !== input.value.length) return;
        if (maxKeys.length === 0) {
            original_input = input.value;
            let listOfCommands = ["ls", "cd", "cat", "help", "open", "clear", "pwd", "neofetch", "touch"];
            let match = original_input.match(/^(.*\s)?([^\s]*)$/);
            let prefix = match[1] || '';
            let fragment = match[2];
            if (!fragment) return;
            if (!prefix) {
                maxKeys = listOfCommands.filter(command => command.startsWith(fragment));
            }else if (['ls', 'cd', 'cat', 'open', 'touch'].includes(prefix.trim())) {
                let slash = fragment.lastIndexOf('/');
                let parent = fragment.slice(0, slash + 1);
                let partial = fragment.slice(slash + 1);
                let files = directoryFiles(resolvePath(parent || '.')) || [];
                maxKeys = files.filter(name => name.startsWith(partial))
                    .filter(name => !['cd', 'touch'].includes(prefix.trim()) || name.endsWith('/'))
                    .map(name => prefix + parent + name);
            }
        }
// ChatGPT: END CG-JS-41.
        if (maxKeys.length > 0){
            input.value = maxKeys[autoCompleteIndex];
// ChatGPT: BEGIN CG-JS-42 added code (after original line 212).
            input.setSelectionRange(input.value.length, input.value.length);
// ChatGPT: END CG-JS-42.
            //mod sends it back to 0
            autoCompleteIndex = (autoCompleteIndex + 1) % maxKeys.length;
// ChatGPT: CG-JS-43 removed original lines 215-244; see CHATGPT-CHANGES.md.
        }
    }
});

function catFunc(out, fileName) {
// ChatGPT: BEGIN CG-JS-44 modified code (original lines 250-254).
    // ChatGPT: Like cat in a shell, print the file itself without a heading or left indentation.
// ChatGPT: END CG-JS-44.
    let outputtext = document.createElement('div');
// ChatGPT: BEGIN CG-JS-45 modified code (original lines 256-257).
    outputtext.className = 'file-output';
    highlightFile(outputtext, out, fileName);
// ChatGPT: END CG-JS-45.
    output.appendChild(outputtext);
// ChatGPT: CG-JS-46 removed original lines 259-259; see CHATGPT-CHANGES.md.
};

// ChatGPT: BEGIN CG-JS-47 modified code (original lines 262-287).
// ChatGPT: Add syntax colors using text nodes only: file contents never become executable HTML.
function appendFileToken(parent, text, kind) {
    if (!kind) { parent.appendChild(document.createTextNode(text)); return; }
    const token = document.createElement('span');
    token.className = 'syntax-' + kind;
    token.textContent = text;
    parent.appendChild(token);
}

// ChatGPT: Lightweight source highlighting preserves every character, including indentation.
function highlightSource(parent, text, extension) {
    const pattern = extension === 'html' || extension === 'svg'
        ? /(?<comment><!--[\s\S]*?-->)|(?<string>"[^"\n]*"|'[^'\n]*')|(?<keyword><\/?[\w:-]+|\/?>)|(?<number>\b\d+(?:\.\d+)?\b)/g
        : /(?<comment>\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(?<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(?<keyword>\b(?:async|await|const|let|var|function|return|if|else|for|while|new|throw|try|catch|finally|class|typeof|switch|case|break|import|export|from)\b)|(?<literal>\b(?:true|false|null|undefined)\b)|(?<number>#[\da-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|em|rem|vh|vw|%)?)|(?<property>[\w-]+(?=\s*:))|(?<function>[\w$]+(?=\s*\())/g;
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
        appendFileToken(parent, text.slice(cursor, match.index));
        appendFileToken(parent, match[0], Object.keys(match.groups).find(key => match.groups[key] !== undefined));
        cursor = match.index + match[0].length;
// ChatGPT: END CG-JS-47.
    }
// ChatGPT: BEGIN CG-JS-48 added code (after original line 288).
    appendFileToken(parent, text.slice(cursor));
}

// ChatGPT: Highlight Markdown in its original shell-readable form, including fenced code.
function highlightFile(parent, text, fileName = '') {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['js', 'css', 'html', 'svg', 'json'].includes(extension)) {
        parent.classList.add('source-output');
        highlightSource(parent, text, extension);
        return;
    }
    if (extension !== 'md') { parent.textContent = text; return; }
    parent.classList.add('markdown-output');
    let fence = null;
    for (const line of text.match(/[^\n]*\n|[^\n]+$/g) || []) {
        const delimiter = line.match(/^\s*(`{3,}|~{3,})(.*)/);
        if (delimiter && (!fence || delimiter[1][0] === fence[0])) {
            fence = fence ? null : delimiter[1];
            appendFileToken(parent, line, 'comment');
        }else if (fence) {
            highlightSource(parent, line, 'js');
        }else if (/^\s{0,3}#{1,6}(?:\s|$)/.test(line)) {
            appendFileToken(parent, line, 'heading');
        }else {
            const pattern = /(?<string>`[^`\n]+`)|(?<strong>\*\*[^*\n]+\*\*|__[^_\n]+__)|(?<link>\[[^\]\n]+\]\([^\)\n]+\))|(?<marker>^\s*(?:[-*+]|\d+\.)\s|^\s*>\s?)/g;
            let cursor = 0;
            for (const match of line.matchAll(pattern)) {
                appendFileToken(parent, line.slice(cursor, match.index));
                appendFileToken(parent, match[0], Object.keys(match.groups).find(key => match.groups[key] !== undefined));
                cursor = match.index + match[0].length;
            }
            appendFileToken(parent, line.slice(cursor));
        }
    }
}

// ChatGPT: Share the website theme with every text reader; build the frame using safe DOM nodes.
function createFileReader(newTab, fileName) {
    const doc = newTab.document;
    doc.documentElement.lang = 'en';
    doc.head.replaceChildren();
    doc.title = fileName;
    const charset = doc.createElement('meta');
    charset.setAttribute('charset', 'UTF-8');
    const stylesheet = doc.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('styles.css', window.location.href).href;
    const icon = doc.createElement('link');
    icon.rel = 'icon';
    icon.href = new URL('favicon.svg', window.location.href).href;
    doc.head.append(charset, stylesheet, icon);
    doc.body.className = 'file-reader';
    const main = doc.createElement('main');
    main.className = 'reader-page';
    const header = doc.createElement('header');
    header.className = 'reader-header';
    const label = doc.createElement('span');
    label.textContent = '>_ ' + fileName.replace(/^\.\//, '');
    const home = doc.createElement('a');
    home.href = new URL('/', window.location.href).href;
    home.textContent = 'Back to shell';
    header.append(label, home);
    const content = doc.createElement('article');
    content.className = 'reader-content';
    main.append(header, content);
    doc.body.replaceChildren(main);
    return content;
}

function openMarkdownInNewTab(markdownText, newTab, fileName = 'Markdown') {
    // ChatGPT: Render authored Markdown with Mocha typography; retain a readable fallback offline.
    const content = createFileReader(newTab, fileName);
    if (typeof marked === 'undefined') {
        content.classList.add('reader-text');
        highlightFile(content, markdownText, fileName);
        return;
    }
    content.innerHTML = marked.parse(markdownText);
    content.querySelectorAll('pre code').forEach(code => {
        const text = code.textContent;
        code.replaceChildren();
        highlightSource(code, text, 'js');
    });
// ChatGPT: END CG-JS-48.
}


function itemWithBr(element){
// ChatGPT: BEGIN CG-JS-49 modified code (original lines 293-293).
    // ChatGPT: Keep your helper name, but avoid blank spacer lines between shell commands.
// ChatGPT: END CG-JS-49.
    output.appendChild(element);
// ChatGPT: CG-JS-50 removed original lines 295-295; see CHATGPT-CHANGES.md.
};

// ChatGPT: BEGIN CG-JS-51 modified code (original lines 298-298).
function errorOutput(message){
// ChatGPT: END CG-JS-51.
    let errorText = document.createElement('div');
// ChatGPT: BEGIN CG-JS-52 modified code (original lines 300-301).
    errorText.className = 'shell-error';
    errorText.textContent = message || `File not found. Type 'help' for a list of commands and 'ls' for files and directories`;
// ChatGPT: END CG-JS-52.
    output.appendChild(errorText);
// ChatGPT: BEGIN CG-JS-53 modified code (original lines 303-304).
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
    if (path === '/contacts') return Object.keys(contactFiles);
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
        .then(markdownText => { if (!newTab.closed) openMarkdownInNewTab(markdownText, newTab, fileName); })
        .catch(error => {
            if (!newTab.closed) newTab.document.body.textContent = error.message;
            errorOutput(error.message);
        });
}

function openSourceFile(fileName) {
    // ChatGPT: Source files open as text, so viewing index.html does not launch another shell.
    let newTab = window.open();
    if (!newTab) { errorOutput('Popup blocked. Allow popups or use cat to read the file.'); return; }
    newTab.opener = null;
    newTab.document.body.textContent = 'Loading…';
    readLocalFile(fileName).then(text => {
        if (newTab.closed) return;
        // ChatGPT: Plain text wraps as prose; source retains indentation and syntax colors.
        const content = createFileReader(newTab, fileName);
        content.classList.add('reader-text');
        if (!fileName.endsWith('.txt')) content.classList.add('reader-source');
        highlightFile(content, text, fileName);
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
    renderPrompt(span);
    input.setAttribute('aria-label', 'Shell command');
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
    catch { throw new Error(`The guestbook could not be reached (HTTP ${response.status}). Please try again later.`); }
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

// ChatGPT: Keep each name as text while coloring directories and files separately.
function appendListingEntry(line, name) {
    const entry = document.createElement('span');
    entry.className = name.endsWith('/') ? 'directory-entry' : 'file-entry';
    entry.textContent = name;
    line.append(entry, document.createTextNode('  '));
}

async function listGuestbook() {
    input.readOnly = true;
    try {
        const data = await guestbookRequest('');
        guestbookFiles = data.notes.map(note => note.filename);
        if (guestbookFiles.length) {
            const line = document.createElement('div');
            line.className = 'shell-list';
            guestbookFiles.forEach(filename => appendListingEntry(line, filename));
            output.appendChild(line);
        }else{
            noteMessage('No approved notes yet. Write one: touch /guestbook/leave-note.txt');
        }
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
    if (!startupRunning) input.setAttribute('aria-label', 'Shell command');
}

function startStartup() {
    startupRunning = true;
    startupIndex = 0;
    input.readOnly = true;
    input.setAttribute('aria-label', 'Starting shell. Press a key to skip the intro.');
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
new ResizeObserver(keepPromptVisible).observe(shell);

startStartup();
// ChatGPT: END CG-JS-53.
