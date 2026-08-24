/* ============================================================
   LEOSPOTTER
   app.js
   Versão 1.5.0
   ============================================================ */

"use strict";

/* ============================================================
   CONFIGURAÇÃO
   ============================================================ */

const VERSAO_SITE = "1.5.0";

const CAMINHO_AERONAVES = "data/aeronaves.json";
const CAMINHO_AERODROMOS = "data/aeroportos.json";

let aeronaves = [];
let aerodromos = [];

let aeronaveAtual = null;
let aerodromoAtual = null;


/* ============================================================
   FUNÇÕES AUXILIARES
   ============================================================ */

function $(id) {
    return document.getElementById(id);
}


function mostrar(id) {
    const elemento = $(id);

    if (elemento) {
        elemento.classList.remove("hidden");
    }
}


function esconder(id) {
    const elemento = $(id);

    if (elemento) {
        elemento.classList.add("hidden");
    }
}


function texto(valor, padrao = "—") {

    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return padrao;
    }

    return String(valor).trim();
}


function escaparHTML(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function numero(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }

    const n = Number(
        String(valor)
            .replace(",", ".")
            .trim()
    );

    return Number.isFinite(n) ? n : null;
}


function formatarNumero(valor) {

    const n = numero(valor);

    if (n === null) {
        return "—";
    }

    return n.toLocaleString("pt-BR");
}


function normalizarICAO(valor) {

    return String(valor ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
}


function normalizarMatricula(valor) {

    return String(valor ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
}


/* ============================================================
   CARREGAMENTO DOS JSON
   ============================================================ */

async function carregarJSON(caminho) {

    const resposta = await fetch(
        caminho + "?v=" + Date.now(),
        {
            cache: "no-store"
        }
    );

    if (!resposta.ok) {

        throw new Error(
            "Erro HTTP " +
            resposta.status +
            " ao carregar " +
            caminho
        );
    }

    return await resposta.json();
}


async function carregarBases() {

    try {

        console.log(
            "LeoSpotter: carregando bases..."
        );

        const resultados = await Promise.all([
            carregarJSON(CAMINHO_AERONAVES),
            carregarJSON(CAMINHO_AERODROMOS)
        ]);

        aeronaves = Array.isArray(resultados[0])
            ? resultados[0]
            : [];

        aerodromos = Array.isArray(resultados[1])
            ? resultados[1]
            : [];

        console.log(
            "Aeronaves carregadas:",
            aeronaves.length
        );

        console.log(
            "Aeródromos carregados:",
            aerodromos.length
        );

        prepararListas();

        atualizarEstatisticas();

    } catch (erro) {

        console.error(
            "LeoSpotter: erro ao carregar bases:",
            erro
        );
    }
}


/* ============================================================
   DATAlISTS
   ============================================================ */

function prepararListas() {

    prepararListaAerodromos();

    prepararListaAeronaves();
}


function prepararListaAerodromos() {

    const lista = $("listaAerodromos");

    if (!lista) {
        return;
    }

    lista.innerHTML = "";

    const ordenados = [...aerodromos]
        .filter(a => a && a.icao)
        .sort((a, b) =>
            normalizarICAO(a.icao)
                .localeCompare(
                    normalizarICAO(b.icao)
                )
        );

    ordenados.forEach(aeroporto => {

        const option =
            document.createElement("option");

        const icao =
            normalizarICAO(
                aeroporto.icao
            );

        const nome =
            texto(
                aeroporto.nome,
                ""
            );

        const cidade =
            texto(
                aeroporto.municipio,
                ""
            );

        option.value = icao;

        if (nome || cidade) {

            option.label =
                [nome, cidade]
                    .filter(Boolean)
                    .join(" - ");
        }

        lista.appendChild(option);
    });
}


function prepararListaAeronaves() {

    const lista = $("listaAeronaves");

    if (!lista) {
        return;
    }

    lista.innerHTML = "";

    const ordenados = [...aeronaves]
        .filter(a => a && (
            a.matricula ||
            a.matricula_atual
        ))
        .sort((a, b) => {

            const ma =
                normalizarMatricula(
                    a.matricula ||
                    a.matricula_atual
                );

            const mb =
                normalizarMatricula(
                    b.matricula ||
                    b.matricula_atual
                );

            return ma.localeCompare(mb);
        });

    ordenados.forEach(aeronave => {

        const option =
            document.createElement("option");

        const matricula =
            normalizarMatricula(
                aeronave.matricula ||
                aeronave.matricula_atual
            );

        const modelo =
            texto(
                aeronave.modelo ||
                aeronave.marca_modelo ||
                aeronave.tipo,
                ""
            );

        option.value = matricula;

        if (modelo) {
            option.label = modelo;
        }

        lista.appendChild(option);
    });
}


/* ============================================================
   PESQUISA DE AERÓDROMO
   ============================================================ */

function pesquisarAerodromo() {

    const campo = $("icao");

    if (!campo) {
        return;
    }

    const icao =
        normalizarICAO(
            campo.value
        );

    if (!icao) {

        esconder("resultadoAerodromo");
        mostrar("aerodromoNaoEncontrado");

        $("icaoNaoEncontrado").textContent =
            "informado";

        return;
    }

    const aeroporto =
        aerodromos.find(
            item =>
                normalizarICAO(
                    item?.icao
                ) === icao
        );

    esconder("resultadoAerodromo");
    esconder("aerodromoNaoEncontrado");

    if (!aeroporto) {

        $("icaoNaoEncontrado").textContent =
            icao;

        mostrar("aerodromoNaoEncontrado");

        registrarBusca(
            "aerodromo",
            icao,
            false
        );

        return;
    }

    aerodromoAtual = aeroporto;

    preencherAerodromo(
        aeroporto
    );

    mostrar("resultadoAerodromo");

    registrarBusca(
        "aerodromo",
        icao,
        true
    );

    document
        .getElementById("resultadoAerodromo")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


/* ============================================================
   PREENCHER AERÓDROMO
   ============================================================ */

function preencherAerodromo(aeroporto) {

    const icao =
        normalizarICAO(
            aeroporto.icao
        );

    $("resultadoIcao").textContent =
        icao;

    $("aerodromoIcao").textContent =
        icao;

    $("resultadoNomeAerodromo").textContent =
        texto(
            aeroporto.nome,
            "Aeródromo"
        );

    $("aerodromoCidade").textContent =
        texto(
            aeroporto.municipio
        );

    $("aerodromoUf").textContent =
        texto(
            aeroporto.uf
        );

    $("aerodromoElevacao").textContent =
        formatarElevacao(
            aeroporto
        );

    $("aerodromoOperacaoDiurna").textContent =
        texto(
            aeroporto.operacao_diurna ||
            aeroporto.operacaoDiurna ||
            aeroporto.horario_diurno
        );

    $("aerodromoOperacaoNoturna").textContent =
        texto(
            aeroporto.operacao_noturna ||
            aeroporto.operacaoNoturna ||
            aeroporto.horario_noturno
        );

    renderizarPistas(
        aeroporto
    );

    renderizarDistancias(
        aeroporto
    );

    renderizarFrequencias(
        aeroporto
    );
}


function formatarElevacao(aeroporto) {

    const valor =
        aeroporto.elevacao ??
        aeroporto.elevacao_m ??
        aeroporto.altitude ??
        aeroporto.elevation;

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return "—";
    }

    return formatarNumero(valor) + " m";
}


/* ============================================================
   PISTAS
   ============================================================ */

function obterPistas(aeroporto) {

    if (
        Array.isArray(
            aeroporto.pistas
        )
    ) {
        return aeroporto.pistas;
    }

    if (
        Array.isArray(
            aeroporto.pistas_aisweb
        )
    ) {
        return aeroporto.pistas_aisweb;
    }

    return [];
}


function renderizarPistas(aeroporto) {

    const container =
        $("listaPistas");

    if (!container) {
        return;
    }

    const pistas =
        obterPistas(
            aeroporto
        );

    if (!pistas.length) {

        container.innerHTML =
            '<p class="dados-indisponiveis">' +
            'Nenhuma pista encontrada.' +
            '</p>';

        return;
    }

    container.innerHTML =
        pistas
            .map(
                (pista, indice) =>
                    criarHTMLPista(
                        pista,
                        indice
                    )
            )
            .join("");
}


function criarHTMLPista(
    pista,
    indice
) {

    const identificacao =
        texto(
            pista.identificacao ||
            pista.rwy ||
            pista.pista ||
            pista.cabeceira,
            "Pista " + (indice + 1)
        );

    const piso =
        texto(
            pista.piso ||
            pista.superficie ||
            pista.surface
        );

    const dimensoes =
        texto(
            pista.dimensoes
        );

    const comprimento =
        pista.comprimento ||
        pista.length ||
        pista.extensao;

    const largura =
        pista.largura ||
        pista.width;

    const resistencia =
        texto(
            pista.resistencia ||
            pista.pcN ||
            pista.pcn
        );

    let dimensoesFinal =
        dimensoes;

    if (
        dimensoesFinal === "—" &&
        (comprimento || largura)
    ) {

        dimensoesFinal =
            [
                comprimento,
                largura
            ]
                .filter(v =>
                    v !== null &&
                    v !== undefined &&
                    v !== ""
                )
                .join(" x ") + " m";
    }

    return `
        <div class="dado-pista">
            <strong>
                RWY ${escaparHTML(identificacao)}
            </strong>

            <div>
                <span>
                    Piso:
                </span>
                ${escaparHTML(piso)}
            </div>

            <div>
                <span>
                    Dimensões:
                </span>
                ${escaparHTML(dimensoesFinal)}
            </div>

            <div>
                <span>
                    Resistência:
                </span>
                ${escaparHTML(resistencia)}
            </div>
        </div>
    `;
}


/* ============================================================
   DISTÂNCIAS DECLARADAS
   ============================================================ */

function obterDistancias(aeroporto) {

    if (
        Array.isArray(
            aeroporto.distancias_declaradas
        )
    ) {
        return aeroporto.distancias_declaradas;
    }

    if (
        Array.isArray(
            aeroporto.distancias
        )
    ) {
        return aeroporto.distancias;
    }

    return [];
}


function renderizarDistancias(aeroporto) {

    const container =
        $("listaDistancias");

    if (!container) {
        return;
    }

    const distancias =
        obterDistancias(
            aeroporto
        );

    if (!distancias.length) {

        container.innerHTML =
            '<p class="dados-indisponiveis">' +
            'Nenhuma distância declarada encontrada.' +
            '</p>';

        return;
    }

    container.innerHTML =
        distancias
            .map(
                distancia =>
                    criarHTMLDistancia(
                        distancia
                    )
            )
            .join("");
}


function criarHTMLDistancia(
    distancia
) {

    const rwy =
        texto(
            distancia.rwy ||
            distancia.rwy_identificacao ||
            distancia.identificacao
        );

    return `
        <div class="dado-distancia">

            <strong>
                RWY ${escaparHTML(rwy)}
            </strong>

            <div>
                <span>TORA:</span>
                ${escaparHTML(
                    formatarNumero(
                        distancia.tora
                    )
                )} m
            </div>

            <div>
                <span>TODA:</span>
                ${escaparHTML(
                    formatarNumero(
                        distancia.toda
                    )
                )} m
            </div>

            <div>
                <span>ASDA:</span>
                ${escaparHTML(
                    formatarNumero(
                        distancia.asda
                    )
                )} m
            </div>

            <div>
                <span>LDA:</span>
                ${escaparHTML(
                    formatarNumero(
                        distancia.lda
                    )
                )} m
            </div>

        </div>
    `;
}


/* ============================================================
   FREQUÊNCIAS
   ============================================================ */

function obterFrequencias(aeroporto) {

    if (
        Array.isArray(
            aeroporto.frequencias
        )
    ) {
        return aeroporto.frequencias;
    }

    if (
        Array.isArray(
            aeroporto.frequencias_aisweb
        )
    ) {
        return aeroporto.frequencias_aisweb;
    }

    return [];
}


function renderizarFrequencias(aeroporto) {

    const container =
        $("listaFrequencias");

    if (!container) {
        return;
    }

    const frequencias =
        obterFrequencias(
            aeroporto
        );

    if (!frequencias.length) {

        container.innerHTML =
            '<p class="dados-indisponiveis">' +
            'Nenhuma frequência encontrada.' +
            '</p>';

        return;
    }

    container.innerHTML =
        frequencias
            .map(
                frequencia =>
                    criarHTMLFrequencia(
                        frequencia
                    )
            )
            .join("");
}


function criarHTMLFrequencia(
    frequencia
) {

    const orgao =
        texto(
            frequencia.orgao ||
            frequencia.servico ||
            frequencia.tipo,
            "Rádio"
        );

    const valor =
        texto(
            frequencia.valor ||
            frequencia.frequencia ||
            frequencia.frequency
        );

    const observacao =
        texto(
            frequencia.observacao,
            ""
        );

    return `
        <div class="dado-frequencia">

            <strong>
                ${escaparHTML(orgao)}
            </strong>

            <div class="frequencia-valor">
                ${escaparHTML(valor)}
                MHz
            </div>

            ${
                observacao
                    ? `
                        <div>
                            ${escaparHTML(
                                observacao
                            )}
                        </div>
                    `
                    : ""
            }

        </div>
    `;
}


/* ============================================================
   PESQUISA DE AERONAVE
   ============================================================ */

function pesquisarAeronave() {

    const campo =
        $("matricula");

    if (!campo) {
        return;
    }

    const matricula =
        normalizarMatricula(
            campo.value
        );

    esconder("resultado");
    esconder("naoEncontrada");

    if (!matricula) {

        $("matriculaNaoEncontrada")
            .textContent =
            "informada";

        mostrar("naoEncontrada");

        return;
    }

    const aeronave =
        aeronaves.find(
            item =>
                normalizarMatricula(
                    item?.matricula ||
                    item?.matricula_atual ||
                    item?.registro ||
                    item?.registration
                ) === matricula
        );

    if (!aeronave) {

        $("matriculaNaoEncontrada")
            .textContent =
            matricula;

        mostrar("naoEncontrada");

        registrarBusca(
            "aeronave",
            matricula,
            false
        );

        return;
    }

    aeronaveAtual =
        aeronave;

    preencherAeronave(
        aeronave
    );

    mostrar("resultado");

    carregarFotos(
        matricula
    );

    registrarBusca(
        "aeronave",
        matricula,
        true
    );

    $("resultado")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


/* ============================================================
   PREENCHER AERONAVE
   ============================================================ */

function preencherAeronave(
    aeronave
) {

    const matricula =
        texto(
            aeronave.matricula ||
            aeronave.matricula_atual ||
            aeronave.registro ||
            aeronave.registration
        );

    const fabricante =
        texto(
            aeronave.fabricante ||
            aeronave.marca
        );

    const modelo =
        texto(
            aeronave.modelo ||
            aeronave.marca_modelo ||
            aeronave.tipo
        );

    const numeroSerie =
        texto(
            aeronave.numero_serie ||
            aeronave.numeroserie ||
            aeronave.serial_number ||
            aeronave.serial
        );

    const ano =
        texto(
            aeronave.ano_fabricacao ||
            aeronave.ano ||
            aeronave.year
        );

    const tipoIcao =
        texto(
            aeronave.tipo_icao ||
            aeronave.icao_tipo ||
            aeronave.type_icao
        );

    const situacao =
        texto(
            aeronave.situacao ||
            aeronave.status
        );

    $("resultadoMatricula").textContent =
        matricula;

    $("matriculaNaoEncontrada").textContent =
        matricula;

    $("resultadoModelo").textContent =
        modelo;

    $("fabricante").textContent =
        fabricante;

    $("modelo").textContent =
        modelo;

    $("numeroSerie").textContent =
        numeroSerie;

    $("ano").textContent =
        ano;

    $("tipoIcao").textContent =
        tipoIcao;

    $("situacao").textContent =
        situacao;
}


/* ============================================================
   FOTOS / SUPABASE
   ============================================================ */

async function carregarFotos(
    matricula
) {

    const semFotos =
        $("semFotos");

    const contador =
        $("contadorFotos");

    try {

        /*
         * A integração Supabase existente
         * pode disponibilizar uma função
         * carregarFotosAeronave().
         */

        if (
            typeof window.carregarFotosAeronave ===
            "function"
        ) {

            const fotos =
                await window.carregarFotosAeronave(
                    matricula
                );

            renderizarFotos(
                Array.isArray(fotos)
                    ? fotos
                    : []
            );

            return;
        }

        /*
         * Compatibilidade com funções
         * alternativas do fotos.js.
         */

        if (
            typeof window.buscarFotos ===
            "function"
        ) {

            const fotos =
                await window.buscarFotos(
                    matricula
                );

            renderizarFotos(
                Array.isArray(fotos)
                    ? fotos
                    : []
            );

            return;
        }

        if (semFotos) {
            semFotos.classList.remove(
                "hidden"
            );
        }

        if (contador) {
            contador.textContent =
                "0 fotos";
        }

    } catch (erro) {

        console.error(
            "Erro ao carregar fotografias:",
            erro
        );

        renderizarFotos([]);
    }
}


function renderizarFotos(fotos) {

    const semFotos =
        $("semFotos");

    const contador =
        $("contadorFotos");

    if (contador) {

        contador.textContent =
            fotos.length +
            (
                fotos.length === 1
                    ? " foto"
                    : " fotos"
            );
    }

    /*
     * O fotos.js pode cuidar da galeria.
     * Aqui apenas mantemos o estado "sem fotos".
     */

    if (semFotos) {

        if (fotos.length > 0) {

            semFotos.classList.add(
                "hidden"
            );

        } else {

            semFotos.classList.remove(
                "hidden"
            );
        }
    }

    atualizarEstatisticas();
}


/* ============================================================
   ESTATÍSTICAS
   ============================================================ */

async function atualizarEstatisticas() {

    const totalAeronaves =
        $("totalAeronaves");

    const totalFotos =
        $("totalFotos");

    if (totalAeronaves) {

        totalAeronaves.textContent =
            contarAeronavesComFotos();
    }

    if (totalFotos) {

        const total =
            await contarFotos();

        if (total !== null) {
            totalFotos.textContent = total;
        }
    }
}


function contarAeronavesComFotos() {

    /*
     * Se o Supabase fornecer uma função
     * própria, ela será utilizada.
     */

    if (
        typeof window.obterTotalAeronavesComFotos ===
        "function"
    ) {

        try {

            return window.obterTotalAeronavesComFotos();

        } catch (erro) {

            console.warn(
                "Não foi possível obter total de aeronaves:",
                erro
            );
        }
    }

    return 0;
}


async function contarFotos() {

    if (
        typeof window.obterTotalFotos ===
        "function"
    ) {

        try {

            return await window.obterTotalFotos();

        } catch (erro) {

            console.warn(
                "Não foi possível obter total de fotos:",
                erro
            );
        }
    }

    return null;
}


/* ============================================================
   ESTATÍSTICAS / BUSCAS
   ============================================================ */

function registrarBusca(
    tipo,
    valor,
    encontrada
) {

    try {

        if (
            typeof window.registrarEstatistica ===
            "function"
        ) {

            window.registrarEstatistica({
                tipo: tipo,
                valor: valor,
                encontrada: encontrada,
                data:
                    new Date().toISOString()
            });

            return;
        }

        if (
            typeof window.registrarBusca ===
            "function"
        ) {

            window.registrarBusca(
                tipo,
                valor,
                encontrada
            );
        }

    } catch (erro) {

        console.warn(
            "Erro ao registrar estatística:",
            erro
        );
    }
}


/* ============================================================
   EVENTOS
   ============================================================ */

function configurarEventos() {

    const btnIcao =
        $("btnPesquisarIcao");

    if (btnIcao) {

        btnIcao.addEventListener(
            "click",
            pesquisarAerodromo
        );
    }


    const campoIcao =
        $("icao");

    if (campoIcao) {

        campoIcao.addEventListener(
            "keydown",
            evento => {

                if (
                    evento.key ===
                    "Enter"
                ) {

                    evento.preventDefault();

                    pesquisarAerodromo();
                }
            }
        );

        campoIcao.addEventListener(
            "input",
            () => {

                campoIcao.value =
                    campoIcao.value
                        .toUpperCase()
                        .replace(
                            /[^A-Z0-9]/g,
                            ""
                        )
                        .slice(0, 4);
            }
        );
    }


    const btnAeronave =
        $("btnPesquisar");

    if (btnAeronave) {

        btnAeronave.addEventListener(
            "click",
            pesquisarAeronave
        );
    }


    const campoMatricula =
        $("matricula");

    if (campoMatricula) {

        campoMatricula.addEventListener(
            "keydown",
            evento => {

                if (
                    evento.key ===
                    "Enter"
                ) {

                    evento.preventDefault();

                    pesquisarAeronave();
                }
            }
        );

        campoMatricula.addEventListener(
            "input",
            () => {

                campoMatricula.value =
                    campoMatricula.value
                        .toUpperCase();
            }
        );
    }


    configurarFormularioFoto();
}


/* ============================================================
   FORMULÁRIO DE FOTO
   ============================================================ */

function configurarFormularioFoto() {

    const btnAdicionar =
        $("btnAdicionarFoto");

    const btnCancelar =
        $("btnCancelarFoto");

    const btnSalvar =
        $("btnSalvarFoto");

    const arquivo =
        $("foto");

    if (btnAdicionar) {

        btnAdicionar.addEventListener(
            "click",
            () => {

                mostrar(
                    "formularioFoto"
                );

                esconder(
                    "semFotos"
                );
            }
        );
    }


    if (btnCancelar) {

        btnCancelar.addEventListener(
            "click",
            cancelarFoto
        );
    }


    if (arquivo) {

        arquivo.addEventListener(
            "change",
            mostrarPreviewFoto
        );
    }


    if (btnSalvar) {

        btnSalvar.addEventListener(
            "click",
            salvarFoto
        );
    }
}


function cancelarFoto() {

    esconder(
        "formularioFoto"
    );

    limparFormularioFoto();

    mostrar(
        "semFotos"
    );
}


function limparFormularioFoto() {

    const arquivo =
        $("foto");

    const data =
        $("dataFoto");

    const local =
        $("localFoto");

    const observacao =
        $("observacaoFoto");

    const preview =
        $("previewFoto");

    const imagem =
        $("imagemPreview");

    if (arquivo) {
        arquivo.value = "";
    }

    if (data) {
        data.value = "";
    }

    if (local) {
        local.value = "";
    }

    if (observacao) {
        observacao.value = "";
    }

    if (preview) {
        preview.classList.add(
            "hidden"
        );
    }

    if (imagem) {
        imagem.src = "";
    }
}


function mostrarPreviewFoto(evento) {

    const arquivo =
        evento.target.files?.[0];

    if (!arquivo) {
        return;
    }

    const preview =
        $("previewFoto");

    const imagem =
        $("imagemPreview");

    if (!preview || !imagem) {
        return;
    }

    const url =
        URL.createObjectURL(
            arquivo
        );

    imagem.src = url;

    preview.classList.remove(
        "hidden"
    );
}


async function salvarFoto() {

    if (!aeronaveAtual) {

        alert(
            "Pesquise uma aeronave antes de adicionar uma fotografia."
        );

        return;
    }

    const arquivo =
        $("foto")?.files?.[0];

    if (!arquivo) {

        alert(
            "Selecione uma fotografia."
        );

        return;
    }

    const data =
        $("dataFoto")?.value || "";

    const local =
        normalizarICAO(
            $("localFoto")?.value || ""
        );

    const observacao =
        $("observacaoFoto")?.value || "";

    try {

        /*
         * Integração com fotos.js.
         */

        if (
            typeof window.salvarFotografia ===
            "function"
        ) {

            await window.salvarFotografia({

                matricula:
                    normalizarMatricula(
                        aeronaveAtual.matricula ||
                        aeronaveAtual.matricula_atual
                    ),

                arquivo:
                    arquivo,

                data:
                    data,

                local:
                    local,

                observacao:
                    observacao
            });

            alert(
                "Fotografia salva com sucesso."
            );

            limparFormularioFoto();

            esconder(
                "formularioFoto"
            );

            mostrar(
                "semFotos"
            );

            await carregarFotos(
                normalizarMatricula(
                    aeronaveAtual.matricula ||
                    aeronaveAtual.matricula_atual
                )
            );

            return;
        }

        alert(
            "A integração de fotografias não está disponível."
        );

    } catch (erro) {

        console.error(
            "Erro ao salvar fotografia:",
            erro
        );

        alert(
            "Não foi possível salvar a fotografia."
        );
    }
}


/* ============================================================
   VERSÃO
   ============================================================ */

function atualizarVersao() {

    const elemento =
        $("versaoSite");

    if (elemento) {
        elemento.textContent =
            "v" + VERSAO_SITE;
    }
}


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

async function iniciarLeoSpotter() {

    console.log(
        "========================================"
    );

    console.log(
        "LEOSPOTTER"
    );

    console.log(
        "Versão:",
        VERSAO_SITE
    );

    console.log(
        "Inicializando..."
    );

    console.log(
        "========================================"
    );

    atualizarVersao();

    configurarEventos();

    await carregarBases();

    console.log(
        "LeoSpotter inicializado."
    );
}


/* ============================================================
   INICIAR QUANDO O HTML ESTIVER PRONTO
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarLeoSpotter
    );

} else {

    iniciarLeoSpotter();
}


/* ============================================================
   EXPORTAÇÃO GLOBAL
   ============================================================ */

window.Leospotter = {

    pesquisarAerodromo,
    pesquisarAeronave,
    carregarBases,
    renderizarPistas,
    renderizarDistancias,
    renderizarFrequencias,

    get aerodromos() {
        return aerodromos;
    },

    get aeronaves() {
        return aeronaves;
    },

    get versao() {
        return VERSAO_SITE;
    }

};
