// ==========================================
// LeoSpotter
// Pesquisa de aeronaves + Acervo fotográfico
// Pesquisa de aeródromos
// Base RAB / ANAC / DECEA
//
// VERSÃO: 1.2.1
// ==========================================

const VERSAO_SITE = "1.2.1";


// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================

let aeronaves = [];
let aeronaveAtual = null;
let fotosAeronave = [];

let aerodromos = [];


// ==========================================
// ELEMENTOS DA PÁGINA (AERONAVES)
// ==========================================

const campoMatricula = document.getElementById("matricula");
const btnPesquisar = document.getElementById("btnPesquisar");
const resultado = document.getElementById("resultado");
const naoEncontrada = document.getElementById("naoEncontrada");


// ==========================================
// ELEMENTOS DA PÁGINA (AERÓDROMOS)
// ==========================================

const campoIcao = document.getElementById("icao");
const btnPesquisarIcao = document.getElementById("btnPesquisarIcao");
const resultadoAerodromo = document.getElementById("resultadoAerodromo");
const aerodromoNaoEncontrado = document.getElementById("aerodromoNaoEncontrado");


// ==========================================
// ELEMENTOS DAS ESTATÍSTICAS
// ==========================================

const totalFotos = document.getElementById("totalFotos");
const aeronavesComFotos = document.getElementById("totalAeronaves");


// ==========================================
// VERSÃO DO SITE
// ==========================================

function atualizarVersaoSite() {

    const elemento = document.getElementById("versaoSite");

    if (elemento) {
        elemento.textContent = `v${VERSAO_SITE}`;
    }

}


// ==========================================
// CARREGAR BASE DE AERONAVES
// ==========================================

async function carregarAeronaves() {

    try {

        const resposta = await fetch("data/aeronaves.json");

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível carregar a base de aeronaves."
            );
        }

        aeronaves = await resposta.json();

        console.log(
            `Base de aeronaves carregada: ${aeronaves.length} registro(s)`
        );

        atualizarEstatisticasFotos();

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

        const resposta = await fetch("data/aeroportos.json");

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível carregar a base de aeródromos."
            );
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {

            throw new Error(
                "A base de aeródromos não possui formato de lista."
            );

        }

        aerodromos = dados;

        console.log(
            `Base de aeródromos carregada: ${aerodromos.length} registro(s)`
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar base de aeródromos:",
            erro
        );

    }

}


// ==========================================
// NORMALIZAR MATRÍCULA
// ==========================================

function normalizarMatricula(matricula) {

    return String(matricula || "")
        .trim()
        .toUpperCase()
        .replace(/-/g, "");

}


// ==========================================
// NORMALIZAR ICAO
// ==========================================

function normalizarIcao(icao) {

    return String(icao || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 4);

}


// ==========================================
// FUNÇÃO AUXILIAR
// VALOR OU "Não informado"
// ==========================================

function valorOuNaoInformado(valor) {

    if (
        valor === undefined ||
        valor === null ||
        String(valor).trim() === ""
    ) {

        return "Não informado";

    }

    return valor;

}


// ==========================================
// LÓGICA DE PESQUISA: AERONAVES
// ==========================================

function pesquisarAeronave() {

    const matriculaDigitada = campoMatricula.value;

    const matricula = normalizarMatricula(
        matriculaDigitada
    );

    resultado.classList.add("hidden");
    naoEncontrada.classList.add("hidden");

    if (!matricula) {

        campoMatricula.focus();

        return;

    }

    const aeronave = aeronaves.find(function(item) {

        return (
            normalizarMatricula(item.matricula || "") ===
            matricula
        );

    });

    if (aeronave) {

        mostrarAeronave(aeronave);

    } else {

        mostrarNaoEncontrada(
            matriculaDigitada.trim().toUpperCase()
        );

    }

}


// ==========================================
// MOSTRAR AERONAVE
// ==========================================

function mostrarAeronave(aeronave) {

    aeronaveAtual = aeronave;

    document.getElementById("resultadoMatricula").textContent =
        valorOuNaoInformado(aeronave.matricula);

    document.getElementById("resultadoModelo").textContent =
        valorOuNaoInformado(aeronave.modelo);

    document.getElementById("fabricante").textContent =
        valorOuNaoInformado(aeronave.fabricante);

    document.getElementById("modelo").textContent =
        valorOuNaoInformado(aeronave.modelo);

    document.getElementById("numeroSerie").textContent =
        valorOuNaoInformado(aeronave.numero_serie);

    document.getElementById("ano").textContent =
        valorOuNaoInformado(aeronave.ano_fabricacao);

    document.getElementById("tipoIcao").textContent =
        valorOuNaoInformado(aeronave.tipo_icao);

    document.getElementById("situacao").textContent =
        valorOuNaoInformado(aeronave.situacao);


    carregarFotosAeronave(
        aeronave.matricula
    );


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
    ).textContent = matricula;

    naoEncontrada.classList.remove("hidden");

    naoEncontrada.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// ==========================================
// LÓGICA DE PESQUISA: AERÓDROMOS
// ==========================================

function pesquisarAerodromo() {

    const icaoDigitado = normalizarIcao(
        campoIcao.value
    );

    // Limpa resultados anteriores
    resultadoAerodromo.classList.add("hidden");
    aerodromoNaoEncontrado.classList.add("hidden");

    // ICAO vazio
    if (!icaoDigitado) {

        campoIcao.focus();

        return;

    }

    console.log("Pesquisando aeródromo:", icaoDigitado);
    console.log("Total de aeródromos carregados:", aerodromos.length);

    // Pesquisa robusta
    const aero = aerodromos.find(function(item) {

        if (!item) {
            return false;
        }

        const codigoBase = normalizarIcao(
            item.icao ||
            item.codigo_icao ||
            item.codigo ||
            ""
        );

        return codigoBase === icaoDigitado;

    });

    console.log("Resultado da pesquisa:", aero);

    // Encontrado
    if (aero) {

        mostrarAerodromo(aero);

    }

    // Não encontrado
    else {

        document.getElementById(
            "icaoNaoEncontrado"
        ).textContent = icaoDigitado;

        aerodromoNaoEncontrado.classList.remove(
            "hidden"
        );

        aerodromoNaoEncontrado.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}

// ==========================================
// MOSTRAR AERÓDROMO
// ==========================================

function mostrarAerodromo(aero) {


    // ======================================
    // DADOS BÁSICOS
    // ======================================

    document.getElementById(
        "resultadoIcao"
    ).textContent =
        valorOuNaoInformado(aero.icao);


    document.getElementById(
        "resultadoNomeAerodromo"
    ).textContent =
        valorOuNaoInformado(aero.nome);


    document.getElementById(
        "aerodromoIcao"
    ).textContent =
        valorOuNaoInformado(aero.icao);


    // Sua base usa "municipio",
    // não "cidade"

    document.getElementById(
    "aerodromoCidade"
).textContent =
    valorOuNaoInformado(
        aero.municipio_servido ||
        aero.municipio ||
        aero.cidade
    );


    document.getElementById(
        "aerodromoUf"
    ).textContent =
        valorOuNaoInformado(aero.uf);


    // ======================================
    // PISTAS
    // ======================================

    const listaPistas =
        document.getElementById(
            "listaPistas"
        );

    listaPistas.innerHTML = "";


    if (
        Array.isArray(aero.pistas) &&
        aero.pistas.length > 0
    ) {

        aero.pistas.forEach(function(pista) {

            const identificacao =
                pista.identificacao ||
                pista.designacao ||
                pista.pista ||
                "Não informado";

            const piso =
                pista.piso ||
                pista.tipo_pavimento ||
                "Não informado";

            const dimensoes =
                pista.dimensoes ||
                pista.comprimento_largura ||
                "Não informado";

            const resistencia =
                pista.resistencia ||
                pista.pcN ||
                pista.pcn ||
                "Não informado";


            listaPistas.innerHTML += `

                <div class="pista-card">

                    <strong>
                        Pista ${identificacao}
                    </strong>

                    <div class="pista-dados">

                        <div class="pista-dado">

                            <span>
                                Piso
                            </span>

                            <strong>
                                ${piso}
                            </strong>

                        </div>


                        <div class="pista-dado">

                            <span>
                                Dimensões
                            </span>

                            <strong>
                                ${dimensoes}
                            </strong>

                        </div>


                        <div class="pista-dado">

                            <span>
                                Resistência
                            </span>

                            <strong>
                                ${resistencia}
                            </strong>

                        </div>

                    </div>

                </div>

            `;

        });

    } else {

        listaPistas.innerHTML = `

            <p class="dados-indisponiveis">
                Nenhuma pista cadastrada na base.
            </p>

        `;

    }


    // ======================================
    // DISTÂNCIAS DECLARADAS
    // ======================================

    const listaDistancias =
        document.getElementById(
            "listaDistancias"
        );

    listaDistancias.innerHTML = "";


    const distancias =
        aero.distancias ||
        aero.distancias_declaradas ||
        [];


    if (
        Array.isArray(distancias) &&
        distancias.length > 0
    ) {

        distancias.forEach(function(dist) {

            if (typeof dist === "object") {

                const div =
                    document.createElement("div");

                div.className =
                    "frequencia-card";

                div.textContent =
                    Object.entries(dist)
                        .map(
                            ([chave, valor]) =>
                                `${chave}: ${valor}`
                        )
                        .join(" | ");

                listaDistancias.appendChild(div);

            } else {

                const p =
                    document.createElement("p");

                p.textContent = dist;

                listaDistancias.appendChild(p);

            }

        });

    } else {

        listaDistancias.innerHTML = `

            <p class="dados-indisponiveis">
                Nenhuma distância declarada
                cadastrada na base.
            </p>

        `;

    }


    // ======================================
    // FREQUÊNCIAS
    // ======================================

    const listaFrequencias =
        document.getElementById(
            "listaFrequencias"
        );

    listaFrequencias.innerHTML = "";


    if (
        Array.isArray(aero.frequencias) &&
        aero.frequencias.length > 0
    ) {

        aero.frequencias.forEach(function(freq) {

            // Caso a frequência seja objeto

            if (
                typeof freq === "object" &&
                freq !== null
            ) {

                const orgao =
                    freq.orgao ||
                    freq.tipo ||
                    freq.servico ||
                    "Não informado";

                const valor =
                    freq.valor ||
                    freq.frequencia ||
                    freq.freq ||
                    "Não informado";

                const observacao =
                    freq.observacao ||
                    freq.obs ||
                    "Operação padrão";


                listaFrequencias.innerHTML += `

                    <div class="frequencia-card">

                        <strong>
                            ${orgao}
                        </strong>

                        <span class="frequencia-valor">
                            ${valor}
                        </span>

                        <small>
                            ${observacao}
                        </small>

                    </div>

                `;

            }

            // Caso a frequência seja texto

            else {

                listaFrequencias.innerHTML += `

                    <div class="frequencia-card">

                        <span class="frequencia-valor">
                            ${freq}
                        </span>

                    </div>

                `;

            }

        });

    } else {

        listaFrequencias.innerHTML = `

            <p class="dados-indisponiveis">
                Nenhuma frequência cadastrada na base.
            </p>

        `;

    }


    // ======================================
    // MOSTRAR RESULTADO
    // ======================================

    resultadoAerodromo.classList.remove(
        "hidden"
    );


    resultadoAerodromo.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ==========================================
// EVENTOS - AERONAVES
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
// EVENTOS - AERÓDROMOS
// ==========================================

if (btnPesquisarIcao) {

    btnPesquisarIcao.addEventListener(
        "click",
        pesquisarAerodromo
    );

}


if (campoIcao) {

    // Mantém ICAO sempre em maiúsculas

    campoIcao.addEventListener(
        "input",
        function() {

            campoIcao.value =
                campoIcao.value
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "")
                    .substring(0, 4);

        }
    );


    campoIcao.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                pesquisarAerodromo();

            }

        }
    );

}


// ==========================================
// ELEMENTOS DO ACERVO FOTOGRÁFICO
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
// ABRIR FORMULÁRIO DE FOTO
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


if (btnCancelarFoto) {

    btnCancelarFoto.addEventListener(
        "click",
        limparFormularioFoto
    );

}


// ==========================================
// FORMATAÇÃO ICAO DA FOTO
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
                    campoObservacaoFoto.value.trim()

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
// LOCAL STORAGE - FOTOS
// ==========================================

function obterChaveFotos(matricula) {

    return (
        "leospotter_fotos_" +
        normalizarMatricula(matricula)
    );

}


function carregarFotosAeronave(matricula) {

    const chave =
        obterChaveFotos(matricula);

    const dados =
        localStorage.getItem(chave);


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

    if (!aeronaveAtual) return;


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


            if (!dados) continue;


            try {

                const fotos =
                    JSON.parse(dados);


                if (
                    !Array.isArray(fotos) ||
                    fotos.length === 0
                ) {

                    continue;

                }


                total += fotos.length;


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


    if (!confirmar) return;


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


// ==========================================
// CARREGAR BASES JSON
// ==========================================

carregarAeronaves();

carregarAerodromos();
// ==========================================
// LeoSpotter
// PESQUISA INTELIGENTE
//
// VERSÃO: 1.4.0
// ==========================================


// ==========================================
// ELEMENTOS DA PESQUISA INTELIGENTE
// ==========================================

const sugestoesAeronaves =
    document.getElementById("sugestoesAeronaves");

const sugestoesAerodromos =
    document.getElementById("sugestoesAerodromos");


// ==========================================
// CONFIGURAÇÕES
// ==========================================

const LIMITE_SUGESTOES = 5;

let indiceSugestaoAeronave = -1;
let indiceSugestaoAerodromo = -1;


// ==========================================
// NORMALIZAÇÃO PARA PESQUISA
// ==========================================

function normalizarTextoPesquisa(texto) {

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
// DESTACAR TEXTO PESQUISADO
// ==========================================

function destacarTexto(texto, pesquisa) {

    const original = String(texto || "");

    if (!pesquisa) {
        return escaparHtml(original);
    }

    const termo = escaparHtml(pesquisa);

    const partes = original.split(
        new RegExp(`(${pesquisa.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    );

    return partes.map(function(parte) {

        if (
            normalizarTextoPesquisa(parte) ===
            normalizarTextoPesquisa(pesquisa)
        ) {

            return `<mark>${escaparHtml(parte)}</mark>`;

        }

        return escaparHtml(parte);

    }).join("");

}


// ==========================================
// PESQUISA DE AERONAVES
// ==========================================

function gerarSugestoesAeronaves() {

    if (!sugestoesAeronaves || !campoMatricula) {
        return;
    }

    const termoOriginal = campoMatricula.value.trim();

    const termo = normalizarTextoPesquisa(
        termoOriginal
    );

    sugestoesAeronaves.innerHTML = "";

    indiceSugestaoAeronave = -1;


    if (!termo) {

        sugestoesAeronaves.classList.add("hidden");

        return;

    }


    if (!Array.isArray(aeronaves) || aeronaves.length === 0) {

        sugestoesAeronaves.classList.add("hidden");

        return;

    }


    const resultados = aeronaves
        .filter(function(aeronave) {

            if (!aeronave) {
                return false;
            }

            const matricula =
                normalizarTextoPesquisa(
                    aeronave.matricula
                );

            const modelo =
                normalizarTextoPesquisa(
                    aeronave.modelo
                );

            const fabricante =
                normalizarTextoPesquisa(
                    aeronave.fabricante
                );

            return (
                matricula.includes(termo) ||
                modelo.includes(termo) ||
                fabricante.includes(termo)
            );

        })
        .slice(0, LIMITE_SUGESTOES);


    if (resultados.length === 0) {

        sugestoesAeronaves.classList.add("hidden");

        return;

    }


    resultados.forEach(function(aeronave, indice) {

        const item =
            document.createElement("button");

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

                ${destacarTexto(
                    matricula,
                    termoOriginal
                )}

            </span>

            <span class="sugestao-subtitulo">

                ${escaparHtml(
                    fabricante
                )}

                ${fabricante && modelo ? " " : ""}

                ${escaparHtml(
                    modelo
                )}

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


        sugestoesAeronaves.appendChild(item);

    });


    sugestoesAeronaves.classList.remove(
        "hidden"
    );

}


// ==========================================
// FECHAR SUGESTÕES DE AERONAVES
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
// NAVEGAÇÃO DAS SUGESTÕES DE AERONAVES
// ==========================================

function navegarSugestoesAeronaves(event) {

    if (
        !sugestoesAeronaves ||
        sugestoesAeronaves.classList.contains("hidden")
    ) {
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


    else if (
        event.key === "Enter" &&
        indiceSugestaoAeronave >= 0
    ) {

        event.preventDefault();

        itens[
            indiceSugestaoAeronave
        ].click();

    }


    else if (event.key === "Escape") {

        fecharSugestoesAeronaves();

    }

}


// ==========================================
// PESQUISA DE AERÓDROMOS
// ==========================================

function gerarSugestoesAerodromos() {

    if (!sugestoesAerodromos || !campoIcao) {
        return;
    }

    const termoOriginal =
        campoIcao.value.trim();

    const termo =
        normalizarTextoPesquisa(
            termoOriginal
        );


    sugestoesAerodromos.innerHTML = "";

    indiceSugestaoAerodromo = -1;


    if (!termo) {

        sugestoesAerodromos.classList.add(
            "hidden"
        );

        return;

    }


    if (
        !Array.isArray(aerodromos) ||
        aerodromos.length === 0
    ) {

        sugestoesAerodromos.classList.add(
            "hidden"
        );

        return;

    }


    const resultados =
        aerodromos
            .filter(function(aero) {

                if (!aero) {
                    return false;
                }


                const icao =
                    normalizarTextoPesquisa(
                        aero.icao
                    );

                const nome =
                    normalizarTextoPesquisa(
                        aero.nome
                    );

                const municipio =
                    normalizarTextoPesquisa(
                        aero.municipio
                    );

                const municipioServido =
                    normalizarTextoPesquisa(
                        aero.municipio_servido
                    );

                return (
                    icao.includes(termo) ||
                    nome.includes(termo) ||
                    municipio.includes(termo) ||
                    municipioServido.includes(termo)
                );

            })
            .slice(0, LIMITE_SUGESTOES);


    if (resultados.length === 0) {

        sugestoesAerodromos.classList.add(
            "hidden"
        );

        return;

    }


    resultados.forEach(function(aero) {

        const item =
            document.createElement("button");

        item.type = "button";

        item.className =
            "sugestao-item";


        const icao =
            aero.icao || "—";

        const nome =
            aero.nome || "Nome não informado";

        const cidade =
            aero.municipio_servido ||
            aero.municipio ||
            aero.cidade ||
            "";


        item.innerHTML = `

            <span class="sugestao-titulo">

                ${destacarTexto(
                    icao,
                    termoOriginal
                )}

                <span class="sugestao-separador">
                    —
                </span>

                ${destacarTexto(
                    nome,
                    termoOriginal
                )}

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

    });


    sugestoesAerodromos.classList.remove(
        "hidden"
    );

}


// ==========================================
// FECHAR SUGESTÕES DE AERÓDROMOS
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
// NAVEGAÇÃO DAS SUGESTÕES DE AERÓDROMOS
// ==========================================

function navegarSugestoesAerodromos(event) {

    if (
        !sugestoesAerodromos ||
        sugestoesAerodromos.classList.contains("hidden")
    ) {
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


    else if (
        event.key === "Enter" &&
        indiceSugestaoAerodromo >= 0
    ) {

        event.preventDefault();

        itens[
            indiceSugestaoAerodromo
        ].click();

    }


    else if (event.key === "Escape") {

        fecharSugestoesAerodromos();

    }

}


// ==========================================
// ITEM SELECIONADO
// ==========================================

function atualizarItemSelecionado(
    itens,
    indice
) {

    itens.forEach(function(item, index) {

        if (index === indice) {

            item.classList.add(
                "selecionado"
            );

            item.scrollIntoView({
                block: "nearest"
            });

        }

        else {

            item.classList.remove(
                "selecionado"
            );

        }

    });

}


// ==========================================
// EVENTOS - AERONAVES
// ==========================================

if (campoMatricula) {

    campoMatricula.addEventListener(
        "input",
        gerarSugestoesAeronaves
    );


    campoMatricula.addEventListener(
        "keydown",
        navegarSugestoesAeronaves
    );

}


// ==========================================
// EVENTOS - AERÓDROMOS
// ==========================================

if (campoIcao) {

    campoIcao.addEventListener(
        "input",
        gerarSugestoesAerodromos
    );


    campoIcao.addEventListener(
        "keydown",
        navegarSugestoesAerodromos
    );

}


// ==========================================
// FECHAR SUGESTÕES AO CLICAR FORA
// ==========================================

document.addEventListener(
    "click",
    function(event) {

        if (
            campoMatricula &&
            sugestoesAeronaves &&
            !campoMatricula.contains(event.target) &&
            !sugestoesAeronaves.contains(event.target)
        ) {

            fecharSugestoesAeronaves();

        }


        if (
            campoIcao &&
            sugestoesAerodromos &&
            !campoIcao.contains(event.target) &&
            !sugestoesAerodromos.contains(event.target)
        ) {

            fecharSugestoesAerodromos();

        }

    }
);


// ==========================================
// VERSÃO 1.4.0
// ==========================================

const VERSAO_SITE_140 = "1.4.0";

if (typeof VERSAO_SITE !== "undefined") {

    // Mantém a variável original do sistema.
    // A versão principal continua sendo controlada
    // pela constante existente no início do app.js.

}

const elementoVersao =
    document.getElementById("versaoSite");

if (elementoVersao) {

    elementoVersao.textContent =
        `v${VERSAO_SITE_140}`;

}
