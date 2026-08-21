// ==========================================
// LeoSpotter
// Pesquisa de aeronaves
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
// CARREGAR BASE DE AERONAVES
// ==========================================

async function carregarAeronaves() {

    try {

        const resposta = await fetch(
            "data/aeronaves.json"
        );

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível carregar a base de aeronaves."
            );
        }

        aeronaves = await resposta.json();

        console.log(
            "Base de aeronaves carregada:",
            aeronaves.length
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar aeronaves:",
            erro
        );

    }

}


// ==========================================
// PESQUISAR AERONAVE
// ==========================================

function pesquisarAeronave() {

    const matricula =
        campoMatricula.value
            .trim()
            .toUpperCase();

    // Esconde resultados anteriores
    resultado.classList.add("hidden");
    naoEncontrada.classList.add("hidden");


    // Impede pesquisa vazia
    if (!matricula) {

        campoMatricula.focus();

        return;
    }


    // Procura a matrícula na base
    const aeronave = aeronaves.find(
        item =>
            item.matricula.toUpperCase() === matricula
    );


    if (aeronave) {

        mostrarAeronave(aeronave);

    } else {

        mostrarNaoEncontrada(matricula);

    }

}


// ==========================================
// MOSTRAR AERONAVE
// ==========================================

function mostrarAeronave(aeronave) {

    document.getElementById(
        "resultadoMatricula"
    ).textContent =
        aeronave.matricula;


    document.getElementById(
        "resultadoModelo"
    ).textContent =
        aeronave.modelo_comercial ||
        aeronave.modelo ||
        "Modelo não informado";


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


    document.getElementById(
        "operador"
    ).textContent =
        aeronave.categoria ||
        "—";


    resultado.classList.remove("hidden");


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


    naoEncontrada.classList.remove("hidden");


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

        if (event.key === "Enter") {

            pesquisarAeronave();

        }

    }
);


// ==========================================
// INICIALIZAÇÃO
// ==========================================

carregarAeronaves();
