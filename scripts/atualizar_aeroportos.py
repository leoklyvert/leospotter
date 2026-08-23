import csv
import io
import json
import re
import time
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path


# ============================================================
# CONFIGURAÇÃO
# ============================================================

BASE = Path("data/aeroportos.json")
CURSOR = Path("data/aeroportos_cursor.json")

SIROS = (
    "https://siros.anac.gov.br/"
    "siros/registros/aerodromo/aerodromos.csv"
)

LIMITE = 100
INTERVALO = 0.5

PRIORITARIOS = [
    "SSCL",
    "SBUR",
]


# ============================================================
# DOWNLOAD
# ============================================================

def baixar(url):

    requisicao = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0"
        }
    )

    with urllib.request.urlopen(
        requisicao,
        timeout=60
    ) as resposta:

        return (
            resposta.status,
            resposta.read()
        )


# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================

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


# ============================================================
# CONSULTA AISWEB
# ============================================================

def consultar_aisweb(icao):

    url = (
        "https://aisweb.decea.mil.br/"
        "?codigo="
        + icao
        + "&i=aerodromos"
    )

    status, conteudo = baixar(url)

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

    texto = re.sub(
        r"[ \t]+",
        " ",
        texto
    )

    texto = re.sub(
        r"\n\s*\n+",
        "\n",
        texto
    )

    texto = texto.strip()

    texto_upper = texto.upper()

    resultado = {

        "pistas": [],

        "frequencias": [],

        "distancias_declaradas": [],

        "atualizacao": None

    }

    # ========================================================
    # PISTAS
    # ========================================================

    padrao_pista = re.search(

        r"(\d{2})\s*-\s*.*?"
        r"\(\s*"
        r"(\d+)\s*[xX]\s*(\d+)"
        r"\s+([A-Z0-9]+)"
        r"\s+([0-9]+/[A-Z0-9/]+)"
        r".*?"
        r"-\s*(\d{2})",

        texto_upper,

        re.S

    )

    if padrao_pista:

        resultado["pistas"].append({

            "identificacao":
                padrao_pista.group(1)
                + "/"
                + padrao_pista.group(6),

            "piso":
                padrao_pista.group(4),

            "dimensoes":
                padrao_pista.group(2)
                + " x "
                + padrao_pista.group(3)
                + " m",

            "resistencia":
                padrao_pista.group(5)

        })

    # ========================================================
    # FREQUÊNCIAS
    # ========================================================

    frequencias = re.findall(

        r"(?:COM\s*-\s*)?"
        r"([A-ZÀ-Ú0-9 /-]{2,40})"
        r"\s+\[\d+\]"
        r"(?:\s+\[\d+\])*"
        r"\s+"
        r"(\d{3}\.\d{3})",

        texto_upper

    )

    for orgao, valor in frequencias:

        orgao = orgao.strip()

        existe = any(

            frequencia["orgao"] == orgao
            and
            frequencia["valor"] == valor

            for frequencia
            in resultado["frequencias"]

        )

        if not existe:

            resultado["frequencias"].append({

                "orgao":
                    orgao,

                "valor":
                    valor,

                "observacao":
                    ""

            })

    # ========================================================
    # DISTÂNCIAS DECLARADAS
    # ========================================================

    encontrados = re.findall(

        r"(\d{2})\s+"
        r"(\d{3,5})\s+"
        r"(\d{3,5})\s+"
        r"(\d{3,5})\s+"
        r"(\d{3,5})",

        texto

    )

    vistos = set()

    for valores in encontrados:

        if valores in vistos:

            continue

        vistos.add(valores)

        (
            rwy,
            tora,
            toda,
            asda,
            lda
        ) = valores

        resultado[
            "distancias_declaradas"
        ].append({

            "rwy":
                rwy,

            "tora":
                int(tora),

            "toda":
                int(toda),

            "asda":
                int(asda),

            "lda":
                int(lda)

        })

    # ========================================================
    # DATA AISWEB
    # ========================================================

    padrao_data = re.search(

        r"ÚLTIMA ATUALIZAÇÃO"
        r"\s*:?\s*"
        r"(\d{2}/\d{2}/\d{4})",

        texto_upper

    )

    if padrao_data:

        resultado["atualizacao"] = (
            padrao_data.group(1)
        )

    # ========================================================
    # VALIDAÇÃO
    # ========================================================

    if not resultado["pistas"]:

        raise RuntimeError(
            "Nenhuma pista encontrada."
        )

    if not resultado["frequencias"]:

        raise RuntimeError(
            "Nenhuma frequência encontrada."
        )

    print(
        "  HTTP:",
        status,
        "| pistas:",
        len(resultado["pistas"]),
        "| frequências:",
        len(resultado["frequencias"]),
        "| distâncias:",
        len(resultado["distancias_declaradas"])
    )

    return resultado


# ============================================================
# MAIN
# ============================================================

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

    # ========================================================
    # CARREGAR BASE
    # ========================================================

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

    print(
        "Base inicial:",
        len(aeroportos),
        "aeródromos"
    )

    print()

    # ========================================================
    # ÍNDICE
    # ========================================================

    indice = {}

    for aeroporto in aeroportos:

        icao = limpar(
            aeroporto.get("icao")
        ).upper()

        if re.fullmatch(
            r"[A-Z0-9]{4}",
            icao
        ):

            aeroporto["icao"] = icao

            indice[icao] = aeroporto

    # ========================================================
    # SIROS / ANAC
    # ========================================================

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
            io.StringIO(texto_csv),
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

    for registro in registros:

        icao = campo(

            registro,

            "SIGLA ICAO AERÓDROMO",

            "ICAO",

            "ICAO AERÓDROMO"

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
                    None

            }

            aeroportos.append(
                aeroporto
            )

            indice[icao] = aeroporto

            novos += 1

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
            )

        }

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

    # ========================================================
    # CURSOR
    # ========================================================

    cursor = 0

    if CURSOR.exists():

        try:

            dados_cursor = json.loads(

                CURSOR.read_text(
                    encoding="utf-8"
                )

            )

            cursor = int(

                dados_cursor.get(
                    "cursor",
                    0
                )

            )

        except Exception:

            cursor = 0

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

        inicio = cursor % len(
            normais
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

    proximo_cursor = (

        inicio
        +
        len(lote_normal)

    )

    if normais:

        proximo_cursor %= len(
            normais
        )

    # ========================================================
    # AISWEB
    # ========================================================

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

            aeroporto[
                "pistas"
            ] = dados[
                "pistas"
            ]

            aeroporto[
                "frequencias"
            ] = dados[
                "frequencias"
            ]

            aeroporto[
                "distancias_declaradas"
            ] = dados[
                "distancias_declaradas"
            ]

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

    # ========================================================
    # ORDENAR
    # ========================================================

    aeroportos.sort(

        key=lambda aeroporto:

        limpar(
            aeroporto.get(
                "icao",
                ""
            )
        ).upper()

    )

    # ========================================================
    # SALVAR BASE
    # ========================================================

    BASE.write_text(

        json.dumps(

            aeroportos,

            ensure_ascii=False,

            indent=2

        )
        + "\n",

        encoding="utf-8"

    )

    # ========================================================
    # SALVAR CURSOR
    # ========================================================

    CURSOR.write_text(

        json.dumps(

            {

                "cursor":
                    proximo_cursor,

                "total_icaos":
                    len(icaos),

                "ultima_execucao":
                    datetime.now(
                        timezone.utc
                    ).isoformat()

            },

            ensure_ascii=False,

            indent=2

        )
        + "\n",

        encoding="utf-8"

    )

    # ========================================================
    # VALIDAÇÕES FINAIS
    # ========================================================

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

    # ========================================================
    # RESULTADO
    # ========================================================

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


# ============================================================
# EXECUÇÃO
# ============================================================

if __name__ == "__main__":

    main()
