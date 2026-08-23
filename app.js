// ==========================================
// LeoSpotter
// Manual de consulta para spotters
// Pesquisa de aeronaves + Acervo fotográfico
// Pesquisa inteligente de aeronaves e aeródromos
//
// VERSÃO: 1.4.0
// ==========================================

const VERSAO_SITE = "1.4.0";


// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================

let aeronaves = [];
let aeronaveAtual = null;
let fotosAeronave = [];

let aerodromos = [];


// ==========================================
// GOOGLE ANALYTICS
// ==========================================

function registrarEventoAnalytics(
    nomeEvento,
    parametros = {}
) {

    if (typeof gtag !== "function") {

        console.warn(
            "Google Analytics ainda não está disponível."
        );

        return;

    }

    gtag(
        "event",
        nomeEvento,
        parametros
    );

}


// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

// AERONAVES

const campoMatricula =
    document.getElementById("matricula");

const btnPesquisar =
    document.getElementById("btnPesquisar");

const resultado =
    document.getElementById("resultado");

const naoEncontrada =
    document.getElementById("naoEncontrada");

const sugestoesAeronaves =
    document.getElementById("sugestoesAeronaves");


// AERÓDROMOS

const campoIcao =
    document.getElementById("icao");

const btnPesquisarIcao =
    document.getElementById("btnPesquisarIcao");

const resultadoAerodromo =
    document.getElementById("resultadoAerodromo");

const aerodromoNaoEncontrado =
    document.getElementById("aerodromoNaoEncontrado");

const sugestoesAerodromos =
    document.getElementById("sugestoesAerodromos");


// ESTATÍSTICAS

const totalFotos =
    document.getElementById("totalFotos");

const aeronavesComFotos =
    document.getElementById("totalAeronaves");


// ==========================================
// VERSÃO
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
// CARREGAR BASE DE AERONAVES
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
            `Base de aeronaves carregada: ${aeronaves.length} registro(s)`
        );

        atualizarPrevisoesPesquisa();

    } catch (erro) {

        console.error(
            "Erro ao carregar base de aeronaves:",
            erro
        );

    }

}


// ==========================================
// CARREGAR BASE DE AERÓDROMOS
// ==========================================

async function carregarAerodromos() {

    try {

        const resposta =
            await fetch("data/aeroportos.json");

        if (!resposta.ok) {

            throw new Error(
                "Não foi possível carregar a base de aeródromos."
            );

        }

        aerodromos =
            await resposta.json();

        console.log(
            `Base de aeródromos carregada: ${aerodromos.length} registro(s)`
        );

        atualizarPrevisoesPesquisa();

    } catch (erro) {

        console.error(
            "Erro ao carregar base de aeródromos:",
            erro
        );

    }

}


// ==========================================
// NORMALIZAÇÃO DE MATRÍCULA
// ==========================================

function normalizarMatricula(matricula) {

    return String(matricula || "")
        .trim()
        .toUpperCase()
        .replace(/-/g, "");

}


// ==========================================
// NORMALIZAÇÃO DE TEXTO
// ==========================================

function normalizarTexto(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();

}


// ==========================================
// ESCAPAR HTML
// ==========================================

function escaparHtml(texto) {

    return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// PESQUISA DE AERONAVE
// ==========================================

function pesquisarAeronave() {

    if (!campoMatricula) {
        return;
    }

    const matriculaDigitada =
        campoMatricula.value;

    const matricula =
        normalizarMatricula(
            matriculaDigitada
        );

    fecharSugestoesAeronaves();

    if (resultado) {
        resultado.classList.add("hidden");
    }

    if (naoEncontrada) {
        naoEncontrada.classList.add("hidden");
    }

    if (!matricula) {

        campoMatricula.focus();

        return;

    }

    const aeronave =
        aeronaves.find(function(item) {

            return (
                normalizarMatricula(
                    item.matricula || ""
                ) === matricula
            );

        });


    if (aeronave) {

        registrarEventoAnalytics(
            "pesquisa_aeronave",
            {
                matricula:
                    aeronave.matricula || matricula,
                resultado:
                    "encontrado"
            }
        );

        mostrarAeronave(aeronave);

    } else {

        const matriculaPesquisa =
            matriculaDigitada
                .trim()
                .toUpperCase();

        registrarEventoAnalytics(
            "pesquisa_aeronave",
            {
                matricula:
                    matriculaPesquisa,
                resultado:
                    "nao_encontrado"
            }
        );

        mostrarNaoEncontrada(
            matriculaPesquisa
        );

    }

}


// ==========================================
// MOSTRAR AERONAVE
// ==========================================

function mostrarAeronave(aeronave) {

    aeronaveAtual =
        aeronave;


    const elementoMatricula =
        document.getElementById(
            "resultadoMatricula"
        );

    const elementoResultadoModelo =
        document.getElementById(
            "resultadoModelo"
        );


    if (elementoMatricula) {

        elementoMatricula.textContent =
            aeronave.matricula || "—";

    }


    if (elementoResultadoModelo) {

        elementoResultadoModelo.textContent =
            aeronave.modelo || "—";

    }


    const fabricante =
        document.getElementById("fabricante");

    const modelo =
        document.getElementById("modelo");

    const numeroSerie =
        document.getElementById("numeroSerie");

    const ano =
        document.getElementById("ano");

    const tipoIcao =
        document.getElementById("tipoIcao");

    const situacao =
        document.getElementById("situacao");


    if (fabricante) {

        fabricante.textContent =
            aeronave.fabricante || "—";

    }

    if (modelo) {

        modelo.textContent =
            aeronave.modelo || "—";

    }

    if (numeroSerie) {

        numeroSerie.textContent =
            aeronave.numero_serie || "—";

    }

    if (ano) {

        ano.textContent =
            aeronave.ano_fabricacao || "—";

    }

    if (tipoIcao) {

        tipoIcao.textContent =
            aeronave.tipo_icao || "—";

    }

    if (situacao) {

        situacao.textContent =
            aeronave.situacao || "—";

    }


    carregarFotosAeronave(
        aeronave.matricula
    );


    if (resultado) {

        resultado.classList.remove(
            "hidden"
        );

        resultado.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// ==========================================
// AERONAVE NÃO ENCONTRADA
// ==========================================

function mostrarNaoEncontrada(matricula) {

    const elemento =
        document.getElementById(
            "matriculaNaoEncontrada"
        );


    if (elemento) {

        elemento.textContent =
            matricula;

    }


    if (naoEncontrada) {

        naoEncontrada.classList.remove(
            "hidden"
        );

        naoEncontrada.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


// ==========================================
// PESQUISA DE AERÓDROMO
// ==========================================

function pesquisarAerodromo() {

    if (!campoIcao) {
        return;
    }


    const termoDigitado =
        campoIcao.value
            .trim()
            .toUpperCase();


    fecharSugestoesAerodromos();


    if (resultadoAerodromo) {

        resultadoAerodromo.classList.add(
            "hidden"
        );

    }

    if (aerodromoNaoEncontrado) {

        aerodromoNaoEncontrado.classList.add(
            "hidden"
        );

    }


    if (!termoDigitado) {

        campoIcao.focus();

        return;

    }


    const termo =
        normalizarTexto(
            termoDigitado
        );


    const aero =
        aerodromos.find(function(item) {

            const icao =
                normalizarTexto(
                    item.icao
                );

            const nome =
                normalizarTexto(
                    item.nome
                );

            const municipio =
                normalizarTexto(
                    item.municipio
                );

            const municipioServido =
                normalizarTexto(
                    item.municipio_servido
                );


            return (
                icao === termo ||
                nome === termo ||
                municipio === termo ||
                municipioServido === termo
            );

        });


    if (aero) {

        registrarEventoAnalytics(
            "pesquisa_aerodromo",
            {
                termo:
                    termoDigitado,
                icao:
                    aero.icao || "",
                resultado:
                    "encontrado"
            }
        );

        mostrarAerodromo(aero);

    } else {

        registrarEventoAnalytics(
            "pesquisa_aerodromo",
            {
                termo:
                    termoDigitado,
                resultado:
                    "nao_encontrado"
            }
        );


        const elemento =
            document.getElementById(
                "icaoNaoEncontrado"
            );


        if (elemento) {

            elemento.textContent =
                termoDigitado;

        }


        if (aerodromoNaoEncontrado) {

            aerodromoNaoEncontrado.classList.remove(
                "hidden"
            );

            aerodromoNaoEncontrado.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }

    }

}


// ==========================================
// MOSTRAR AERÓDROMO
// ==========================================

function mostrarAerodromo(aero) {

    const resultadoIcao =
        document.getElementById(
            "resultadoIcao"
        );

    const resultadoNome =
        document.getElementById(
            "resultadoNomeAerodromo"
        );

    const aerodromoIcao =
        document.getElementById(
            "aerodromoIcao"
        );

    const aerodromoCidade =
        document.getElementById(
            "aerodromoCidade"
        );

    const aerodromoUf =
        document.getElementById(
            "aerodromoUf"
        );

    const aerodromoElevacao =
        document.getElementById(
            "aerodromoElevacao"
        );

    const aerodromoOperacaoDiurna =
        document.getElementById(
            "aerodromoOperacaoDiurna"
        );

    const aerodromoOperacaoNoturna =
        document.getElementById(
            "aerodromoOperacaoNoturna"
        );


    if (resultadoIcao) {

        resultadoIcao.textContent =
            aero.icao || "—";

    }


    if (resultadoNome) {

        resultadoNome.textContent =
            aero.nome || "—";

    }


    if (aerodromoIcao) {

        aerodromoIcao.textContent =
            aero.icao || "—";

    }


    if (aerodromoCidade) {

        aerodromoCidade.textContent =
            aero.municipio_servido ||
            aero.municipio ||
            aero.cidade ||
            "—";

    }


    if (aerodromoUf) {

        aerodromoUf.textContent =
            aero.uf || "—";

    }


    if (aerodromoElevacao) {

        aerodromoElevacao.textContent =
            aero.elevacao ||
            aero.elevacao_m ||
            aero.elevation ||
            "—";

    }


    if (aerodromoOperacaoDiurna) {

        aerodromoOperacaoDiurna.textContent =
            aero.operacao_diurna ||
            "—";

    }


    if (aerodromoOperacaoNoturna) {

        aerodromoOperacaoNoturna.textContent =
            aero.operacao_noturna ||
            "—";

    }


    // ======================================
    // PISTAS
    // ======================================

    const listaPistas =
        document.getElementById(
            "listaPistas"
        );


    if (listaPistas) {

        listaPistas.innerHTML = "";


        if (
            Array.isArray(aero.pistas) &&
            aero.pistas.length > 0
        ) {

            aero.pistas.forEach(
                function(pista) {

                    const card =
                        document.createElement(
                            "div"
                        );

                    card.className =
                        "pista-card";


                    card.innerHTML = `

                        <strong>
                            Pista ${escaparHtml(
                                pista.identificacao || "—"
                            )}
                        </strong>

                        <div class="pista-dados">

                            <div class="pista-dado">
                                <span>Piso</span>
                                <strong>
                                    ${escaparHtml(
                                        pista.piso || "—"
                                    )}
                                </strong>
                            </div>

                            <div class="pista-dado">
                                <span>Dimensões</span>
                                <strong>
                                    ${escaparHtml(
                                        pista.dimensoes || "—"
                                    )}
                                </strong>
                            </div>

                            <div class="pista-dado">
                                <span>Resistência</span>
                                <strong>
                                    ${escaparHtml(
                                        pista.resistencia || "—"
                                    )}
                                </strong>
                            </div>

                        </div>

                    `;


                    listaPistas.appendChild(
                        card
                    );

                }
            );

        } else {

            listaPistas.innerHTML =
                `<p class="dados-indisponiveis">
                    Nenhuma pista encontrada.
                </p>`;

        }

    }


    // ======================================
    // DISTÂNCIAS
    // ======================================

    const listaDistancias =
        document.getElementById(
            "listaDistancias"
        );


    if (listaDistancias) {

        listaDistancias.innerHTML = "";


        if (
            Array.isArray(aero.distancias) &&
            aero.distancias.length > 0
        ) {

            aero.distancias.forEach(
                function(dist) {

                    const p =
                        document.createElement(
                            "p"
                        );

                    p.textContent =
                        dist;

                    listaDistancias.appendChild(
                        p
                    );

                }
            );

        } else {

            listaDistancias.innerHTML =
                `<p class="dados-indisponiveis">
                    Nenhuma distância declarada encontrada.
                </p>`;

        }

    }


    // ======================================
    // FREQUÊNCIAS
    // ======================================

    const listaFrequencias =
        document.getElementById(
            "listaFrequencias"
        );


    if (listaFrequencias) {

        listaFrequencias.innerHTML = "";


        if (
            Array.isArray(aero.frequencias) &&
            aero.frequencias.length > 0
        ) {

            aero.frequencias.forEach(
                function(freq) {

                    const card =
                        document.createElement(
                            "div"
                        );

                    card.className =
                        "frequencia-card";


                    card.innerHTML = `

                        <strong>
                            ${escaparHtml(
                                freq.orgao || "—"
                            )}
                        </strong>

                        <span class="frequencia-valor">
                            ${escaparHtml(
                                freq.valor || "—"
                            )}
                        </span>

                        <small>
                            ${escaparHtml(
                                freq.observacao ||
                                "Operação padrão"
                            )}
                        </small>

                    `;


                    listaFrequencias.appendChild(
                        card
                    );

                }
            );

        } else {

            listaFrequencias.innerHTML =
                `<p class="dados-indisponiveis">
                    Nenhuma frequência encontrada.
                </p>`;

        }

    }


    if (resultadoAerodromo) {

        resultadoAerodromo.classList.remove(
            "hidden"
        );

        resultadoAerodromo.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// ==========================================
// PESQUISA INTELIGENTE - AERONAVES
// ==========================================

function gerarSugestoesAeronaves() {

    if (
        !campoMatricula ||
        !sugestoesAeronaves
    ) {

        return;

    }


    const texto =
        campoMatricula.value.trim();


    const termo =
        normalizarTexto(texto);


    indiceSugestaoAeronave = -1;


    sugestoesAeronaves.innerHTML = "";


    if (!termo) {

        fecharSugestoesAeronaves();

        return;

    }


    if (
        !Array.isArray(aeronaves) ||
        aeronaves.length === 0
    ) {

        fecharSugestoesAeronaves();

        return;

    }


    const resultados =
        aeronaves
            .filter(function(aeronave) {

                if (!aeronave) {
                    return false;
                }


                const matricula =
                    normalizarTexto(
                        aeronave.matricula
                    );

                const fabricante =
                    normalizarTexto(
                        aeronave.fabricante
                    );

                const modelo =
                    normalizarTexto(
                        aeronave.modelo
                    );


                return (
                    matricula.includes(termo) ||
                    fabricante.includes(termo) ||
                    modelo.includes(termo)
                );

            })
            .slice(0, 5);


    if (resultados.length === 0) {

        fecharSugestoesAeronaves();

        return;

    }


    resultados.forEach(
        function(aeronave) {

            const item =
                document.createElement(
                    "button"
                );


            item.type = "button";

            item.className =
                "sugestao-item";


            const matricula =
                aeronave.matricula || "—";

            const fabricante =
                aeronave.fabricante || "";

            const modelo =
                aeronave.modelo || "";


            item.innerHTML = `

                <span class="sugestao-titulo">
                    ${escaparHtml(matricula)}
                </span>

                <span class="sugestao-subtitulo">
                    ${escaparHtml(fabricante)}
                    ${
                        fabricante && modelo
                            ? " "
                            : ""
                    }
                    ${escaparHtml(modelo)}
                </span>

            `;


            item.addEventListener(
                "mousedown",
                function(event) {

                    event.preventDefault();

                }
            );


            item.addEventListener(
                "click",
                function() {

                    campoMatricula.value =
                        matricula;

                    fecharSugestoesAeronaves();

                    pesquisarAeronave();

                }
            );


            sugestoesAeronaves.appendChild(
                item
            );

        }
    );


    sugestoesAeronaves.classList.remove(
        "hidden"
    );

}


// ==========================================
// PESQUISA INTELIGENTE - AERÓDROMOS
// ==========================================

function gerarSugestoesAerodromos() {

    if (
        !campoIcao ||
        !sugestoesAerodromos
    ) {

        return;

    }


    const texto =
        campoIcao.value.trim();


    const termo =
        normalizarTexto(texto);


    indiceSugestaoAerodromo = -1;


    sugestoesAerodromos.innerHTML = "";


    if (!termo) {

        fecharSugestoesAerodromos();

        return;

    }


    if (
        !Array.isArray(aerodromos) ||
        aerodromos.length === 0
    ) {

        fecharSugestoesAerodromos();

        return;

    }


    const resultados =
        aerodromos
            .filter(function(aero) {

                if (!aero) {
                    return false;
                }


                const icao =
                    normalizarTexto(
                        aero.icao
                    );

                const nome =
                    normalizarTexto(
                        aero.nome
                    );

                const municipio =
                    normalizarTexto(
                        aero.municipio
                    );

                const municipioServido =
                    normalizarTexto(
                        aero.municipio_servido
                    );


                return (
                    icao.includes(termo) ||
                    nome.includes(termo) ||
                    municipio.includes(termo) ||
                    municipioServido.includes(termo)
                );

            })
            .slice(0, 5);


    if (resultados.length === 0) {

        fecharSugestoesAerodromos();

        return;

    }


    resultados.forEach(
        function(aero) {

            const item =
                document.createElement(
                    "button"
                );


            item.type = "button";

            item.className =
                "sugestao-item";


            const icao =
                aero.icao || "—";

            const nome =
                aero.nome ||
                "Nome não informado";

            const cidade =
                aero.municipio_servido ||
                aero.municipio ||
                aero.cidade ||
                "";


            item.innerHTML = `

                <span class="sugestao-titulo">
                    ${escaparHtml(icao)}
                    <span class="sugestao-separador">
                        —
                    </span>
                    ${escaparHtml(nome)}
                </span>

                <span class="sugestao-subtitulo">
                    ${escaparHtml(cidade)}
                    ${
                        aero.uf
                            ? " - " +
                              escaparHtml(aero.uf)
                            : ""
                    }
                </span>

            `;


            item.addEventListener(
                "mousedown",
                function(event) {

                    event.preventDefault();

                }
            );


            item.addEventListener(
                "click",
                function() {

                    campoIcao.value =
                        icao;

                    fecharSugestoesAerodromos();

                    pesquisarAerodromo();

                }
            );


            sugestoesAerodromos.appendChild(
                item
            );

        }
    );


    sugestoesAerodromos.classList.remove(
        "hidden"
    );

}


// ==========================================
// CONTROLE DAS SUGESTÕES
// ==========================================

let indiceSugestaoAeronave = -1;
let indiceSugestaoAerodromo = -1;


// ==========================================
// FECHAR SUGESTÕES AERONAVES
// ==========================================

function fecharSugestoesAeronaves() {

    if (!sugestoesAeronaves) {
        return;
    }

    sugestoesAeronaves.classList.add(
        "hidden"
    );

    indiceSugestaoAeronave = -1;

}


// ==========================================
// FECHAR SUGESTÕES AERÓDROMOS
// ==========================================

function fecharSugestoesAerodromos() {

    if (!sugestoesAerodromos) {
        return;
    }

    sugestoesAerodromos.classList.add(
        "hidden"
    );

    indiceSugestaoAerodromo = -1;

}


// ==========================================
// DESTACAR ITEM SELECIONADO
// ==========================================

function atualizarItemSelecionado(
    itens,
    indice
) {

    itens.forEach(
        function(item, index) {

            item.classList.toggle(
                "selecionado",
                index === indice
            );

        }
    );


    if (
        indice >= 0 &&
        itens[indice]
    ) {

        itens[indice].scrollIntoView({
            block: "nearest"
        });

    }

}


// ==========================================
// TECLADO - AERONAVES
// ==========================================

function tecladoAeronaves(event) {

    if (
        !sugestoesAeronaves ||
        sugestoesAeronaves.classList.contains(
            "hidden"
        )
    ) {

        if (event.key === "Enter") {

            event.preventDefault();

            pesquisarAeronave();

        }

        return;

    }


    const itens =
        sugestoesAeronaves.querySelectorAll(
            ".sugestao-item"
        );


    if (!itens.length) {

        return;

    }


    if (event.key === "ArrowDown") {

        event.preventDefault();

        indiceSugestaoAeronave++;


        if (
            indiceSugestaoAeronave >=
            itens.length
        ) {

            indiceSugestaoAeronave = 0;

        }


        atualizarItemSelecionado(
            itens,
            indiceSugestaoAeronave
        );

    }


    else if (event.key === "ArrowUp") {

        event.preventDefault();

        indiceSugestaoAeronave--;


        if (
            indiceSugestaoAeronave < 0
        ) {

            indiceSugestaoAeronave =
                itens.length - 1;

        }


        atualizarItemSelecionado(
            itens,
            indiceSugestaoAeronave
        );

    }


    else if (event.key === "Enter") {

        event.preventDefault();


        if (
            indiceSugestaoAeronave >= 0
        ) {

            itens[
                indiceSugestaoAeronave
            ].click();

        } else {

            pesquisarAeronave();

        }

    }


    else if (event.key === "Escape") {

        event.preventDefault();

        fecharSugestoesAeronaves();

    }

}


// ==========================================
// TECLADO - AERÓDROMOS
// ==========================================

function tecladoAerodromos(event) {

    if (
        !sugestoesAerodromos ||
        sugestoesAerodromos.classList.contains(
            "hidden"
        )
    ) {

        if (event.key === "Enter") {

            event.preventDefault();

            pesquisarAerodromo();

        }

        return;

    }


    const itens =
        sugestoesAerodromos.querySelectorAll(
            ".sugestao-item"
        );


    if (!itens.length) {

        return;

    }


    if (event.key === "ArrowDown") {

        event.preventDefault();

        indiceSugestaoAerodromo++;


        if (
            indiceSugestaoAerodromo >=
            itens.length
        ) {

            indiceSugestaoAerodromo = 0;

        }


        atualizarItemSelecionado(
            itens,
            indiceSugestaoAerodromo
        );

    }


    else if (event.key === "ArrowUp") {

        event.preventDefault();

        indiceSugestaoAerodromo--;


        if (
            indiceSugestaoAerodromo < 0
        ) {

            indiceSugestaoAerodromo =
                itens.length - 1;

        }


        atualizarItemSelecionado(
            itens,
            indiceSugestaoAerodromo
        );

    }


    else if (event.key === "Enter") {

        event.preventDefault();


        if (
            indiceSugestaoAerodromo >= 0
        ) {

            itens[
                indiceSugestaoAerodromo
            ].click();

        } else {

            pesquisarAerodromo();

        }

    }


    else if (event.key === "Escape") {

        event.preventDefault();

        fecharSugestoesAerodromos();

    }

}


// ==========================================
// EVENTOS DE PESQUISA
// ==========================================

// AERONAVES

if (btnPesquisar) {

    btnPesquisar.addEventListener(
        "click",
        pesquisarAeronave
    );

}


if (campoMatricula) {

    campoMatricula.addEventListener(
        "input",
        gerarSugestoesAeronaves
    );


    campoMatricula.addEventListener(
        "keydown",
        tecladoAeronaves
    );

}


// AERÓDROMOS

if (btnPesquisarIcao) {

    btnPesquisarIcao.addEventListener(
        "click",
        pesquisarAerodromo
    );

}


if (campoIcao) {

    campoIcao.addEventListener(
        "input",
        gerarSugestoesAerodromos
    );


    campoIcao.addEventListener(
        "keydown",
        tecladoAerodromos
    );

}


// ==========================================
// FECHAR SUGESTÕES AO CLICAR FORA
// ==========================================

document.addEventListener(
    "click",
    function(event) {

        if (
            sugestoesAeronaves &&
            campoMatricula &&
            !sugestoesAeronaves.contains(
                event.target
            ) &&
            event.target !== campoMatricula
        ) {

            fecharSugestoesAeronaves();

        }


        if (
            sugestoesAerodromos &&
            campoIcao &&
            !sugestoesAerodromos.contains(
                event.target
            ) &&
            event.target !== campoIcao
        ) {

            fecharSugestoesAerodromos();

        }

    }
);


// ==========================================
// ACERVO FOTOGRÁFICO
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
// CANCELAR FOTO
// ==========================================

if (btnCancelarFoto) {

    btnCancelarFoto.addEventListener(
        "click",
        limparFormularioFoto
    );

}


// ==========================================
// ICAO DA FOTO
// ==========================================

if (campoLocalFoto) {

    campoLocalFoto.addEventListener(
        "input",
        function() {

            campoLocalFoto.value =
                campoLocalFoto.value
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "")
                    .substring(0, 4);

        }
    );

}


// ==========================================
// PREVIEW
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


    if (
        icao &&
        !/^[A-Z]{4}$/.test(icao)
    ) {

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

                id: Date.now(),

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

            } catch (erro) {

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


            registrarEventoAnalytics(
                "foto_adicionada",
                {
                    matricula:
                        aeronaveAtual.matricula,
                    icao:
                        icao || "nao_informado"
                }
            );


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
// LOCAL STORAGE
// ==========================================

function obterChaveFotos(matricula) {

    return (
        "leospotter_fotos_" +
        normalizarMatricula(matricula)
    );

}


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
                JSON.parse(dados);


            if (
                !Array.isArray(
                    fotosAeronave
                )
            ) {

                fotosAeronave = [];

            }

        } catch (erro) {

            console.error(
                "Erro ao carregar fotos:",
                erro
            );

            fotosAeronave = [];

        }

    } else {

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
// ATUALIZAR FOTOS
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
// ESTATÍSTICAS
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
                    JSON.parse(dados);


                if (
                    !Array.isArray(fotos) ||
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

            } catch (erroFoto) {

                console.warn(
                    "Registro de fotos inválido:",
                    chave,
                    erroFoto
                );

            }

        }

    } catch (erro) {

        console.error(
            "Erro ao calcular estatísticas:",
            erro
        );

    }


    if (aeronavesComFotos) {

        aeronavesComFotos.textContent =
            matriculasComFotos.size
                .toLocaleString("pt-BR");

    }


    if (totalFotos) {

        totalFotos.textContent =
            total.toLocaleString("pt-BR");

    }

}


// ==========================================
// GALERIA
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

                    registrarEventoAnalytics(
                        "foto_visualizada",
                        {
                            matricula:
                                foto.matricula,
                            icao:
                                foto.icao || "nao_informado"
                        }
                    );

                    abrirFoto(foto);

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


    if (
        partes.length !== 3
    ) {

        return data;

    }


    return (
        `${partes[2]}/${partes[1]}/${partes[0]}`
    );

}


// ==========================================
// VISUALIZAR FOTO
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

carregarAerodromos();


// ==========================================
// PREENCHER PREVISÕES DE PESQUISA
// ==========================================

function atualizarPrevisoesPesquisa() {

    // ------------------------------------------
    // PREVISÕES DE AERONAVES
    // ------------------------------------------

    const listaAeronaves =
        document.getElementById(
            "listaAeronaves"
        );


    if (listaAeronaves) {

        listaAeronaves.innerHTML = "";


        aeronaves.forEach(
            function(aeronave) {

                if (!aeronave.matricula) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    aeronave.matricula;


                if (aeronave.modelo) {

                    option.label =
                        aeronave.modelo;

                }


                listaAeronaves.appendChild(
                    option
                );

            }
        );

    }


    // ------------------------------------------
    // PREVISÕES DE AERÓDROMOS
    // ------------------------------------------

    const listaAerodromos =
        document.getElementById(
            "listaAerodromos"
        );


    if (listaAerodromos) {

        listaAerodromos.innerHTML = "";


        aerodromos.forEach(
            function(aero) {

                if (!aero.icao) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    aero.icao;


                const nome =
                    aero.nome || "";

                const cidade =
                    aero.municipio ||
                    aero.cidade ||
                    "";


                if (nome && cidade) {

                    option.label =
                        `${nome} - ${cidade}`;

                } else if (nome) {

                    option.label =
                        nome;

                } else if (cidade) {

                    option.label =
                        cidade;

                }


                listaAerodromos.appendChild(
                    option
                );

            }
        );

    }

}
