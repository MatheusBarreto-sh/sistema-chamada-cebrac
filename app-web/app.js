const supabaseUrl = 'https://yhnfsmloqcjfwsbeidvv.supabase.co';
const supabaseKey = 'sb_publishable_vFH_ZuHkvqjZU41gl7gNpw_LgiQHpcC';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let nomeAluno = localStorage.getItem('nomeCebrac') || "";
let turmaAluno = localStorage.getItem('turmaCebrac') || "";
let sexoAluno = localStorage.getItem('sexoCebrac') || "";
let versaoLocal = localStorage.getItem('versaoCebrac') || "1.0"; 

const somLevelUp = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');

function aplicarTemaBaseadoNoSexo() {
    const humorSelect = document.getElementById('humorAluno');
    if (!humorSelect) return; 

    if (sexoAluno === "Feminino") {
        document.body.setAttribute('data-theme', 'feminino');
        humorSelect.options[0].text = '😃 Estou Animada';
        humorSelect.options[1].text = '😴 Estou Cansada'; 
        humorSelect.options[2].text = '🤯 Estou Focada'; 
    } else {
        document.body.removeAttribute('data-theme');
        humorSelect.options[0].text = '😃 Estou Animado';
        humorSelect.options[1].text = '😴 Estou Cansado';
        humorSelect.options[2].text = '🤯 Estou Focado';
    }
}

aplicarTemaBaseadoNoSexo();

window.onload = function() {
    setTimeout(() => {
        document.getElementById('splashScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('splashScreen').style.display = 'none';
            if (nomeAluno && turmaAluno) {
                document.getElementById('telaRegistro').style.display = 'none';
                abrirTelaPrincipal();
            } else {
                document.getElementById('telaRegistro').style.display = 'flex'; 
            }
        }, 500);
    }, 1500);
};

function mostrarAlertaNativo(mensagem, cor = "#007aff") {
    const alerta = document.getElementById("alertaNativo");
    const texto = document.getElementById("textoAlertaNativo");
    texto.innerText = mensagem;
    alerta.style.borderLeft = `4px solid ${cor}`;
    alerta.classList.add("mostrar");
    setTimeout(() => { alerta.classList.remove("mostrar"); }, 3000);
}

function registrarAluno() {
    const nome = document.getElementById('inputNome').value.trim();
    const turma = document.getElementById('inputTurma').value.trim();
    const sexo = document.getElementById('inputSexo').value;

    if (!nome || !turma || !sexo) {
        mostrarAlertaNativo("Preencha todos os campos!", "#ff4a4a");
        return;
    }

    localStorage.setItem('nomeCebrac', nome);
    localStorage.setItem('turmaCebrac', turma.toUpperCase()); 
    localStorage.setItem('sexoCebrac', sexo);
    
    nomeAluno = nome;
    turmaAluno = turma.toUpperCase();
    sexoAluno = sexo;
    
    aplicarTemaBaseadoNoSexo(); 
    document.getElementById('telaRegistro').style.display = 'none';
    abrirTelaPrincipal();
}

function abrirTelaPrincipal() {
    document.getElementById('telaRegistro').style.display = 'none';
    document.getElementById('telaPrincipal').style.display = 'block';
    document.getElementById('boasVindas').innerText = `Olá, ${nomeAluno.split(' ')[0]}`;
    document.getElementById('dashStatus').innerText = "Online";

    if (nomeAluno.toLowerCase().trim() === "matheus barreto bispo") {
        document.getElementById('iconeAdmin').style.display = 'flex';
    }
    calcularEstatisticas();
}

async function calcularEstatisticas() {
    try {
        const { data } = await supabaseClient.from('chamadas').select('*').eq('nome', nomeAluno);
        
        if (data && data.length > 0) {
            const dataValida = data.filter(d => d.humor !== "ESPERANDO_DUPLA"); // Ignora checkins de lobby
            const totalAulas = dataValida.length;
            const noHorario = dataValida.filter(d => d.atrasado === false).length;
            
            const pontos = (totalAulas * 10) + (noHorario * 5);
            const pontualidade = totalAulas > 0 ? Math.round((noHorario / totalAulas) * 100) : 0;

            document.getElementById('dashPontos').innerText = `${pontos} Pontos`;
            document.getElementById('dashFrequencia').innerText = `${pontualidade}%`;

            let nivel = "Iniciante"; let larguraBarra = 20;
            if (pontos >= 150) { nivel = "Os Mais Mais 👑"; larguraBarra = 100; document.body.classList.add("tema-ouro"); }
            else if (pontos >= 100) { nivel = "Operador Elite"; larguraBarra = 80; }
            else if (pontos >= 50) { nivel = "Veterano"; larguraBarra = 50; }

            document.getElementById('textoRanking').innerText = `Patente: ${nivel}`;
            document.getElementById('barraProgresso').style.width = `${larguraBarra}%`;

            const listaHistorico = document.getElementById('listaHistorico');
            listaHistorico.innerHTML = "";
            [...dataValida].reverse().forEach(registro => {
                let statusCor = registro.atrasado ? "atraso" : "";
                let statusTexto = registro.atrasado ? "Atrasado" : "No Horário";
                listaHistorico.innerHTML += `
                    <div class="item-historico ${statusCor}">
                        <div><div class="detalhe">${registro.data_aula.split('-').reverse().join('/')} às ${registro.horario}</div><div class="data">${statusTexto}</div></div>
                        <div class="detalhe" style="font-size: 20px;">${registro.humor.split(' ')[0]}</div>
                    </div>`;
            });
        }
    } catch (error) { console.log("Erro ao buscar stats."); }
}

// ========================================================
// 🏆 MOTOR DE GAMIFICAÇÃO: LEADERBOARD DA TURMA (RESTAURADO)
// ========================================================
async function abrirRanking() {
    if (!turmaAluno) return mostrarAlertaNativo("Sua turma não está identificada!", "#ff4a4a");

    const modal = document.getElementById('modalRanking');
    const lista = document.getElementById('listaRanking');
    
    modal.style.display = 'flex';
    document.getElementById('rankingTurmaNome').innerText = turmaAluno;
    lista.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 20px;">Calculando patentes da turma... <br><br><i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: var(--accent-blue);"></i></p>';

    try {
        const { data, error } = await supabaseClient.from('chamadas').select('nome, atrasado, horario, humor').eq('turma', turmaAluno);

        if (error) throw error;

        // Filtra para não ranquear quem ainda está no Lobby hoje
        const dadosValidos = data.filter(d => d.humor !== 'ESPERANDO_DUPLA');

        if (!dadosValidos || dadosValidos.length === 0) {
            lista.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Nenhum dado encontrado para a sua turma.</p>';
            return;
        }

        const statsDosAlunos = {};
        
        dadosValidos.forEach(reg => {
            if (!statsDosAlunos[reg.nome]) {
                statsDosAlunos[reg.nome] = { total: 0, noHorario: 0, somaMinutos: 0 };
            }
            statsDosAlunos[reg.nome].total++;
            if (!reg.atrasado) statsDosAlunos[reg.nome].noHorario++;
            
            if (reg.horario) {
                const [h, m] = reg.horario.split(':').map(Number);
                statsDosAlunos[reg.nome].somaMinutos += (h * 60 + m);
            }
        });

        const rankingArray = Object.keys(statsDosAlunos).map(nome => {
            const stats = statsDosAlunos[nome];
            const pontos = (stats.total * 10) + (stats.noHorario * 5);
            const pontualidade = Math.round((stats.noHorario / stats.total) * 100);
            return { nome, pontos, pontualidade, somaMinutos: stats.somaMinutos };
        });

        rankingArray.sort((a, b) => {
            if (b.pontos !== a.pontos) return b.pontos - a.pontos; 
            if (b.pontualidade !== a.pontualidade) return b.pontualidade - a.pontualidade; 
            return a.somaMinutos - b.somaMinutos; 
        });

        const top5 = rankingArray.slice(0, 5);
        lista.innerHTML = "";

        top5.forEach((aluno, index) => {
            let medalha = "";
            let corBorda = "var(--glass-border)";
            let destaqueNome = "";

            if (index === 0) { medalha = "🥇"; corBorda = "gold"; destaqueNome = "color: gold;"; }
            else if (index === 1) { medalha = "🥈"; corBorda = "silver"; destaqueNome = "color: silver;";}
            else if (index === 2) { medalha = "🥉"; corBorda = "#cd7f32"; destaqueNome = "color: #cd7f32;";}
            else { medalha = `<span style="color: var(--text-muted); font-size: 16px;">${index + 1}º</span>`; }

            let partesNome = aluno.nome.split(' ');
            let nomeFormatado = partesNome[0];
            if (partesNome.length > 1) nomeFormatado += " " + partesNome[1];

            let classeIsMe = (aluno.nome === nomeAluno) ? "background: rgba(6, 182, 212, 0.15); border-left: 4px solid var(--accent-blue);" : `border-left: 2px solid ${corBorda};`;
            let euTag = (aluno.nome === nomeAluno) ? `<span style="font-size: 10px; background: var(--accent-blue); padding: 2px 6px; border-radius: 4px; color: #fff; margin-left: 5px;">VOCÊ</span>` : "";

            lista.innerHTML += `
                <div class="item-historico" style="${classeIsMe}">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 24px; width: 30px; text-align: center;">${medalha}</div>
                        <div>
                            <div class="detalhe" style="font-weight: 700; ${destaqueNome}">${nomeFormatado} ${euTag}</div>
                            <div class="data">Precisão: ${aluno.pontualidade}%</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div class="detalhe" style="color: var(--accent-blue); font-weight: 800;">${aluno.pontos}</div>
                        <div class="data">XP</div>
                    </div>
                </div>
            `;
        });

        const minhaPosicaoIndex = rankingArray.findIndex(a => a.nome === nomeAluno);
        if (minhaPosicaoIndex > 4) {
            const meuStatus = rankingArray[minhaPosicaoIndex];
            lista.innerHTML += `
                <div style="text-align: center; color: var(--text-muted); font-size: 14px; margin: 15px 0;">...</div>
                <div class="item-historico" style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #EF4444;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 16px; font-weight: bold; color: #EF4444; width: 30px; text-align: center;">${minhaPosicaoIndex + 1}º</div>
                        <div>
                            <div class="detalhe" style="font-weight: 700; color: #EF4444;">Sua Posição</div>
                            <div class="data" style="color: #EF4444;">Precisão: ${meuStatus.pontualidade}%</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div class="detalhe" style="color: #EF4444; font-weight: 800;">${meuStatus.pontos}</div>
                        <div class="data" style="color: #EF4444;">XP</div>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error(error);
        lista.innerHTML = '<p style="text-align:center; color: #ff4a4a;">Falha de comunicação com a inteligência central.</p>';
    }
}

function fecharRanking() {
    document.getElementById('modalRanking').style.display = 'none';
}
// ========================================================

function resetarBotaoPresenca(btn) { btn.disabled = false; btn.innerHTML = 'Marcar presença <i class="fa-solid fa-location-dot"></i>'; }

async function tentarPresenca() {
    const btnValidar = document.getElementById('btnValidar');
    btnValidar.disabled = true;
    btnValidar.innerHTML = 'Conectando ao Lobby... <i class="fa-solid fa-spinner fa-spin"></i>';

    const { data: evento } = await supabaseClient.from('eventos').select('pin_atual').eq('id', 1).single();

    if (evento.pin_atual === "FECHADO") {
        mostrarAlertaNativo("A chamada já foi encerrada!", "#ff4a4a");
        resetarBotaoPresenca(btnValidar);
        return;
    }

    const agora = new Date();
    const dataAula = agora.toISOString().split('T')[0];

    const { data: presenca } = await supabaseClient.from('chamadas').select('id, humor').eq('nome', nomeAluno).eq('data_aula', dataAula);
    
    if (presenca && presenca.length > 0) {
        if (presenca[0].humor === "ESPERANDO_DUPLA") {
            mostrarAlertaNativo("Você já está no Lobby! Aguarde o sorteio da professora.", "#fba94c");
            btnValidar.innerHTML = 'No Lobby... <i class="fa-solid fa-hourglass-half"></i>';
        } else {
            mostrarAlertaNativo("Presença já confirmada hoje!", "#00e676");
            btnValidar.innerHTML = 'Presença Confirmada <i class="fa-solid fa-check"></i>';
        }
        return; 
    }

    if (evento.pin_atual === "LOBBY") {
        const { error } = await supabaseClient.from('chamadas').insert([
            { nome: nomeAluno, turma: turmaAluno, data_aula: dataAula, horario: "00:00", atrasado: false, humor: "ESPERANDO_DUPLA" }
        ]);

        if (error) {
            mostrarAlertaNativo("Erro na conexão.", "#ff4a4a");
            resetarBotaoPresenca(btnValidar);
        } else {
            mostrarAlertaNativo("Você entrou no Lobby! Aguarde a formação de duplas.", "#fba94c");
            btnValidar.innerHTML = 'Aguardando Dupla <i class="fa-solid fa-clock"></i>';
        }
    } else if (evento.pin_atual.startsWith("[")) {
        mostrarAlertaNativo("O sorteio já aconteceu! Fale com a professora.", "#ff4a4a");
        resetarBotaoPresenca(btnValidar);
    }
}

// 🔥 RADAR TÁTICO
async function radarGeral() {
    if (!nomeAluno) return;
    try {
        const { data: evento } = await supabaseClient.from('eventos').select('*').eq('id', 1).single();
        
        if (evento && evento.versao_app && evento.versao_app !== versaoLocal) {
            document.getElementById('versaoTexto').innerText = evento.versao_app;
            document.getElementById('notasTexto').innerHTML = evento.patch_notes.replace(/\n/g, '<br><br>');
            document.getElementById('modalPatchNotes').style.display = 'flex';
            localStorage.setItem('versaoCebrac', evento.versao_app);
            versaoLocal = evento.versao_app;
        }

        if (evento && evento.pin_atual.startsWith("[")) {
            const dataAula = new Date().toISOString().split('T')[0];
            const { data: minhaFicha } = await supabaseClient.from('chamadas').select('humor').eq('nome', nomeAluno).eq('data_aula', dataAula);
            
            if (minhaFicha && minhaFicha.length > 0 && minhaFicha[0].humor === "ESPERANDO_DUPLA") {
                const duplasSorteadas = JSON.parse(evento.pin_atual);
                const meuEsquadrao = duplasSorteadas.find(d => d.integrantes.includes(nomeAluno));
                
                if (meuEsquadrao) {
                    mostrarPainelCriptografia(meuEsquadrao);
                }
            }
        } else {
            const painel = document.getElementById('painelDupla');
            if (painel && evento.pin_atual === "FECHADO") painel.style.display = 'none';
        }

    } catch (e) { console.log("Radar de Rede: Aguardando..."); }
}

setInterval(radarGeral, 3000);

// 🔥 INTERFACE DINÂMICA
function mostrarPainelCriptografia(esquadrao) {
    let painel = document.getElementById('painelDupla');
    
    if (painel && painel.style.display === 'flex') {
        return; 
    }

    if (!painel) {
        painel = document.createElement('div');
        painel.id = 'painelDupla';
        painel.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(8, 8, 10, 0.95); backdrop-filter: blur(10px); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px;";
        document.body.appendChild(painel);
    }
    
    painel.style.display = 'flex';

    let souIndex = esquadrao.integrantes.indexOf(nomeAluno);
    let parceiros = esquadrao.integrantes.filter(n => n !== nomeAluno).join(', ');
    let codigoExibido = "";

    if (esquadrao.integrantes.length === 2) {
        codigoExibido = souIndex === 0 ? esquadrao.codigo.substring(0,2) + " _ _" : "_ _ " + esquadrao.codigo.substring(2,4);
    } else if (esquadrao.integrantes.length === 3) {
        if(souIndex === 0) codigoExibido = esquadrao.codigo.substring(0,2) + " _ _ _ _";
        if(souIndex === 1) codigoExibido = "_ _ " + esquadrao.codigo.substring(2,4) + " _ _";
        if(souIndex === 2) codigoExibido = "_ _ _ _ " + esquadrao.codigo.substring(4,6);
    } else {
         codigoExibido = esquadrao.codigo; 
    }

    // 🔥 CORREÇÃO: O Botão agora usa o Hex Code puro (#00e676) para garantir que seja verde luminoso e legível
    painel.innerHTML = `
        <h2 style="color:var(--amarelo-neon); margin-bottom:15px; font-weight: 800; font-size: 22px;"><i class="fa-solid fa-user-secret"></i> ALERTA DE MISSÃO</h2>
        <p style="text-align:center; margin-bottom:5px; color:var(--texto-mudo);">Encontre a sua dupla na sala:</p>
        <p style="text-align:center; margin-bottom:30px; font-size: 20px; font-weight: 700; color: #fff;">${parceiros}</p>
        
        <p style="font-size:12px; color:var(--texto-mudo); margin-bottom:5px; text-transform: uppercase; letter-spacing: 2px;">Sua parte do código (Apenas leitura):</p>
        
        <div style="font-size:55px; letter-spacing:8px; font-weight:900; margin-bottom:30px; color: var(--accent-blue); text-shadow: 0 0 20px rgba(6, 182, 212, 0.4);">${codigoExibido}</div>
        
        <p style="font-size:14px; color:var(--texto-mudo); margin-bottom:15px; text-align: center;">Juntem as partes para formar código final:</p>
        
        <input type="number" id="inputCodigoDupla" maxlength="${esquadrao.codigo.length}" style="background:rgba(255,255,255,0.05); border:2px solid var(--amarelo-neon); color:#fff; font-size:28px; text-align:center; padding:15px; border-radius:12px; width:250px; margin-bottom:20px; outline: none; box-shadow: 0 0 15px rgba(251, 169, 76, 0.2);" placeholder="Ex: 1243">
        
        <button class="btn-acao" onclick="validarCodigoFinal('${esquadrao.codigo}')" style="background:#00e676; color:#000; font-size: 16px; padding: 15px 0; border: none; width:250px; justify-content:center; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; border-radius: 12px; cursor: pointer;"><i class="fa-solid fa-unlock-keyhole"></i> Descriptografar</button>
        
    `;
}

async function validarCodigoFinal(codigoReal) {
    const input = document.getElementById('inputCodigoDupla').value;
    if (input === codigoReal) {
        const btn = document.querySelector('#painelDupla button');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validando...';
        
        const humorReal = document.getElementById('humorAluno').value;
        const agora = new Date();
        const horarioFormatado = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;

        await supabaseClient.from('chamadas').update({
            humor: humorReal,
            horario: horarioFormatado
        }).eq('nome', nomeAluno).eq('data_aula', agora.toISOString().split('T')[0]);

        document.getElementById('painelDupla').style.display = 'none';
        somLevelUp.play();
        mostrarAlertaNativo("Criptografia Quebrada! Presença Confirmada.", "#00e676");
        document.getElementById('btnValidar').innerHTML = 'Presença Confirmada <i class="fa-solid fa-check"></i>';
        calcularEstatisticas();
    } else {
        mostrarAlertaNativo("Código Incorreto! Fale com sua dupla.", "#ff4a4a");
    }
}

// Lógicas de UI Dev
function cliqueDev() { const p = document.getElementById('painelHacker'); p.style.display = p.style.display === 'none' ? 'block' : 'none'; }
async function dispararAtualizacaoDev() {
    const v = document.getElementById('devVersao').value;
    const n = document.getElementById('devNotas').value;
    if(!v || !n) return;
    await supabaseClient.from('eventos').update({ versao_app: v, patch_notes: n }).eq('id', 1);
    mostrarAlertaNativo("Patch lançado!", "#00e676");
    document.getElementById('painelHacker').style.display = 'none';
}
function fecharPatchNotes() { document.getElementById('modalPatchNotes').style.display = 'none'; window.location.reload(true); }
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js'); }); }