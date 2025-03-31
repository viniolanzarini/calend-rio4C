document.addEventListener("DOMContentLoaded", function () {
    console.log("Script carregado corretamente.");

    let horarios = ["07:00", "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00"];
    const aulas = {
        "ano1": [...Array(10)].map(() => [...Array(5)].map(() => "")),
        "ano2": [...Array(10)].map(() => [...Array(5)].map(() => "")),
        "ano3": [...Array(10)].map(() => [...Array(5)].map(() => ""))
    };

    function preencherTabela(ano) {
        const tbody = document.querySelector(`#${ano} tbody`);
        if (!tbody) return;
        tbody.innerHTML = "";
        horarios.forEach((horario, i) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td class="editable" contenteditable="true">${horario}</td>` +
                aulas[ano][i].map(aula => `<td class="droppable editable" contenteditable="true" draggable="true">${aula}</td>`).join("");
            tbody.appendChild(row);
        });
        
        // Adicionar eventos de arrastar e soltar para as células da tabela
        configurarCelulasDraggableDroppable(tbody.querySelectorAll('td.droppable'));
    }

    ["ano1", "ano2", "ano3"].forEach(preencherTabela);

    // Função para configurar eventos de drag-and-drop para qualquer célula
    function configurarCelulasDraggableDroppable(cells) {
        cells.forEach(cell => {
            // Eventos de arrastar
            cell.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', this.textContent);
                e.dataTransfer.setData('source-type', 'cell');
                this.classList.add('dragging');
                // Armazenar uma referência à célula de origem
                window.dragSourceElement = this;
            });
            
            cell.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                window.dragSourceElement = null;
            });
            
            // Eventos para soltar
            cell.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('drop-hover');
            });
            
            cell.addEventListener('dragleave', function() {
                this.classList.remove('drop-hover');
            });
            
            cell.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drop-hover');
                
                const data = e.dataTransfer.getData('text/plain');
                const sourceType = e.dataTransfer.getData('source-type');
                
                // Se a fonte for uma célula da tabela e for a mesma do destino, não fazemos nada
                if (sourceType === 'cell' && this === window.dragSourceElement) {
                    return;
                }
                
                // Se for arrasto de disciplina ou professor
                if (sourceType === 'discipline') {
                    if (this.textContent.trim() === '') {
                        this.textContent = data;
                    } else {
                        this.textContent = this.textContent + ' - ' + data;
                    }
                } 
                else if (sourceType === 'professor') {
                    if (this.textContent.trim() === '') {
                        this.textContent = data;
                    } else {
                        this.textContent = this.textContent + ', ' + data;
                    }
                }
                // Se for arrasto de uma célula para outra
                else if (sourceType === 'cell') {
                    if (confirm('Deseja mover ou copiar este conteúdo?')) {
                        if (this.textContent.trim() === '') {
                            this.textContent = data;
                        } else {
                            this.textContent = this.textContent + ' | ' + data;
                        }
                        
                        // Limpar a célula de origem se estiver movendo
                        if (window.dragSourceElement && confirm('Limpar a célula original?')) {
                            window.dragSourceElement.textContent = '';
                        }
                    }
                }
            });
        });
    }

    // Tornar as células da tabela de disciplinas arrastáveis
    const disciplinaCells = document.querySelectorAll('#disciplinas td');
    disciplinaCells.forEach(cell => {
        cell.setAttribute('draggable', 'true');
        cell.classList.add('draggable-discipline');
        
        cell.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.textContent);
            e.dataTransfer.setData('source-type', 'discipline');
            this.classList.add('dragging');
        });
        
        cell.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    });
    
    // Tornar as células da tabela de professores arrastáveis
    const professorCells = document.querySelectorAll('#professores td');
    professorCells.forEach(cell => {
        cell.setAttribute('draggable', 'true');
        cell.classList.add('draggable-professor');
        
        cell.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.textContent);
            e.dataTransfer.setData('source-type', 'professor');
            this.classList.add('dragging');
        });
        
        cell.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    });

    // Função para configurar eventos de arraste para disciplinas
    function configurarDisciplinaArrastavel(cell) {
        cell.setAttribute('draggable', 'true');
        cell.classList.add('draggable-discipline');
        
        cell.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.textContent);
            e.dataTransfer.setData('source-type', 'discipline');
            this.classList.add('dragging');
        });
        
        cell.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    }
    
    // Função para configurar eventos de arraste para professores
    function configurarProfessorArrastavel(cell) {
        cell.setAttribute('draggable', 'true');
        cell.classList.add('draggable-professor');
        
        cell.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.textContent);
            e.dataTransfer.setData('source-type', 'professor');
            this.classList.add('dragging');
        });
        
        cell.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    }

    // Permitir que novas disciplinas adicionadas sejam arrastáveis
    document.getElementById('adicionarDisciplina').addEventListener('click', function () {
        const novaDisciplina = document.getElementById('novaDisciplina').value;
        if (novaDisciplina) {
            const tabelaDisciplinas = document.querySelector('#disciplinas tbody');
            const novaLinha = document.createElement('tr');
            const novaCelula = document.createElement('td');
            novaCelula.textContent = novaDisciplina;
            configurarDisciplinaArrastavel(novaCelula);
            
            novaLinha.appendChild(novaCelula);
            tabelaDisciplinas.appendChild(novaLinha);
            document.getElementById('novaDisciplina').value = '';
        }
    });

    // Permitir que novos professores adicionados sejam arrastáveis
    document.getElementById('adicionarProfessor').addEventListener('click', function () {
        const novoProfessor = document.getElementById('novoProfessor').value;
        if (novoProfessor) {
            const tabelaProfessores = document.querySelector('#professores tbody');
            const novaLinha = document.createElement('tr');
            const novaCelula = document.createElement('td');
            novaCelula.textContent = novoProfessor;
            configurarProfessorArrastavel(novaCelula);
            
            novaLinha.appendChild(novaCelula);
            tabelaProfessores.appendChild(novaLinha);
            document.getElementById('novoProfessor').value = '';
        }
    });

    document.getElementById('adicionarHorario').addEventListener('click', function() {
        const novoHorario = document.getElementById('novoHorario').value;
        const calendarioSelecionado = document.getElementById('selecionarCalendario').value;

        if (novoHorario) {
            const tabela = document.querySelector(`#${calendarioSelecionado} tbody`);
            const novaLinha = document.createElement('tr');
            novaLinha.innerHTML = `
                <td class="editable" contenteditable="true">${novoHorario}</td>
                <td class="droppable editable" contenteditable="true" draggable="true"></td>
                <td class="droppable editable" contenteditable="true" draggable="true"></td>
                <td class="droppable editable" contenteditable="true" draggable="true"></td>
                <td class="droppable editable" contenteditable="true" draggable="true"></td>
                <td class="droppable editable" contenteditable="true" draggable="true"></td>
            `;
            
            // Configurar as novas células para serem arrastáveis e receberem elementos
            configurarCelulasDraggableDroppable(novaLinha.querySelectorAll('.droppable'));
            
            tabela.appendChild(novaLinha);
            document.getElementById('novoHorario').value = '';
        }
    });
    
    // Adicionar menu de contexto para limpar célula
    document.addEventListener('contextmenu', function(e) {
        const target = e.target;
        
        if (target.classList.contains('droppable')) {
            e.preventDefault();
            
            // Remover menu existente se houver
            const existingMenu = document.querySelector('.context-menu');
            if (existingMenu) {
                existingMenu.remove();
            }
            
            // Criar menu de contexto
            const menu = document.createElement('div');
            menu.classList.add('context-menu');
            menu.style.position = 'absolute';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
            menu.style.backgroundColor = 'white';
            menu.style.border = '1px solid #ccc';
            menu.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.2)';
            menu.style.padding = '5px';
            menu.style.borderRadius = '4px';
            menu.style.zIndex = '1000';
            
            // Opção para limpar célula
            const limparOpcao = document.createElement('div');
            limparOpcao.textContent = 'Limpar célula';
            limparOpcao.style.padding = '5px 10px';
            limparOpcao.style.cursor = 'pointer';
            limparOpcao.style.borderBottom = '1px solid #eee';
            limparOpcao.addEventListener('click', function() {
                target.textContent = '';
                menu.remove();
            });
            
            menu.appendChild(limparOpcao);
            document.body.appendChild(menu);
            
            // Fechar o menu ao clicar fora dele
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }
    });
});