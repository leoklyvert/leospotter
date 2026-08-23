import csv
import io
import json
import re
import time
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path


BASE = Path("data/aeroportos.json")
CURSOR = Path("data/aeroportos_cursor.json")

SIROS = (
    "https://siros.anac.gov.br/"
    "siros/registros/aerodromo/aerodromos.csv"
)

AISWEB = "https://aisweb.decea.mil.br/?codigo={}&i=aerodromos"

LIMITE = 100
INTERVALO = 0.5

PRIORITARIOS = [
    "SSCL",
    "SBUR",
]


# ==========================================================
# DOWNLOAD
# ==========================================================

def baixar(url):

    requisicao = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/120 Safari/537.36"
            )
        },
    )

    with urllib.request.urlopen(
        requisicao,
        timeout=60
    ) as resposta:

        return resposta.status, resposta.read()


# ==========================================================
# UTILITÁRIOS
# ==========================================================

def limpar(valor):

    return str(
        valor or ""
    ).strip()


def campo(registro, *nomes):

    for nome in nomes:

        if nome in registro:

            valor = limpar(
                registro[nome]
            )

            if valor:
                return valor

    return ""


def limpar_html(conteudo):

    texto = conteudo.decode(
        "utf-8",
        errors="replace"
    )

    texto = unescape(texto)

    texto = re.sub(
        r"<script.*?</script>",
        " ",
        texto,
        flags=re.I | re.S
    )

    texto = re.sub(
        r"<style.*?</style>",
        " ",
        texto,
        flags=re.I | re.S
    )

    texto = re.sub(
        r"<br\s*/?>",
        "\n",
        texto,
        flags=re.I
    )

    texto = re.sub(
        r"</p>|</div>|</tr>|</li>|</h[1-6]>",
        "\n",
        texto,
        flags=re.I
    )

    texto = re.sub(
        r"<[^>]+>",
        " ",
        texto
    )

    texto = texto.replace(
        "\xa0",
        " "
    )

    texto = re.sub(
        r"[ \t]+",
        " ",
        texto
    )

    texto = re.sub(
        r"\n[ \t]+",
        "\n",
        texto
    )

    texto = re.sub(
        r"\n\s*\n+",
        "\n",
        texto
    )

    return texto.strip()


def obter_linhas(texto):

    resultado = []

    for linha in texto.splitlines():

        linha = limpar(linha)

        if linha:

            resultado.append(linha)

    return resultado


def numero_inteiro(valor):

    valor = limpar(valor)

    valor = valor.replace(
        ".",
        ""
    )

    valor = valor.replace(
        ",",
        ""
    )

    if re.fullmatch(
        r"-?\d+",
        valor
    ):

        return int(valor)

    return None


# ==========================================================
# PISTAS / CABECEIRAS
# ==========================================================

def extrair_pistas(linhas_texto):

    resultado = []

    inicio = None

    for i, linha in enumerate(linhas_texto):

        if (
            "DISTÂNCIA(S) DECLARADA(S)"
            in linha.upper()
        ):

            inicio = i

            break

    if inicio is None:

        return resultado

    i = inicio + 1

    while i < len(linhas_texto):

        linha = linhas_texto[i]

        upper = linha.upper()

        if upper.startswith("COMPL"):

            break

        if upper in (
            "RWY",
            "TORA(M)",
            "TODA(M)",
            "ASDA(M)",
            "LDA(M)",
            "ALT. GEOIDAL(M)",
            "COORDENADAS",
        ):

            i += 1

            continue

        # --------------------------------------------------
        # IDENTIFICAÇÃO DA CABECEIRA
        # --------------------------------------------------

        if re.fullmatch(
            r"\d{2}",
            linha
        ):

            rwy = linha

            valores = []

            j = i + 1

            # --------------------------------------------------
            # TORA / TODA / ASDA / LDA / ALT GEOIDAL
            # --------------------------------------------------

            while (
                j < len(linhas_texto)
                and len(valores) < 5
            ):

                candidato = linhas_texto[j]

                if re.fullmatch(
                    r"-?\d+(?:[.,]\d+)?",
                    candidato
                ):

                    valores.append(
                        candidato
                    )

                    j += 1

                    continue

                break

            # --------------------------------------------------
            # COORDENADAS
            # --------------------------------------------------

            if (
                len(valores) == 5
                and j < len(linhas_texto)
            ):

                coordenada = linhas_texto[j]

                padrao_coordenada = (
                    r"^[NS]\s+"
                    r"\d{1,2}\s+"
                    r"\d{1,2}\s+"
                    r"\d+(?:\.\d+)?\s+"
                    r"[EW]\s+"
                    r"\d{1,3}\s+"
                    r"\d{1,2}\s+"
                    r"\d+(?:\.\d+)?$"
                )

                if re.match(
                    padrao_coordenada,
                    coordenada,
                    flags=re.I
                ):

                    tora = numero_inteiro(
                        valores[0]
                    )

                    toda = numero_inteiro(
                        valores[1]
                    )

                    asda = numero_inteiro(
                        valores[2]
                    )

                    lda = numero_inteiro(
                        valores[3]
                    )

                    try:

                        altitude = float(
                            valores[4].replace(
                                ",",
                                "."
                            )
                        )

                    except ValueError:

                        altitude = None

                    item = {

                        "identificacao":
                            rwy,

                        "tora":
                            tora,

                        "toda":
                            toda,

                        "asda":
                            asda,

                        "lda":
                            lda,

                        "altitude_geoidal":
                            altitude,

                        "coordenadas":
                            coordenada,

                    }

                    if item not in resultado:

                        resultado.append(
                            item
                        )

                    i = j + 1

                    continue

        i += 1

    return resultado


# ==========================================================
# FREQUÊNCIAS
# ==========================================================

def extrair_frequencias(linhas_texto):

    resultado = []

    padrao = re.compile(

        r"^(?:COM\s*-\s*)?"
        r"(.+?)\s+\[\d+\]"
        r"(?:\s+\[\d+\])*"
        r"\s+"
        r"(\d{3}\.\d{3})$",

        re.I
    )

    for linha in linhas_texto:

        correspondencia = padrao.search(
            linha
        )

        if not correspondencia:

            continue

        orgao = limpar(
            correspondencia.group(1)
        )

        valor = correspondencia.group(2)

        if len(orgao) > 60:

            continue

        item = {

            "orgao":
                orgao,

            "valor":
                valor,

            "observacao":
                "",

        }

        if item not in resultado:

            resultado.append(
                item
            )

    return resultado


# ==========================================================
# DATA AISWEB
# ==========================================================

def extrair_atualizacao(texto):

    correspondencia = re.search(

        r"ÚLTIMA ATUALIZAÇÃO"
        r"\s*:?\s*"
        r"(\d{2}/\d{2}/\d{4})",

        texto.upper()
    )

    if correspondencia:

        return correspondencia.group(1)

    return None


# ==========================================================
# CONSULTA AISWEB
# ==========================================================

def consultar_aisweb(icao):

    url = AISWEB.format(
        icao
    )

    status, conteudo = baixar(
        url
    )

    texto = limpar_html(
        conteudo
    )

    lista = obter_linhas(
        texto
    )

    pistas = extrair_pistas(
        lista
    )

    frequencias = extrair_frequencias(
        lista
    )

    atualizacao = extrair_atualizacao(
        texto
    )

    if not pistas:

        raise RuntimeError(
            "Nenhuma pista/cabeceira encontrada no AISWEB."
        )

    if not frequencias:

        raise RuntimeError(
            "Nenhuma frequência encontrada no AISWEB."
        )

    print(
        "  HTTP:",
        status,
        "| pistas:",
        len(pistas),
        "| frequências:",
        len(frequencias)
    )

    return {

        "pistas":
            pistas,

        "frequencias":
            frequencias,

        "atualizacao":
            atualizacao,

    }


# ==========================================================
# CARREGAR BASE
# ==========================================================

def carregar_base():

    if not BASE.exists():

        raise RuntimeError(
            "data/aeroportos.json não encontrado."
        )

    with BASE.open(
        "r",
        encoding="utf-8"
    ) as arquivo:

        aeroportos = json.load(
            arquivo
        )

    if not isinstance(
        aeroportos,
        list
    ):

        raise RuntimeError(
            "aeroportos.json não contém uma lista."
        )

    if len(aeroportos) < 7000:

        raise RuntimeError(

            "ERRO CRÍTICO: base possui apenas "
            + str(len(aeroportos))
            + " registros. "
            "Mínimo esperado: 7000."

        )

    return aeroportos


# ==========================================================
# ATUALIZAR ANAC
# ==========================================================

def atualizar_anac(
    aeroportos,
    indice
):

    print(
        "========================================"
    )

    print(
        "ANAC / SIROS"
    )

    print(
        "========================================"
    )

    status, conteudo = baixar(
        SIROS
    )

    texto_csv = conteudo.decode(
        "utf-8-sig",
        errors="replace"
    )

    registros = list(
        csv.DictReader(
            io.StringIO(
                texto_csv
            ),
            delimiter=";"
        )
    )

    print(
        "HTTP:",
        status
    )

    print(
        "Registros SIROS:",
        len(registros)
    )

    print()

    novos = 0

    campos = {

        "nome": (
            "NOME AERÓDROMO",
        ),

        "iata": (
            "SIGLA IATA AERÓDROMO",
        ),

        "municipio": (
            "MUNICÍPIO AERÓDROMO",
        ),

        "uf": (
            "ESTADO AERÓDROMO",
        ),

        "pais": (
            "PAÍS AERÓDROMO",
        ),

        "latitude": (
            "LATITUDE",
        ),

        "longitude": (
            "LONGITUDE",
        ),

    }

    for registro in registros:

        icao = campo(

            registro,

            "SIGLA ICAO AERÓDROMO",

            "ICAO",

            "ICAO AERÓDROMO",

        ).upper()

        if not re.fullmatch(
            r"[A-Z0-9]{4}",
            icao
        ):

            continue

        aeroporto = indice.get(
            icao
        )

        if aeroporto is None:

            aeroporto = {

                "icao":
                    icao,

                "pistas":
                    [],

                "frequencias":
                    [],

                "distancias_declaradas":
                    [],

                "ultima_atualizacao_aisweb":
                    None,

            }

            aeroportos.append(
                aeroporto
            )

            indice[icao] = aeroporto

            novos += 1

        for chave, nomes in campos.items():

            valor = campo(
                registro,
                *nomes
            )

            if valor:

                aeroporto[chave] = valor

    print(
        "Novos registros ANAC:",
        novos
    )

    print(
        "Base após ANAC:",
        len(aeroportos)
    )

    print()


# ==========================================================
# CURSOR
# ==========================================================

def obter_cursor():

    if not CURSOR.exists():

        return 0

    try:

        dados = json.loads(
            CURSOR.read_text(
                encoding="utf-8"
            )
        )

        return int(
            dados.get(
                "cursor",
                0
            )
        )

    except Exception:

        return 0


def montar_lote(
    indice,
    cursor
):

    icaos = sorted(
        indice.keys()
    )

    normais = [

        icao

        for icao in icaos

        if icao not in PRIORITARIOS

    ]

    prioritarios = [

        icao

        for icao in PRIORITARIOS

        if icao in indice

    ]

    if normais:

        inicio = (
            cursor
            % len(normais)
        )

    else:

        inicio = 0

    quantidade_normal = max(

        0,

        LIMITE
        -
        len(prioritarios)

    )

    lote_normal = normais[
        inicio:
        inicio + quantidade_normal
    ]

    lote = (
        prioritarios
        +
        lote_normal
    )

    proximo = (
        inicio
        +
        len(lote_normal)
    )

    if normais:

        proximo %= len(
            normais
        )

    return (
        icaos,
        lote,
        proximo,
        inicio
    )


# ==========================================================
# SALVAR
# ==========================================================

def salvar_json(
    aeroportos
):

    BASE.write_text(

        json.dumps(
            aeroportos,
            ensure_ascii=False,
            indent=2
        )
        + "\n",

        encoding="utf-8"

    )


def salvar_cursor(
    cursor,
    total
):

    CURSOR.write_text(

        json.dumps(

            {

                "cursor":
                    cursor,

                "total_icaos":
                    total,

                "ultima_execucao":
                    datetime.now(
                        timezone.utc
                    ).isoformat(),

            },

            ensure_ascii=False,

            indent=2

        )
        + "\n",

        encoding="utf-8"

    )


# ==========================================================
# MAIN
# ==========================================================

def main():

    print(
        "========================================"
    )

    print(
        "LEOSPOTTER"
    )

    print(
        "ATUALIZAÇÃO DA BASE DE AERÓDROMOS"
    )

    print(
        "========================================"
    )

    print()

    aeroportos = carregar_base()

    print(
        "Base inicial:",
        len(aeroportos),
        "aeródromos"
    )

    print()

    # ------------------------------------------------------
    # ÍNDICE
    # ------------------------------------------------------

    indice = {}

    for aeroporto in aeroportos:

        icao = limpar(
            aeroporto.get(
                "icao"
            )
        ).upper()

        if re.fullmatch(
            r"[A-Z0-9]{4}",
            icao
        ):

            aeroporto["icao"] = icao

            indice[icao] = aeroporto

    # ------------------------------------------------------
    # ANAC
    # ------------------------------------------------------

    atualizar_anac(
        aeroportos,
        indice
    )

    # ------------------------------------------------------
    # CURSOR
    # ------------------------------------------------------

    cursor = obter_cursor()

    (
        icaos,
        lote,
        proximo_cursor,
        inicio
    ) = montar_lote(
        indice,
        cursor
    )

    print(
        "========================================"
    )

    print(
        "AISWEB"
    )

    print(
        "========================================"
    )

    print(
        "ICAOs disponíveis:",
        len(icaos)
    )

    print(
        "Cursor atual:",
        inicio
    )

    print(
        "Consultas nesta execução:",
        len(lote)
    )

    print(
        "Próximo cursor:",
        proximo_cursor
    )

    print()

    # ------------------------------------------------------
    # CONSULTAS
    # ------------------------------------------------------

    sucesso = 0
    erros = 0

    for numero, icao in enumerate(
        lote,
        start=1
    ):

        print(
            f"[{numero}/{len(lote)}] {icao}"
        )

        try:

            dados = consultar_aisweb(
                icao
            )

            aeroporto = indice[
                icao
            ]

            # --------------------------------------------------
            # PISTAS
            # --------------------------------------------------

            aeroporto[
                "pistas"
            ] = dados[
                "pistas"
            ]

            # --------------------------------------------------
            # FREQUÊNCIAS
            # --------------------------------------------------

            aeroporto[
                "frequencias"
            ] = dados[
                "frequencias"
            ]

            # --------------------------------------------------
            # COMPATIBILIDADE COM CAMPO ANTIGO
            # --------------------------------------------------

            aeroporto[
                "distancias_declaradas"
            ] = []

            for pista in dados[
                "pistas"
            ]:

                if all(

                    pista.get(
                        chave
                    ) is not None

                    for chave in (
                        "tora",
                        "toda",
                        "asda",
                        "lda"
                    )

                ):

                    aeroporto[
                        "distancias_declaradas"
                    ].append(

                        {

                            "rwy":
                                pista[
                                    "identificacao"
                                ],

                            "tora":
                                pista[
                                    "tora"
                                ],

                            "toda":
                                pista[
                                    "toda"
                                ],

                            "asda":
                                pista[
                                    "asda"
                                ],

                            "lda":
                                pista[
                                    "lda"
                                ],

                        }

                    )

            # --------------------------------------------------
            # DATA
            # --------------------------------------------------

            aeroporto[
                "ultima_atualizacao_aisweb"
            ] = (

                dados[
                    "atualizacao"
                ]

                or

                datetime.now(
                    timezone.utc
                ).strftime(
                    "%Y-%m-%d"
                )

            )

            sucesso += 1

            print(
                "  ✓ atualizado"
            )

        except Exception as erro:

            erros += 1

            print(
                "  ! erro:",
                erro
            )

            print(
                "    Dados anteriores preservados."
            )

        time.sleep(
            INTERVALO
        )

    # ------------------------------------------------------
    # ORDENAR
    # ------------------------------------------------------

    aeroportos.sort(

        key=lambda aeroporto:
        limpar(
            aeroporto.get(
                "icao",
                ""
            )
        ).upper()

    )

    # ------------------------------------------------------
    # VALIDAÇÕES
    # ------------------------------------------------------

    if len(aeroportos) < 7000:

        raise RuntimeError(

            "ERRO CRÍTICO após atualização: "
            "base possui apenas "
            + str(len(aeroportos))
            + " registros."

        )

    if "SSCL" not in indice:

        raise RuntimeError(
            "ERRO CRÍTICO: SSCL não encontrado."
        )

    if "SBUR" not in indice:

        raise RuntimeError(
            "ERRO CRÍTICO: SBUR não encontrado."
        )

    # ------------------------------------------------------
    # SALVAR
    # ------------------------------------------------------

    salvar_json(
        aeroportos
    )

    salvar_cursor(
        proximo_cursor,
        len(icaos)
    )

    # ------------------------------------------------------
    # RESULTADO
    # ------------------------------------------------------

    print()

    print(
        "========================================"
    )

    print(
        "RESULTADO"
    )

    print(
        "========================================"
    )

    print(
        "Total de aeródromos:",
        len(aeroportos)
    )

    print(
        "Consultas AISWEB:",
        len(lote)
    )

    print(
        "Sucesso AISWEB:",
        sucesso
    )

    print(
        "Erros AISWEB:",
        erros
    )

    print(
        "SSCL: ✓"
    )

    print(
        "SBUR: ✓"
    )

    print(
        "Próximo cursor:",
        proximo_cursor
    )

    print()

    print(
        "========================================"
    )

    print(
        "✓ ATUALIZAÇÃO CONCLUÍDA"
    )

    print(
        "========================================"


if __name__ == "__main__":

    main()
