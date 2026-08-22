// ==========================================
// LeoSpotter
// Pesquisa de aeronaves + Acervo fotográfico
// Base RAB / ANAC
//
// VERSÃO: 1.1.1
// ==========================================

const VERSAO_SITE = "1.1.1";


// ==========================================
// VARIÁVEIS
// ==========================================

let aeronaves = [];
let aeronaveAtual = null;
let fotosAeronave = [];


// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const campoMatricula =
    document.getElementById("matricula");

const btnPesquisar =
    document.getElementById("btnPesquisar");

const resultado =
    document.getElementById("resultado");

const naoEncontrada =
    document.getElementById("naoEncontrada");


// ==========================================
// ELEMENTOS DAS ESTATÍSTICAS
// ==========================================

const totalFotos =
    document.getElementById("totalFotos");

const aeronavesComFotos =
    document.getElementById("aeronavesComFotos");


// ==========================================
// VERSÃO DO SITE
// ==========================================

function atualizarVersaoSite() {

    const elemento =
        document.getElementById("versaoSite");

    if (elemento) {

        elemento.textContent =
            `v${VERSAO_SITE}`;

    }

}


// ==========================================
// CARREGAR BASE RAB
// ==========================================

async function carregarAeronaves() {

    try {

        const resposta =
            await fetch("data/aeronaves.json");

        if (!resposta.ok) {

            throw new Error(
                "Não foi possível carregar a base de aeronaves."
            );

        }

        aeronaves =
            await resposta.json();

        console.log(
            `Base carregada: ${aeronaves.length} aeronave(s)`
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar base:",
            erro
        );

    }

}


// ==========================================
// NORMALIZAR MATRÍCULA
// ==========================================

function normalizarMatricula(matricula) {

    return matricula
        .trim()
        .toUpperCase()
        .replace(/-/g, "");

}


// ==========================================
// PESQUISAR AERONAVE
// ==========================================

function pesquisarAeronave() {

    const matriculaDigitada =
        campoMatricula.value;

    const matricula =
        normalizarMatricula(
            matriculaDigitada
        );


    resultado.classList.add("hidden");

    naoEncontrada.classList.add("hidden");


    if (!matricula) {

        campoMatricula.focus();

        return;

    }


    const aeronave =
        aeronaves.find(
            function(item) {

                return normalizarMatricula(
                    item.matricula || ""
                ) === matricula;

            }
        );


    if (aeronave) {

        mostrarAeronave(aeronave);

    }

    else {

        mostrarNaoEncontrada(
            matriculaDigitada
                .trim()
                .toUpperCase()
        );

    }

}


// ==========================================
// MOSTRAR AERONAVE
// ==========================================

function mostrarAeronave(aeronave) {

    aeronaveAtual =
        aeronave;


    document.getElementById(
        "resultadoMatricula"
    ).textContent =
        aeronave.matricula || "—";


    document.getElementById(
        "resultadoModelo"
    ).textContent =
        aeronave.modelo || "—";


    document.getElementById(
        "fabricante"
    ).textContent =
        aeronave.fabricante || "—";


    document.getElementById(
        "modelo"
    ).textContent =
        aeronave.modelo || "—";


    document.getElementById(
        "numeroSerie"
    ).textContent =
        aeronave.numero_serie || "—";


    document.getElementById(
        "ano"
    ).textContent =
        aeronave.ano_fabricacao || "—";


    document.getElementById(
        "tipoIcao"
    ).textContent =
        aeronave.tipo_icao || "—";


    document.getElementById(
        "situacao"
    ).textContent =
        aeronave.situacao || "—";


    carregarFotosAeronave(
        aeronave.matricula
    );


    resultado.classList.remove(
        "hidden"
    );


    resultado.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ==========================================
// AERONAVE NÃO ENCONTRADA
// ==========================================

function mostrarNaoEncontrada(matricula) {

    document.getElementById(
        "matriculaNaoEncontrada"
    ).textContent =
        matricula;


    naoEncontrada.classList.remove(
        "hidden"
    );


    naoEncontrada.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// ==========================================
// EVENTOS DA PESQUISA
// ==========================================

if (btnPesquisar) {

    btnPesquisar.addEventListener(
        "click",
        pesquisarAeronave
    );

}


if (campoMatricula) {

    campoMatricula.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                pesquisarAeronave();

            }

        }
    );

}


// ==========================================
// ELEMENTOS DO ACERVO
// ==========================================

const btnAdicionarFoto =
    document.getElementById(
        "btnAdicionarFoto"
    );

const formularioFoto =
    document.getElementById(
        "formularioFoto"
    );

const btnCancelarFoto =
    document.getElementById(
        "btnCancelarFoto"
    );

const btnSalvarFoto =
    document.getElementById(
        "btnSalvarFoto"
    );

const campoFoto =
    document.getElementById(
        "foto"
    );

const campoDataFoto =
    document.getElementById(
        "dataFoto"
    );

const campoLocalFoto =
    document.getElementById(
        "localFoto"
    );

const campoObservacaoFoto =
    document.getElementById(
        "observacaoFoto"
    );

const previewFoto =
    document.getElementById(
        "previewFoto"
    );

const imagemPreview =
    document.getElementById(
        "imagemPreview"
    );

const semFotos =
    document.getElementById(
        "semFotos"
    );

const contadorFotos =
    document.getElementById(
        "contadorFotos"
    );


// ==========================================
// ABRIR FORMULÁRIO
// ==========================================

if (btnAdicionarFoto) {

    btnAdicionarFoto.addEventListener(
        "click",
        function() {

            if (!aeronaveAtual) {

                alert(
                    "Pesquise uma aeronave primeiro."
                );

                return;

            }


            formularioFoto.classList.remove(
                "hidden"
            );


            semFotos.classList.add(
                "hidden"
            );


            campoFoto.focus();

        }
    );

}


// ==========================================
// CANCELAR FORMULÁRIO
// ==========================================

if (btnCancelarFoto) {

    btnCancelarFoto.addEventListener(
        "click",
        limparFormularioFoto
    );

}


// ==========================================
// CAMPO ICAO
// ==========================================

if (campoLocalFoto) {

    campoLocalFoto.addEventListener(
        "input",
        function() {

            campoLocalFoto.value =
                campoLocalFoto.value
                    .toUpperCase()
                    .replace(
                        /[^A-Z]/g,
                        ""
                    )
                    .substring(
                        0,
                        4
                    );

        }
    );

}


// ==========================================
// PREVIEW DA FOTO
// ==========================================

if (campoFoto) {

    campoFoto.addEventListener(
        "change",
        function() {

            const arquivo =
                campoFoto.files[0];


            if (!arquivo) {

                previewFoto.classList.add(
                    "hidden"
                );

                return;

            }


            const leitor =
                new FileReader();


            leitor.onload =
                function(event) {

                    imagemPreview.src =
                        event.target.result;


                    previewFoto.classList.remove(
                        "hidden"
                    );

                };


            leitor.readAsDataURL(
                arquivo
            );

        }
    );

}


// ==========================================
// SALVAR FOTO
// ==========================================

if (btnSalvarFoto) {

    btnSalvarFoto.addEventListener(
        "click",
        salvarFoto
    );

}


function salvarFoto() {

    if (!aeronaveAtual) {

        alert(
            "Pesquise uma aeronave primeiro."
        );

        return;

    }


    const arquivo =
        campoFoto.files[0];


    if (!arquivo) {

        alert(
            "Selecione uma fotografia."
        );

        campoFoto.focus();

        return;

    }


    const icao =
        campoLocalFoto.value
            .trim()
            .toUpperCase();


    if (!/^[A-Z]{4}$/.test(icao)) {

        alert(
            "Informe um código ICAO válido com 4 letras.\n\nExemplo: SBUR"
        );

        campoLocalFoto.focus();

        return;

    }


    const leitor =
        new FileReader();


    leitor.onload =
        function(event) {

            const novaFoto = {

                id:
                    Date.now(),

                matricula:
                    aeronaveAtual.matricula,

                imagem:
                    event.target.result,

                data:
                    campoDataFoto.value,

                icao:
                    icao,

                observacao:
                    campoObservacaoFoto.value
                        .trim()

            };


            fotosAeronave.push(
                novaFoto
            );


            try {

                salvarFotosNoNavegador();

            }

            catch (erro) {

                console.error(
                    "Erro ao salvar fotografia:",
                    erro
                );


                fotosAeronave.pop();


                alert(
                    "A fotografia é grande demais para o armazenamento do navegador."
                );

                return;

            }


            atualizarFotos();

            atualizarEstatisticasFotos();

            limparFormularioFoto();


            alert(
                "Fotografia adicionada com sucesso!"
            );

        };


    leitor.onerror =
        function() {

            alert(
                "Não foi possível ler a fotografia."
            );

        };


    leitor.readAsDataURL(
        arquivo
    );

}


// ==========================================
// CHAVE DO LOCALSTORAGE
// ==========================================

function obterChaveFotos(matricula) {

    return (
        "leospotter_fotos_" +
        normalizarMatricula(
            matricula
        )
    );

}


// ==========================================
// CARREGAR FOTOS DA AERONAVE
// ==========================================

function carregarFotosAeronave(matricula) {

    const chave =
        obterChaveFotos(
            matricula
        );


    const dados =
        localStorage.getItem(
            chave
        );


    if (dados) {

        try {

            fotosAeronave =
                JSON.parse(
                    dados
                );


            if (!Array.isArray(fotosAeronave)) {

                fotosAeronave = [];

            }

        }

        catch (erro) {

            console.error(
                "Erro ao carregar fotos:",
                erro
            );

            fotosAeronave = [];

        }

    }

    else {

        fotosAeronave = [];

    }


    atualizarFotos();

}


// ==========================================
// SALVAR FOTOS
// ==========================================

function salvarFotosNoNavegador() {

    if (!aeronaveAtual) {

        return;

    }


    const chave =
        obterChaveFotos(
            aeronaveAtual.matricula
        );


    localStorage.setItem(
        chave,
        JSON.stringify(
            fotosAeronave
        )
    );

}


// ==========================================
// ATUALIZAR GALERIA
// ==========================================

function atualizarFotos() {

    const quantidade =
        fotosAeronave.length;


    if (contadorFotos) {

        contadorFotos.textContent =
            quantidade === 1
                ? "1 foto"
                : `${quantidade} fotos`;

    }


    if (quantidade === 0) {

        if (semFotos) {

            semFotos.classList.remove(
                "hidden"
            );

        }


        removerGaleria();

        return;

    }


    if (semFotos) {

        semFotos.classList.add(
            "hidden"
        );

    }


    criarGaleria();

}


// ==========================================
// ESTATÍSTICAS DO ACERVO
// ==========================================

function atualizarEstatisticasFotos() {

    let total = 0;

    const matriculasComFotos =
        new Set();


    try {

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const chave =
                localStorage.key(i);


            if (
                !chave ||
                !chave.startsWith(
                    "leospotter_fotos_"
                )
            ) {

                continue;

            }


            const dados =
                localStorage.getItem(
                    chave
                );


            if (!dados) {

                continue;

            }


            try {

                const fotos =
                    JSON.parse(
                        dados
                    );


                if (
                    !Array.isArray(
                        fotos
                    )
                ) {

                    continue;

                }


                if (
                    fotos.length === 0
                ) {

                    continue;

                }


                total +=
                    fotos.length;


                const matricula =
                    chave.replace(
                        "leospotter_fotos_",
                        ""
                    );


                matriculasComFotos.add(
                    matricula
                );

            }

            catch (erroFoto) {

                console.warn(
                    "Registro de fotos inválido:",
                    chave,
                    erroFoto
                );

            }

        }

    }

    catch (erro) {

        console.error(
            "Erro ao calcular estatísticas:",
            erro
        );

    }


    const quantidadeAeronaves =
        matriculasComFotos.size;


    if (aeronavesComFotos) {

        aeronavesComFotos.textContent =
            quantidadeAeronaves.toLocaleString(
                "pt-BR"
            );

    }


    if (totalFotos) {

        totalFotos.textContent =
            total.toLocaleString(
                "pt-BR"
            );

    }


    console.log(
        "Estatísticas:",
        {
            aeronavesComFotos:
                quantidadeAeronaves,

            totalFotos:
                total
        }
    );

}


// ==========================================
// COMPATIBILIDADE
// ==========================================

function atualizarTotalFotos() {

    atualizarEstatisticasFotos();

}


// ==========================================
// CRIAR GALERIA
// ==========================================

function criarGaleria() {

    removerGaleria();


    const galeria =
        document.createElement(
            "div"
        );


    galeria.id =
        "galeriaFotos";


    galeria.className =
        "galeria-fotos";


    fotosAeronave.forEach(
        function(foto) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "foto-card";


            const imagem =
                document.createElement(
                    "img"
                );


            imagem.src =
                foto.imagem;


            imagem.alt =
                `Fotografia ${foto.matricula}`;


            imagem.className =
                "foto-miniatura";


            imagem.loading =
                "lazy";


            imagem.addEventListener(
                "click",
                function() {

                    abrirFoto(
                        foto
                    );

                }
            );


            const informacoes =
                document.createElement(
                    "div"
                );


            informacoes.className =
                "foto-informacoes";


            const matricula =
                document.createElement(
                    "strong"
                );


            matricula.textContent =
                foto.matricula;


            const local =
                document.createElement(
                    "span"
                );


            local.className =
                "foto-icao";


            local.textContent =
                foto.icao || "—";


            const data =
                document.createElement(
                    "span"
                );


            data.className =
                "foto-data";


            data.textContent =
                formatarData(
                    foto.data
                );


            informacoes.appendChild(
                matricula
            );


            informacoes.appendChild(
                local
            );


            informacoes.appendChild(
                data
            );


            if (foto.observacao) {

                const observacao =
                    document.createElement(
                        "p"
                    );


                observacao.textContent =
                    foto.observacao;


                informacoes.appendChild(
                    observacao
                );

            }


            const excluir =
                document.createElement(
                    "button"
                );


            excluir.type =
                "button";


            excluir.className =
                "btn-excluir-foto";


            excluir.textContent =
                "Excluir";


            excluir.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();


                    excluirFoto(
                        foto.id
                    );

                }
            );


            informacoes.appendChild(
                excluir
            );


            card.appendChild(
                imagem
            );


            card.appendChild(
                informacoes
            );


            galeria.appendChild(
                card
            );

        }
    );


    const container =
        document.querySelector(
            ".minhas-fotos"
        );


    if (container) {

        container.appendChild(
            galeria
        );

    }

}


// ==========================================
// REMOVER GALERIA
// ==========================================

function removerGaleria() {

    const galeria =
        document.getElementById(
            "galeriaFotos"
        );


    if (galeria) {

        galeria.remove();

    }

}


// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data) {

    if (!data) {

        return "Data não informada";

    }


    const partes =
        data.split("-");


    if (partes.length !== 3) {

        return data;

    }


    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );

}


// ==========================================
// ABRIR FOTO
// ==========================================

function abrirFoto(foto) {

    const janela =
        document.createElement(
            "div"
        );


    janela.className =
        "visualizador-foto";


    const imagem =
        document.createElement(
            "img"
        );


    imagem.src =
        foto.imagem;


    imagem.alt =
        foto.matricula;


    janela.appendChild(
        imagem
    );


    janela.addEventListener(
        "click",
        function() {

            janela.remove();

        }
    );


    document.body.appendChild(
        janela
    );

}


// ==========================================
// EXCLUIR FOTO
// ==========================================

function excluirFoto(id) {

    const confirmar =
        confirm(
            "Deseja realmente excluir esta fotografia?"
        );


    if (!confirmar) {

        return;

    }


    fotosAeronave =
        fotosAeronave.filter(
            function(foto) {

                return foto.id !== id;

            }
        );


    salvarFotosNoNavegador();

    atualizarFotos();

    atualizarEstatisticasFotos();

}


// ==========================================
// LIMPAR FORMULÁRIO
// ==========================================

function limparFormularioFoto() {

    if (campoFoto) {

        campoFoto.value = "";

    }


    if (campoDataFoto) {

        campoDataFoto.value = "";

    }


    if (campoLocalFoto) {

        campoLocalFoto.value = "";

    }


    if (campoObservacaoFoto) {

        campoObservacaoFoto.value = "";

    }


    if (imagemPreview) {

        imagemPreview.src = "";

    }


    if (previewFoto) {

        previewFoto.classList.add(
            "hidden"
        );

    }


    if (formularioFoto) {

        formularioFoto.classList.add(
            "hidden"
        );

    }


    if (
        semFotos &&
        fotosAeronave.length === 0
    ) {

        semFotos.classList.remove(
            "hidden"
        );

    }

}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

atualizarVersaoSite();

atualizarEstatisticasFotos();

carregarAeronaves();
