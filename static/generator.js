// static/generator.js

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('generator-form');
    const resultDiv = document.getElementById('result');
    const previewBtn = document.getElementById('preview-btn');
    const urlDiv = document.getElementById('api-url');

    function getSpecFromForm() {
        const language = form.language.value;
        const numProblems = parseInt(form.num_problems.value, 10);
        const concepts = {};
        document.querySelectorAll('.concept-checkbox').forEach(cb => {
            const diff = cb.dataset.difficulty;
            if (!concepts[diff]) concepts[diff] = {};
            concepts[diff][cb.value] = cb.checked;
        });
        return { language, concepts, num_problems: numProblems };
    }

    function encodeSpec(spec) {
        return btoa(JSON.stringify(spec));
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        resultDiv.textContent = 'Generating...';
        urlDiv.textContent = '';
        const spec = getSpecFromForm();
        const encoded = encodeSpec(spec);
        const url = `/generate-problems?specification=${encoded}`;
        urlDiv.innerHTML = `<b>API URL:</b> <code>${url}</code>`;
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('Server error');
            const text = await resp.text();
            // Try to pretty-print JSON
            let pretty;
            try { pretty = JSON.stringify(JSON.parse(text), null, 2); }
            catch { pretty = text; }
            resultDiv.innerHTML = `<pre>${pretty}</pre>`;
        } catch (err) {
            resultDiv.textContent = 'Error: ' + err.message;
        }
    });
});
