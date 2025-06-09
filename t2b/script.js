// Parsons problems data with distractors
// --- Parsons problems are now loaded from a JSON file specified in the URL ---
let problems = [];
let problemsLoaded = false;

let currentProblem = 0;
let availableBlocks = [];
let solutionBlocks = [];
let distractorsPool = [];
let userName = null;
let userState = [];

// Helper to get ?specification=... param
function getSpecUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('specification') || 'batch1.json'; // default batch
}

// Load problems from JSON file
async function loadProblems() {
    const specUrl = getSpecUrl();
    try {
        const resp = await fetch(specUrl);
        const data = await resp.json();
        problems = data.problems;
        problemsLoaded = true;
        // Initialize userState for the loaded problems
        userState = problems.map(() => ({
            availableBlocks: null,
            solutionBlocks: null,
            distractorsPool: null,
            solved: false
        }));
    } catch (e) {
        alert('Failed to load problems: ' + e);
        problems = [];
        problemsLoaded = false;
    }
}

// Shuffle helper
function shuffle(array) {
    return array.slice().sort(() => Math.random() - 0.5);
}

// --- Replace askUserName to use modal overlay ---
function askUserName() {
    userName = localStorage.getItem('parsonsUserName') || null;
    if (!userName) {
        // Show overlay
        const overlay = document.getElementById('name-overlay');
        overlay.style.display = 'flex';
        const input = document.getElementById('name-input');
        input.value = '';
        input.focus();
        function submitName() {
            let val = input.value.trim();
            if (!val) val = 'Student';
            userName = val;
            localStorage.setItem('parsonsUserName', userName);
            overlay.style.display = 'none';
            renderProblem();
        }
        document.getElementById('name-submit').onclick = submitName;
        input.onkeydown = function(e) {
            if (e.key === 'Enter') submitName();
        };
    } else {
        // If name exists, just continue
        renderProblem();
    }
}

function showCertificate() {
    const certDiv = document.getElementById('certificate');
    const today = new Date();
    const dateStr = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    certDiv.innerHTML = `
        <div class="cert-container">
            <div class="cert-icon">🏆</div>
            <div class="cert-title">Certificate of Completion</div>
            <div class="cert-body">
                <div class="cert-line">This certifies that</div>
                <div class="cert-name">${userName}</div>
                <div class="cert-line">has successfully completed all Parsons Problems!</div>
            </div>
            <div class="cert-footer">
                <div class="cert-date">Date: <span>${dateStr}</span></div>
                <div class="cert-signature">Signature: <span class="cert-sign">Instructor</span></div>
            </div>
            <button id="print-certificate">Print Certificate</button>
        </div>
    `;
    certDiv.style.display = 'block';
    document.getElementById('problem-container').style.display = 'none';
    document.getElementById('navigation').style.display = 'none';
    document.getElementById('print-certificate').onclick = function() {
        printCertificateOnly();
    };
}

function printCertificateOnly() {
    // Hide everything except the certificate
    const certDiv = document.getElementById('certificate');
    const problemContainer = document.getElementById('problem-container');
    const navigation = document.getElementById('navigation');
    const bodyChildren = Array.from(document.body.children);
    // Store original display values
    const originalDisplay = bodyChildren.map(el => el.style.display);
    // Hide print button before printing
    const printBtn = document.getElementById('print-certificate');
    if (printBtn) printBtn.style.display = 'none';
    bodyChildren.forEach(el => {
        if (el !== certDiv) el.style.display = 'none';
    });
    certDiv.style.display = 'block';

    // Print only the certificate
    window.print();

    // Restore print button after printing
    if (printBtn) printBtn.style.display = '';
    // Restore original display values
    bodyChildren.forEach((el, i) => {
        el.style.display = originalDisplay[i];
    });
}

// --- Render the current problem ---
function renderProblem() {
    if (!problemsLoaded || problems.length === 0) {
        document.getElementById('problem-prompt').textContent = "No problems loaded.";
        document.getElementById('available-blocks').innerHTML = '';
        document.getElementById('solution-blocks').innerHTML = '';
        document.getElementById('feedback').textContent = '';
        document.getElementById('problem-number').textContent = '';
        document.getElementById('next-problem').style.visibility = 'hidden';
        return;
    }
    const problem = problems[currentProblem];
    document.getElementById('problem-prompt').textContent = problem.prompt;
    document.getElementById('problem-number').textContent = `Problem ${currentProblem + 1} of ${problems.length}`;

    // --- Restore or initialize state for this problem ---
    if (
        userState[currentProblem].availableBlocks &&
        userState[currentProblem].solutionBlocks &&
        userState[currentProblem].distractorsPool
    ) {
        availableBlocks = userState[currentProblem].availableBlocks.map(b => ({ ...b }));
        solutionBlocks = userState[currentProblem].solutionBlocks.map(b => ({ ...b }));
        distractorsPool = userState[currentProblem].distractorsPool.map(b => ({ ...b }));
    } else {
        distractorsPool = [...problem.distractors]; // Reset distractors pool
        availableBlocks = shuffle([...problem.blocks, ...distractorsPool]);
        solutionBlocks = [];
        // Save initial state
        userState[currentProblem].availableBlocks = availableBlocks.map(b => ({ ...b }));
        userState[currentProblem].solutionBlocks = solutionBlocks.map(b => ({ ...b }));
        userState[currentProblem].distractorsPool = distractorsPool.map(b => ({ ...b }));
        userState[currentProblem].solved = false;
    }

    renderBlocks();
    // Clear feedback
    document.getElementById('feedback').textContent = '';
    // Disable next button (unless last problem), unless already solved
    const nextBtn = document.getElementById('next-problem');
    if (currentProblem === problems.length - 1) {
        nextBtn.style.visibility = 'hidden';
    } else {
        nextBtn.style.visibility = 'visible';
    }
    nextBtn.disabled = !userState[currentProblem].solved;

    // If all problems solved, show certificate
    if (userState.every(s => s.solved)) {
        showCertificate();
        return;
    }
}

// --- Save state after every renderBlocks ---
function renderBlocks() {
    const available = document.getElementById('available-blocks');
    const solution = document.getElementById('solution-blocks');
    available.innerHTML = '';
    solution.innerHTML = '';

    availableBlocks.forEach((block, idx) => {
        const div = document.createElement('div');
        div.className = 'code-block';
        div.draggable = true;
        // Use <pre> to preserve whitespace (tabs/spaces)
        const pre = document.createElement('pre');
        pre.style.margin = 0;
        pre.style.fontFamily = 'inherit';
        pre.textContent = block.text;
        div.appendChild(pre);
        div.dataset.idx = idx;
        div.dataset.box = 'available';
        addDragEvents(div);
        available.appendChild(div);
    });

    solutionBlocks.forEach((block, idx) => {
        const div = document.createElement('div');
        div.className = 'code-block';
        div.draggable = true;
        const pre = document.createElement('pre');
        pre.style.margin = 0;
        pre.style.fontFamily = 'inherit';
        pre.textContent = block.text;
        div.appendChild(pre);
        div.dataset.idx = idx;
        div.dataset.box = 'solution';
        addDragEvents(div);
        solution.appendChild(div);
    });

    // --- Save current state for this problem ---
    userState[currentProblem].availableBlocks = availableBlocks.map(b => ({ ...b }));
    userState[currentProblem].solutionBlocks = solutionBlocks.map(b => ({ ...b }));
    userState[currentProblem].distractorsPool = distractorsPool.map(b => ({ ...b }));
}

// Drag and drop logic
let dragData = null;

function addDragEvents(div) {
    div.addEventListener('dragstart', function(e) {
        dragData = {
            fromBox: this.dataset.box,
            idx: Number(this.dataset.idx)
        };
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    div.addEventListener('dragend', function() {
        this.classList.remove('dragging');
    });
    div.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    div.addEventListener('drop', function(e) {
        e.preventDefault();
        if (!dragData) return;
        const toBox = this.dataset.box;
        const toIdx = Number(this.dataset.idx);

        if (dragData.fromBox === 'available' && toBox === 'solution') {
            // Insert from available to solution at position
            const [block] = availableBlocks.splice(dragData.idx, 1);
            solutionBlocks.splice(toIdx, 0, block);
        } else if (dragData.fromBox === 'solution' && toBox === 'solution') {
            // Rearrange within solution
            const [block] = solutionBlocks.splice(dragData.idx, 1);
            solutionBlocks.splice(toIdx, 0, block);
        } else if (dragData.fromBox === 'solution' && toBox === 'available') {
            // Move back to available
            const [block] = solutionBlocks.splice(dragData.idx, 1);
            availableBlocks.splice(toIdx, 0, block);
        }
        dragData = null;
        renderBlocks();
    });
}

// Check solution logic
function checkSolution() {
    const problem = problems[currentProblem];
    const correctBlocks = problem.blocks.map(b => b.text);
    const userBlocks = solutionBlocks.map(b => b.text);

    if (
        userBlocks.length === correctBlocks.length &&
        userBlocks.every((txt, i) => txt === correctBlocks[i])
    ) {
        document.getElementById('feedback').textContent = "✅ Correct!";
        document.getElementById('feedback').style.color = "green";
        // Only enable next if not last problem
        if (currentProblem < problems.length - 1) {
            document.getElementById('next-problem').disabled = false;
        }
        // --- Mark this problem as solved ---
        userState[currentProblem].solved = true;
        // --- Show certificate if this is the last problem and all are solved ---
        if (currentProblem === problems.length - 1 && userState.every(s => s.solved)) {
            showCertificate();
        }
    } else {
        document.getElementById('feedback').textContent = "❌ Not quite. Try again!";
        document.getElementById('feedback').style.color = "red";
        document.getElementById('next-problem').disabled = true;

        // Adaptive: Remove one distractor from availableBlocks or solutionBlocks if any remain
        // Find a distractor in availableBlocks
        let distractorIdx = availableBlocks.findIndex(b => !b.correct);
        if (distractorIdx !== -1) {
            // Remove from availableBlocks and distractorsPool
            const [removed] = availableBlocks.splice(distractorIdx, 1);
            const poolIdx = distractorsPool.findIndex(b => b.text === removed.text);
            if (poolIdx !== -1) distractorsPool.splice(poolIdx, 1);
            renderBlocks();
        } else {
            // If none left in available, remove from solutionBlocks
            distractorIdx = solutionBlocks.findIndex(b => !b.correct);
            if (distractorIdx !== -1) {
                const [removed] = solutionBlocks.splice(distractorIdx, 1);
                const poolIdx = distractorsPool.findIndex(b => b.text === removed.text);
                if (poolIdx !== -1) distractorsPool.splice(poolIdx, 1);
                renderBlocks();
            }
        }
    }
}

// --- DOMContentLoaded: load problems, then ask for name ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadProblems();
    askUserName();

    // Inject CSS styles
    const style = document.createElement('style');
    style.textContent = `
        /* Remove body and .container styles that set margin/padding/background */
        #problem-number {
            color: #5b7fff;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 1.1em;
        }
        #problem-prompt {
            font-size: 1.25em;
            font-weight: 500;
            margin-bottom: 24px;
            color: #222;
        }
        .blocks-row {
            display: flex;
            gap: 24px;
            margin-bottom: 18px;
        }
        .blocks-column {
            flex: 1;
            background: #f0f4ff;
            border-radius: 12px;
            min-height: 120px;
            padding: 16px 10px;
            box-shadow: 0 1px 4px rgba(60,72,88,0.07);
            display: flex;
            flex-direction: column;
            gap: 10px;
            transition: background 0.2s;
        }
        .blocks-column:focus-within, .blocks-column.dragover {
            background: #e3edff;
        }
        .blocks-column-title {
            font-size: 0.98em;
            color: #5b7fff;
            margin-bottom: 8px;
            font-weight: 600;
        }
        .code-block {
            background: #fff;
            border: 1.5px solid #d1e0ff;
            border-radius: 8px;
            padding: 8px 14px;
            font-family: 'Fira Mono', 'Consolas', monospace;
            font-size: 1em;
            color: #2d3a4a;
            box-shadow: 0 1px 2px rgba(60,72,88,0.04);
            cursor: grab;
            transition: box-shadow 0.15s, border 0.15s;
            user-select: none;
        }
        .code-block.dragging {
            opacity: 0.6;
            border-color: #5b7fff;
            box-shadow: 0 2px 8px rgba(91,127,255,0.10);
        }
        #feedback {
            font-size: 1.1em;
            margin: 18px 0 10px 0;
            min-height: 1.5em;
            font-weight: 500;
        }
        .controls-row {
            display: flex;
            gap: 12px;
            margin-top: 18px;
            justify-content: center; /* Center the buttons horizontally */
            align-items: center;
            width: 100%;
        }
        button {
            background: #5b7fff;
            color: #fff;
            border: none;
            border-radius: 7px;
            padding: 9px 22px;
            font-size: 1em;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 1px 4px rgba(60,72,88,0.07);
            transition: background 0.18s, box-shadow 0.18s;
        }
        button:disabled {
            background: #b7c9ff;
            color: #f6f8fa;
            cursor: not-allowed;
        }
        button:active:not(:disabled) {
            background: #3b5fff;
        }
        @media (max-width: 800px) {
            .container { padding: 18px 4vw; }
            .blocks-row { flex-direction: column; gap: 16px; }
        }
        @media (print) {
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                height: auto !important;
                width: auto !important;
            }
            body * {
                visibility: hidden !important;
            }
            #certificate, #certificate * {
                visibility: visible !important;
            }
            #certificate {
                position: static !important;
                margin: 0 auto !important;
                width: auto !important;
                height: auto !important;
                max-width: 800px !important;
                max-height: 100vh !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                overflow: hidden !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .cert-container {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                max-width: 700px !important;
                max-height: 90vh !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 !important;
            }
            #certificate button {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(style);

    ['available-blocks', 'solution-blocks'].forEach(boxId => {
        const box = document.getElementById(boxId);
        // Add dragover class for visual feedback
        box.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            box.classList.add('dragover');
        });
        box.addEventListener('dragleave', function() {
            box.classList.remove('dragover');
        });
        box.addEventListener('drop', function(e) {
            e.preventDefault();
            box.classList.remove('dragover');
            if (!dragData) return;
            if (boxId === 'solution-blocks' && dragData.fromBox === 'available') {
                // Drop at end of solution
                const [block] = availableBlocks.splice(dragData.idx, 1);
                solutionBlocks.push(block);
            } else if (boxId === 'available-blocks' && dragData.fromBox === 'solution') {
                // Drop at end of available
                const [block] = solutionBlocks.splice(dragData.idx, 1);
                availableBlocks.push(block);
            }
            dragData = null;
            renderBlocks();
        });
    });

    document.getElementById('check-solution').addEventListener('click', checkSolution);

    document.getElementById('prev-problem').addEventListener('click', () => {
        if (currentProblem > 0) {
            currentProblem--;
            renderProblem();
        }
    });
    document.getElementById('next-problem').addEventListener('click', () => {
        if (currentProblem < problems.length - 1) {
            currentProblem++;
            renderProblem();
        }
    });

    // Add certificate div
    if (!document.getElementById('certificate')) {
        const certDiv = document.createElement('div');
        certDiv.id = 'certificate';
        certDiv.style.display = 'none';
        document.body.appendChild(certDiv);
    }
});
