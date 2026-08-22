// ==========================================
// LeoSpotter
// Pesquisa de aeronaves
// Base RAB / ANAC
// ==========================================


// ==========================================
// VARIÁVEIS
// ==========================================

let aeronaves = [];


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


        // Atualiza contador
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


    // Limpa resultados anteriores

    resultado.classList.add(
        "hidden"
    );

    naoEncontrada.classList.add(
        "hidden"
    );


    // Não pesquisar vazio

    if (!matricula) {

        campoMatricula.focus();

        return;

    }


    // Procurar aeronave

    const aeronave =
        aeronaves.find(
            function(item) {

                return normalizarMatricula(
                    item.matricula
                ) === matricula;

            }
        );


    // Encontrou

    if (aeronave) {

        mostrarAeronave(
            aeronave
        );

    }

    // Não encontrou

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

function mostrarAeronave(
    aeronave
) {

    document.getElementById(
        "resultadoMatricula"
    ).textContent =
        aeronave.matricula ||
        "—";


    document.getElementById(
        "resultadoModelo"
    ).textContent =
        aeronave.modelo ||
        "—";


    document.getElementById(
        "fabricante"
    ).textContent =
        aeronave.fabricante ||
        "—";


    document.getElementById(
        "modelo"
    ).textContent =
        aeronave.modelo ||
        "—";


    document.getElementById(
        "ano"
    ).textContent =
        aeronave.ano_fabricacao ||
        "—";


    // Neste momento utilizaremos
    // categoria neste campo.
    // Depois podemos alterar o HTML
    // para mostrar a categoria separadamente.

    document.getElementById(
        "operador"
    ).textContent =
        aeronave.categoria ||
        "—";


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
// INICIALIZAÇÃO
// ==========================================

carregarAeronaves();
