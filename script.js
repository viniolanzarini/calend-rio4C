document.addEventListener("DOMContentLoaded", function () {
    console.log("Script carregado corretamente.");

    let horarios = ["07:00", "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00"];
    const aulas = {
        "ano1": [...Array(10)].map(() => [...Array(5)].map(() => "Teste")),
        "ano2": [...Array(10)].map(() => [...Array(5)].map(() => "Teste")),
        "ano3": [...Array(10)].map(() => [...Array(5)].map(() => "Teste"))
    };

    function preencherTabela(ano) {
        const tbody = document.querySelector(`#${ano} tbody`);
        if (!tbody) return;
        tbody.innerHTML = "";
        horarios.forEach((horario, i) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td class="editable" contenteditable="true">${horario}</td>` +
                aulas[ano][i].map(aula => `<td class="draggable editable" draggable="true" contenteditable="true">${aula}</td>`).join(" ");
            tbody.appendChild(row);
        });
    }

    ["ano1", "ano2", "ano3"].forEach(preencherTabela);

    document.addEventListener("dragstart", event => {
        if (event.target.classList.contains("draggable")) {
            event.dataTransfer.setData("text", event.target.innerHTML);
            event.target.classList.add("dragging");
        }
    });

    document.addEventListener("dragover", event => event.preventDefault());

    document.addEventListener("drop", event => {
        event.preventDefault();
        const dragging = document.querySelector(".dragging");
        if (dragging && event.target.tagName === "TD" && event.target.classList.contains("draggable")) {
            const confirmacao = confirm("Você deseja realmente substituir o conteúdo da célula?");
            if (confirmacao) {
                event.target.innerHTML = dragging.innerHTML;
                dragging.innerHTML = "";
            }
        }
        dragging?.classList.remove("dragging");
    });

    document.addEventListener("input", event => {
        if (event.target.tagName === "TD" && event.target.classList.contains("editable")) {
            const rowIndex = event.target.parentElement.rowIndex - 1;
            const colIndex = event.target.cellIndex;
            if (colIndex === 0) {
                horarios[rowIndex] = event.target.innerHTML;
            }
        }
    });

    new Sortable(document.querySelector('.drag-container'), {
        animation: 150,
        ghostClass: 'sortable-ghost'
    });

    document.getElementById('adicionarDisciplina').addEventListener('click', function () {
        const novaDisciplina = document.getElementById('novaDisciplina').value;
        if (novaDisciplina) {
            const tabelaDisciplinas = document.querySelector('#disciplinas tbody');
            const novaLinha = document.createElement('tr');
            const novaCelula = document.createElement('td');
            novaCelula.textContent = novaDisciplina;
            novaLinha.appendChild(novaCelula);
            tabelaDisciplinas.appendChild(novaLinha);
            document.getElementById('novaDisciplina').value = '';
        }
    });

    document.getElementById('adicionarProfessor').addEventListener('click', function () {
        const novoProfessor = document.getElementById('novoProfessor').value;
        if (novoProfessor) {
            const tabelaProfessores = document.querySelector('#professores tbody');
            const novaLinha = document.createElement('tr');
            const novaCelula = document.createElement('td');
            novaCelula.textContent = novoProfessor;
            novaLinha.appendChild(novaCelula);
            tabelaProfessores.appendChild(novaLinha);
            document.getElementById('novoProfessor').value = '';
        }
    });
});
