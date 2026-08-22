// ==========================================
// LeoSpotter
// Pesquisa de aeronaves + Acervo fotográfico
// Base RAB / ANAC
// ==========================================


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
// CARREGAR BASE RAB
// ==========================================

async function carregarAeronaves() {

    try {

        const resposta = await fetch(
            "data/aeronaves.json"
        );


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível carregar a base."
            );

        }


        aeronaves = await resposta.json();


        console.log(
            `Base carregada: ${aeronaves.length} aeronave(s)`
        );


        const totalAeronaves =
            document.getElementById(
                "totalAeronaves"
            );


        if (totalAeronaves) {

            totalAeronaves.textContent =
                aeronaves.length.toLocaleString(
                    "pt-BR"
                );

        }


    } catch (erro) {

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


    resultado.classList.add(
        "hidden"
    );

    naoEncontrada.classList.add(
        "hidden"
    );


    if (!matricula) {

        campoMatricula.focus();

        return;

    }


    const aeronave =
        aeronaves.find(
            function(item) {

                return normalizarMatricula(
                    item.matricula
                ) === matricula;

            }
        );


    if (aeronave) {

        mostrarAeronave(
            aeronave
        );

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

    // Guarda a aeronave atualmente pesquisada

    aeronaveAtual = aeronave;


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


    // Carrega fotos dessa matrícula

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

function mostrarNaoEncontrada(
    matricula
) {

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
// BOTÃO PESQUISAR
// ==========================================

btnPesquisar.addEventListener(
    "click",
    pesquisarAeronave
);


// ==========================================
// TECLA ENTER
// ==========================================

campoMatricula.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            pesquisarAeronave();

        }

    }
);


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


const totalFotos =
    document.getElementById(
        "totalFotos"
    );


// ==========================================
// ABRIR FORMULÁRIO
// ==========================================

if (btnAdicionarFoto) {

    btnAdicionarFoto.addEventListener(
        "click",
        function() {

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
// CANCELAR
// ==========================================

if (btnCancelarFoto) {

    btnCancelarFoto.addEventListener(
        "click",
        function() {

            limparFormularioFoto();

        }
    );

}


// ==========================================
// PREVISUALIZAÇÃO DA FOTO
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

                local:
                    campoLocalFoto.value
                        .trim(),

                observacao:
                    campoObservacaoFoto.value
                        .trim()

            };


            fotosAeronave.push(
                novaFoto
            );


            salvarFotosNoNavegador();


            atualizarFotos();


            limparFormularioFoto();

        };


    leitor.readAsDataURL(
        arquivo
    );

}


// ==========================================
// CHAVE DO LOCALSTORAGE
// ==========================================

function obterChaveFotos(
    matricula
) {

    return (
        "leospotter_fotos_" +
        normalizarMatricula(
            matricula
        )
    );

}


// ==========================================
// CARREGAR FOTOS
// ==========================================

function carregarFotosAeronave(
    matricula
) {

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
// SALVAR NO NAVEGADOR
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
// ATUALIZAR CONTADORES
// ==========================================

function atualizarFotos() {

    const quantidade =
        fotosAeronave.length;


    if (contadorFotos) {

        contadorFotos.textContent =
            quantidade +
            (
                quantidade === 1
                    ? " foto"
                    : " fotos"
            );

    }


    if (totalFotos) {

        totalFotos.textContent =
            calcularTotalFotos()
                .toLocaleString(
                    "pt-BR"
                );

    }


    // Por enquanto apenas alternamos
    // entre "sem fotos" e o formulário.
    // A galeria será criada na próxima etapa.

    if (quantidade === 0) {

        if (semFotos) {

            semFotos.classList.remove(
                "hidden"
            );

        }

    }

    else {

        if (semFotos) {

            semFotos.classList.add(
                "hidden"
            );

        }

    }

}


// ==========================================
// TOTAL DE FOTOS DO LEO SPOTTER
// ==========================================

function calcularTotalFotos() {

    let total = 0;


    try {

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const chave =
                localStorage.key(i);


            if (
                chave &&
                chave.startsWith(
                    "leospotter_fotos_"
                )
            ) {

                const dados =
                    localStorage.getItem(
                        chave
                    );


                if (dados) {

                    const fotos =
                        JSON.parse(
                            dados
                        );


                    if (
                        Array.isArray(
                            fotos
                        )
                    ) {

                        total +=
                            fotos.length;

                    }

                }

            }

        }

    }

    catch (erro) {

        console.error(
            "Erro ao calcular fotos:",
            erro
        );

    }


    return total;

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


    if (semFotos && fotosAeronave.length === 0) {

        semFotos.classList.remove(
            "hidden"
        );

    }

}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

carregarAeronaves();
