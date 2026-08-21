// ==========================================
// LeoSpotter - V1
// ==========================================

// Dados temporários para teste.
// Posteriormente serão substituídos pela
// consulta à base RAB/ANAC.

const aeronavesTeste = {

    "PS-BZR": {
        matricula: "PS-BZR",
        fabricante: "A definir",
        modelo: "A consultar na base RAB/ANAC",
        ano: "—",
        operador: "A consultar"
    }

};


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
// PESQUISA
// ==========================================

function pesquisarAeronave() {

    const matricula =
        campoMatricula.value
            .trim()
            .toUpperCase();

    // Limpa os resultados anteriores
    resultado.classList.add("hidden");
    naoEncontrada.classList.add("hidden");


    // Não pesquisar vazio
    if (!matricula) {

        campoMatricula.focus();

        return;
    }


    // Pesquisa nos dados de teste
    const aeronave =
        aeronavesTeste[matricula];


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
    ).textContent = aeronave.matricula;


    document.getElementById(
        "resultadoModelo"
    ).textContent = aeronave.modelo;


    document.getElementById(
        "fabricante"
    ).textContent = aeronave.fabricante;


    document.getElementById(
        "modelo"
    ).textContent = aeronave.modelo;


    document.getElementById(
        "ano"
    ).textContent = aeronave.ano;


    document.getElementById(
        "operador"
    ).textContent = aeronave.operador;


    resultado.classList.remove("hidden");

    resultado.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ==========================================
// NÃO ENCONTRADA
// ==========================================

function mostrarNaoEncontrada(matricula) {

    document.getElementById(
        "matriculaNaoEncontrada"
    ).textContent = matricula;


    naoEncontrada.classList.remove("hidden");

    naoEncontrada.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// ==========================================
// EVENTOS
// ==========================================

btnPesquisar.addEventListener(
    "click",
    pesquisarAeronave
);


campoMatricula.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            pesquisarAeronave();

        }

    }
);


// ==========================================
// CONTADORES INICIAIS
// ==========================================

// Por enquanto estão zerados.
// Posteriormente serão carregados
// do banco de dados.

document.getElementById(
    "totalAeronaves"
).textContent = "0";


document.getElementById(
    "totalFotos"
).textContent = "0";
