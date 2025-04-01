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

    // Função para verificar se um item já existe na célula
    function itemExisteNaCelula(celula, item, tipo) {
        const conteudo = celula.textContent;
        if (conteudo.trim() === '') return false;
        
        if (tipo === 'professor') {
            // Dividir o conteúdo por vírgulas e verificar se o professor já existe
            const professores = conteudo.split(',').map(p => p.trim());
            return professores.includes(item);
        } else if (tipo === 'discipline') {
            // Dividir o conteúdo por hífens e verificar se a disciplina já existe
            const disciplinas = conteudo.split('-').map(d => d.trim());
            return disciplinas.includes(item);
        } else if (tipo === 'cell') {
            // Dividir o conteúdo por | e verificar se o conteúdo já existe
            const conteudos = conteudo.split('|').map(c => c.trim());
            return conteudos.includes(item.trim());
        }
        
        return false;
    }

    // Função para verificar se um professor já está alocado no mesmo horário em outra turma
    function verificarConflitoProfessor(professor, horarioIndex, diaSemanaIndex, turmaId) {
        // Obter índice da célula na tabela (mesma linha e coluna, mas turmas diferentes)
        const turmas = ["ano1", "ano2", "ano3"];
        
        // Para cada turma diferente da atual
        for (const turma of turmas) {
            if (turma === turmaId) continue; // Pular a turma atual
            
            // Encontrar a célula correspondente na outra turma
            const tabelaTurma = document.querySelector(`#${turma} tbody`);
            if (!tabelaTurma) continue;
            
            const linhas = tabelaTurma.querySelectorAll('tr');
            if (horarioIndex >= linhas.length) continue;
            
            const linha = linhas[horarioIndex];
            const celulas = linha.querySelectorAll('td');
            
            // A primeira célula é o horário, então precisamos adicionar 1 ao índice do dia da semana
            if (diaSemanaIndex + 1 >= celulas.length) continue;
            
            const celula = celulas[diaSemanaIndex + 1];
            const conteudo = celula.textContent;
            
            if (conteudo.trim() === '') continue;
            
            // Verificar se o professor está nesta célula
            const professoresCelula = conteudo.split(',').map(p => p.trim());
            if (professoresCelula.includes(professor)) {
                return {
                    conflito: true,
                    turma: turma.replace('ano', '')
                };
            }
        }
        
        return { conflito: false };
    }

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
                    } else if (!itemExisteNaCelula(this, data, 'discipline')) {
                        this.textContent = this.textContent + ' - ' + data;
                    } else {
                        alert('Esta disciplina já está nesta célula!');
                    }
                } 
                else if (sourceType === 'professor') {
                    // Encontrar índice do horário e dia da semana
                    const linha = this.parentElement;
                    const tabela = linha.parentElement;
                    const turmaContainer = tabela.parentElement.parentElement;
                    const turmaId = turmaContainer.id;
                    
                    const horarioIndex = Array.from(tabela.children).indexOf(linha);
                    const diaSemanaIndex = Array.from(linha.children).indexOf(this) - 1; // -1 porque a primeira célula é o horário
                    
                    // Verificar se o professor já está alocado no mesmo horário em outra turma
                    const { conflito, turma } = verificarConflitoProfessor(data, horarioIndex, diaSemanaIndex, turmaId);
                    
                    if (conflito) {
                        alert(`O professor ${data} já está alocado neste mesmo horário na ${turma}ª Série!`);
                        return;
                    }
                    
                    // Continuar com a alocação normal se não houver conflito
                    if (this.textContent.trim() === '') {
                        this.textContent = data;
                    } else if (!itemExisteNaCelula(this, data, 'professor')) {
                        this.textContent = this.textContent + ', ' + data;
                    } else {
                        alert('Este professor já está nesta célula!');
                    }
                }
                // Se for arrasto de uma célula para outra
                else if (sourceType === 'cell') {
                    if (confirm('Deseja mover ou copiar este conteúdo?')) {
                        // Verificar se contém professores que possam ter conflito
                        const professores = data.split(',').map(p => p.trim());
                        
                        // Encontrar índice do horário e dia da semana
                        const linha = this.parentElement;
                        const tabela = linha.parentElement;
                        const turmaContainer = tabela.parentElement.parentElement;
                        const turmaId = turmaContainer.id;
                        
                        const horarioIndex = Array.from(tabela.children).indexOf(linha);
                        const diaSemanaIndex = Array.from(linha.children).indexOf(this) - 1;
                        
                        // Verificar conflitos para cada professor
                        let temConflito = false;
                        let professorComConflito = '';
                        let turmaConflito = '';
                        
                        for (const professor of professores) {
                            if (professor.trim() === '') continue;
                            
                            const { conflito, turma } = verificarConflitoProfessor(professor, horarioIndex, diaSemanaIndex, turmaId);
                            
                            if (conflito) {
                                temConflito = true;
                                professorComConflito = professor;
                                turmaConflito = turma;
                                break;
                            }
                        }
                        
                        if (temConflito) {
                            alert(`O professor ${professorComConflito} já está alocado neste mesmo horário na ${turmaConflito}ª Série!`);
                            return;
                        }
                        
                        // Continuar com a alocação normal se não houver conflito
                        if (this.textContent.trim() === '') {
                            this.textContent = data;
                        } else if (!itemExisteNaCelula(this, data, 'cell')) {
                            this.textContent = this.textContent + ' | ' + data;
                        } else {
                            alert('Este conteúdo já existe nesta célula!');
                            return;
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

    // Função para validar formato de horário
    function validarFormatoHorario(horario) {
        // Padrão para horários simples (ex: 07:00)
        const padrao1 = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        // Padrão para intervalos de horário (ex: 08:00 - 09:00)
        const padrao2 = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        return padrao1.test(horario) || padrao2.test(horario);
    }

    // Configurar o campo de input de horário
    const inputNovoHorario = document.getElementById('novoHorario');
    
    // Adicionar placeholder mais descritivo
    inputNovoHorario.placeholder = "HH:MM ou HH:MM - HH:MM";
    
    // Configurar o botão de adicionar horário com validação
    document.getElementById('adicionarHorario').addEventListener('click', function() {
        const novoHorario = inputNovoHorario.value;
        const calendarioSelecionado = document.getElementById('selecionarCalendario').value;

        if (!novoHorario) {
            alert('Por favor, informe um horário.');
            return;
        }
        
        if (!validarFormatoHorario(novoHorario)) {
            alert('Formato de horário inválido. Use HH:MM ou HH:MM - HH:MM');
            return;
        }

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
        inputNovoHorario.value = '';
    });
    
    // Adicionar validação enquanto o usuário digita no campo de horário
    inputNovoHorario.addEventListener('input', function() {
        const valor = this.value;
        
        // Aplicar formatação automática de dois pontos após os dois primeiros dígitos
        if (valor.length === 2 && !isNaN(valor) && !valor.includes(':')) {
            this.value = valor + ':';
        }
        
        // Validar o formato atual do campo
        if (valor && !validarFormatoHorario(valor)) {
            this.classList.add('input-invalido');
        } else {
            this.classList.remove('input-invalido');
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
    
    // Verificar conflitos quando o usuário edita diretamente uma célula
    document.addEventListener('input', function(e) {
        const target = e.target;
        
        if (target.classList.contains('droppable')) {
            const conteudo = target.textContent;
            const professores = conteudo.split(',').map(p => p.trim());
            
            // Encontrar índice do horário e dia da semana
            const linha = target.parentElement;
            const tabela = linha.parentElement;
            const turmaContainer = tabela.parentElement.parentElement;
            const turmaId = turmaContainer.id;
            
            const horarioIndex = Array.from(tabela.children).indexOf(linha);
            const diaSemanaIndex = Array.from(linha.children).indexOf(target) - 1;
            
            // Verificar conflitos para cada professor
            for (const professor of professores) {
                if (professor.trim() === '') continue;
                
                const { conflito, turma } = verificarConflitoProfessor(professor, horarioIndex, diaSemanaIndex, turmaId);
                
                if (conflito) {
                    alert(`O professor ${professor} já está alocado neste mesmo horário na ${turma}ª Série!`);
                    // Remover o professor conflitante
                    const novosConteudos = professores.filter(p => p !== professor).join(', ');
                    target.textContent = novosConteudos;
                    break;
                }
            }
        }
    });
});