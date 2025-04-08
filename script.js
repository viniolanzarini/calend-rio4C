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

    // Função para verificar se uma célula contém uma disciplina
    function verificarDisciplinaExiste(celula) {
        const conteudo = celula.textContent;
        if (conteudo.trim() === '') return false;

        // Se tem disciplina, vai ter o formato "Disciplina" ou "Disciplina (Professor1, Professor2)"
        // Verificamos se há um conteúdo antes do primeiro parêntese (se existir)
        const contemParenteses = conteudo.indexOf('(') !== -1;
        if (contemParenteses) {
            return conteudo.substring(0, conteudo.indexOf('(')).trim() !== '';
        } else {
            return conteudo.trim() !== '';
        }
    }

    // Função para extrair disciplina e professores de uma célula
    function extrairDisciplinaProfessores(celula) {
        const conteudo = celula.textContent;
        if (conteudo.trim() === '') return { disciplina: '', professores: [] };

        const regex = /^(.+?)(?:\s*\((.+)\))?$/;
        const matches = conteudo.match(regex);
        
        if (matches) {
            const disciplina = matches[1].trim();
            const professores = matches[2] ? matches[2].split(',').map(p => p.trim()) : [];
            return { disciplina, professores };
        }
        
        return { disciplina: conteudo, professores: [] };
    }

    // Função para atualizar o conteúdo da célula com disciplina e professores
    function atualizarConteudoCelula(celula, disciplina, professores) {
        if (!disciplina) {
            celula.textContent = '';
            return;
        }
        
        if (professores.length > 0) {
            celula.textContent = `${disciplina} (${professores.join(', ')})`;
        } else {
            celula.textContent = disciplina;
        }
    }

    function verificarConflitoProfessor(professor, horarioIndex, diaSemanaIndex, turmaId) {
        const turmas = ["ano1", "ano2", "ano3"];

        for (const turma of turmas) {
            if (turma === turmaId) continue;

            const tabelaTurma = document.querySelector(`#${turma} tbody`);
            if (!tabelaTurma) continue;

            const linhas = tabelaTurma.querySelectorAll('tr');
            if (horarioIndex >= linhas.length) continue;

            const linha = linhas[horarioIndex];
            const celulas = linha.querySelectorAll('td');

            if (diaSemanaIndex + 1 >= celulas.length) continue;

            const celula = celulas[diaSemanaIndex + 1];
            const { professores } = extrairDisciplinaProfessores(celula);
            
            if (professores.includes(professor)) {
                return {
                    conflito: true,
                    turma: turma.replace('ano', '')
                };
            }
        }

        return { conflito: false };
    }

    function configurarCelulasDraggableDroppable(cells) {
        cells.forEach(cell => {
            cell.addEventListener('dragstart', function (e) {
                e.dataTransfer.setData('text/plain', this.textContent);
                e.dataTransfer.setData('source-type', 'cell');
                this.classList.add('dragging');
                window.dragSourceElement = this;
            });

            cell.addEventListener('dragend', function () {
                this.classList.remove('dragging');
                window.dragSourceElement = null;
            });

            cell.addEventListener('dragover', function (e) {
                e.preventDefault();
                this.classList.add('drop-hover');
            });

            cell.addEventListener('dragleave', function () {
                this.classList.remove('drop-hover');
            });

            cell.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('drop-hover');

                const data = e.dataTransfer.getData('text/plain');
                const sourceType = e.dataTransfer.getData('source-type');

                if (sourceType === 'cell' && this === window.dragSourceElement) {
                    return;
                }

                const linha = this.parentElement;
                const tabela = linha.parentElement;
                const turmaContainer = tabela.parentElement.parentElement;
                const turmaId = turmaContainer.id;

                const horarioIndex = Array.from(tabela.children).indexOf(linha);
                const diaSemanaIndex = Array.from(linha.children).indexOf(this) - 1;

                // Extrair disciplina e professores atuais da célula
                const { disciplina: disciplinaAtual, professores: professoresAtuais } = extrairDisciplinaProfessores(this);

                if (sourceType === 'discipline') {
                    // Verificar se já existe alguma disciplina na célula
                    if (disciplinaAtual && disciplinaAtual !== data) {
                        alert('Esta célula já possui uma disciplina! Só é permitida uma disciplina por célula.');
                        return;
                    }
                    
                    // Atualizar a célula com a nova disciplina mantendo os professores
                    atualizarConteudoCelula(this, data, professoresAtuais);
                } 
                else if (sourceType === 'professor') {
                    // Verificar se existe uma disciplina definida
                    if (!disciplinaAtual) {
                        alert('Você precisa adicionar uma disciplina antes de associar um professor!');
                        return;
                    }
                    
                    // Verificar se o professor já está na célula
                    if (professoresAtuais.includes(data)) {
                        alert('Este professor já está associado a esta disciplina!');
                        return;
                    }
                    
                    // Verificar conflito de horário com outras turmas
                    const { conflito, turma } = verificarConflitoProfessor(data, horarioIndex, diaSemanaIndex, turmaId);
                    if (conflito) {
                        alert(`O professor ${data} já está alocado neste mesmo horário na ${turma}ª Série!`);
                        return;
                    }
                    
                    // Adicionar o professor à célula
                    professoresAtuais.push(data);
                    atualizarConteudoCelula(this, disciplinaAtual, professoresAtuais);
                } 
                else if (sourceType === 'cell') {
                    const { disciplina: disciplinaArrastada, professores: professoresArrastados } = extrairDisciplinaProfessores(window.dragSourceElement);
                    
                    // Se já tem disciplina e a arrastada é diferente, impedir
                    if (disciplinaAtual && disciplinaArrastada && disciplinaAtual !== disciplinaArrastada) {
                        alert('Esta célula já possui uma disciplina! Só é permitida uma disciplina por célula.');
                        return;
                    }
                    
                    // Nova disciplina a ser usada (prioriza a existente ou pega a arrastada)
                    const novaDisciplina = disciplinaAtual || disciplinaArrastada;
                    
                    // Verifica conflitos de professores com outras turmas
                    let temConflito = false;
                    let professorComConflito = '';
                    let turmaConflito = '';
                    
                    for (const professor of professoresArrastados) {
                        if (!professoresAtuais.includes(professor)) {
                            const { conflito, turma } = verificarConflitoProfessor(professor, horarioIndex, diaSemanaIndex, turmaId);
                            if (conflito) {
                                temConflito = true;
                                professorComConflito = professor;
                                turmaConflito = turma;
                                break;
                            }
                        }
                    }
                    
                    if (temConflito) {
                        alert(`O professor ${professorComConflito} já está alocado neste mesmo horário na ${turmaConflito}ª Série!`);
                        return;
                    }
                    
                    // Combinar professores sem duplicatas
                    const novosProfessores = [...new Set([...professoresAtuais, ...professoresArrastados])];
                    
                    // Atualizar célula
                    atualizarConteudoCelula(this, novaDisciplina, novosProfessores);
                    
                    // Perguntar se quer limpar a célula original
                    if (window.dragSourceElement && confirm('Limpar a célula original?')) {
                        window.dragSourceElement.textContent = '';
                    }
                }
            });
            
            // Adicionar evento para validar entrada manual
            cell.addEventListener('input', function() {
                const linha = this.parentElement;
                const tabela = linha.parentElement;
                const turmaContainer = tabela.parentElement.parentElement;
                const turmaId = turmaContainer.id;
                const horarioIndex = Array.from(tabela.children).indexOf(linha);
                const diaSemanaIndex = Array.from(linha.children).indexOf(this) - 1;
                
                // Se estiver vazio, não faz nada
                if (!this.textContent.trim()) return;
                
                // Tenta extrair disciplina e professores do texto digitado
                try {
                    let texto = this.textContent.trim();
                    let disciplina = texto;
                    let professores = [];
                    
                    // Verificar se tem formato "Disciplina (Professor1, Professor2)"
                    const regex = /^(.+?)\s*\((.+)\)$/;
                    const matches = texto.match(regex);
                    
                    if (matches) {
                        disciplina = matches[1].trim();
                        professores = matches[2].split(',').map(p => p.trim());
                        
                        // Verificar conflitos de professores
                        for (const professor of professores) {
                            const { conflito, turma } = verificarConflitoProfessor(professor, horarioIndex, diaSemanaIndex, turmaId);
                            if (conflito) {
                                alert(`O professor ${professor} já está alocado neste mesmo horário na ${turma}ª Série!`);
                                // Remove este professor
                                professores = professores.filter(p => p !== professor);
                            }
                        }
                        
                        // Se removeu algum professor devido a conflito, atualiza a célula
                        atualizarConteudoCelula(this, disciplina, professores);
                    } else if (!professores.length && !disciplina) {
                        // Se não tem formato válido e não tem disciplina, apaga
                        this.textContent = '';
                    }
                } catch (error) {
                    console.error("Erro ao processar entrada manual:", error);
                }
            });
        });
    }

    // Tornar as células da tabela de disciplinas arrastáveis
    const disciplinaCells = document.querySelectorAll('#disciplinas td');
    disciplinaCells.forEach(cell => {
        cell.setAttribute('draggable', 'true');
        cell.classList.add('draggable-discipline');

        cell.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/plain', this.textContent);
            e.dataTransfer.setData('source-type', 'discipline');
            this.classList.add('dragging');
        });

        cell.addEventListener('dragend', function () {
            this.classList.remove('dragging');
        });
    });

    // Tornar as células da tabela de professores arrastáveis
    const professorCells = document.querySelectorAll('#professores td');
    professorCells.forEach(cell => {
        cell.setAttribute('draggable', 'true');
        cell.classList.add('draggable-professor');

        cell.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/plain', this.textContent);
            e.dataTransfer.setData('source-type', 'professor');
            this.classList.add('dragging');
        });

        cell.addEventListener('dragend', function () {
            this.classList.remove('dragging');
        });
    });

    // Função para configurar eventos de arraste para disciplinas
    function configurarDisciplinaArrastavel(cell) {
        cell.setAttribute('draggable', 'true');
        cell.classList.add('draggable-discipline');

        cell.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/plain', this.textContent);
            e.dataTransfer.setData('source-type', 'discipline');
            this.classList.add('dragging');
        });

        cell.addEventListener('dragend', function () {
            this.classList.remove('dragging');
        });
    }

    // Função para configurar eventos de arraste para professores
    function configurarProfessorArrastavel(cell) {
        cell.setAttribute('draggable', 'true');
        cell.classList.add('draggable-professor');

        cell.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/plain', this.textContent);
            e.dataTransfer.setData('source-type', 'professor');
            this.classList.add('dragging');
        });

        cell.addEventListener('dragend', function () {
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
        const padrao1 = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        const padrao2 = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return padrao1.test(horario) || padrao2.test(horario);
    }

    const inputNovoHorario = document.getElementById('novoHorario');
    inputNovoHorario.placeholder = "HH:MM ou HH:MM - HH:MM";

    document.getElementById('adicionarHorario').addEventListener('click', function () {
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

        configurarCelulasDraggableDroppable(novaLinha.querySelectorAll('.droppable'));

        tabela.appendChild(novaLinha);
        inputNovoHorario.value = '';
    });

    inputNovoHorario.addEventListener('input', function () {
        const valor = this.value;

        if (valor.length === 2 && !isNaN(valor) && !valor.includes(':')) {
            this.value = valor + ':';
        }

        if (valor && !validarFormatoHorario(valor)) {
            this.classList.add('input-invalido');
        } else {
            this.classList.remove('input-invalido');
        }
    });

    document.addEventListener('contextmenu', function (e) {
        const target = e.target;

        if (target.classList.contains('droppable')) {
            e.preventDefault();

            const existingMenu = document.querySelector('.context-menu');
            if (existingMenu) {
                existingMenu.remove();
            }

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

            const limparOpcao = document.createElement('div');
            limparOpcao.textContent = 'Limpar célula';
            limparOpcao.style.padding = '5px 10px';
            limparOpcao.style.cursor = 'pointer';
            limparOpcao.style.borderBottom = '1px solid #eee';
            limparOpcao.addEventListener('click', function () {
                target.textContent = '';
                menu.remove();
            });

            menu.appendChild(limparOpcao);
            document.body.appendChild(menu);

            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }
    });
});