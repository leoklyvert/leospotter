# ==========================================
# LeoSpotter
# Atualização automática da base de aeródromos
#
# Fontes:
# - ANAC / SIROS
# - AISWEB / DECEA
#
# VERSÃO: 2.0.0
# ==========================================

import csv
import io
import json
import re
import time
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path


# ==========================================
# CONFIGURAÇÕES
# ==========================================

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


# ==========================================
# DOWNLOAD
# ==========================================

def baixar(url):

    requisicao = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/131.0 Safari/537.36"
            ),
            "Accept": (
                "text/html,"
                "application/xhtml+xml,"
                "application/xml;q=0.9,"
                "*/*;q=0.8"
            ),
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
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


# ==========================================
# LIMPEZA
# ==========================================

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


# ==========================================
# NORMALIZAÇÃO DO HTML
# ==========================================

def limpar_html(conteudo):

    texto = conteudo.decode(
        "utf-8",
        errors="replace"
    )

    texto = unescape(texto)

    # Remover scripts
    texto = re.sub(
        r"<script\b.*?</script>",
        " ",
        texto,
        flags=re.I | re.S
    )

    # Remover estilos
    texto = re.sub(
        r"<style\b.*?</style>",
        " ",
        texto,
        flags=re.I | re.S
    )

    # Quebras de linha importantes
    texto = re.sub(
        r"<br\s*/?>",
        "\n",
        texto,
        flags=re.I
    )

    texto = re.sub(
        r"</(?:p|div|tr|td|th|li|h[1-6])>",
        "\n",
        texto,
        flags=re.I
    )

    # Remover restante das tags
    texto = re.sub(
        r"<[^>]+>",
        " ",
        texto
    )

    # Entidades HTML restantes
    texto = unescape(texto)

    # Espaços
    texto = re.sub(
        r"[ \t]+",
        " ",
        texto
    )

    # Linhas vazias
    texto = re.sub(
        r"\n\s*\n+",
        "\n",
        texto
    )

    return texto.strip()


# ==========================================
# FREQUÊNCIAS
# ==========================================

def extrair_frequencias(texto):

    frequencias = []

    vistos = set()

    # Exemplos esperados:
    #
    # COM - RÁDIO [5] [6] 120.800
    # TWR [5] 118.300
    # RÁDIO 123.450
    #
    padroes = [

        r"(?:COM\s*-\s*)?"
        r"([A-ZÀ-Ú0-9 /.\-]{2,50}?)"
        r"(?:\s+\[\d+\])+"
        r"\s+"
        r"(\d{3}\.\d{3})",

        r"(?:COM\s*-\s*)?"
        r"([A-ZÀ-Ú0-9 /.\-]{2,50}?)"
        r"\s+"
        r"(\d{3}\.\d{3})",

    ]

    for padrao in padroes:

        encontrados = re.findall(
            padrao,
            texto.upper()
        )

        for orgao, valor in encontrados:

            orgao = re.sub(
                r"\s+",
                " ",
                orgao
            ).strip()

            valor = valor.strip()

            # Evitar capturar números que não sejam
            # frequências aeronáuticas válidas.
            try:

                frequencia = float(
                    valor
                )

                if (
                    frequencia < 118.000
                    or frequencia > 137.000
                ):

                    continue

            except ValueError:

                continue

            chave = (
                orgao,
                valor
            )

            if chave in vistos:

                continue

            vistos.add(
                chave
            )

            frequencias.append({

                "orgao": orgao,

                "valor": valor,

                "observacao": ""

            })

    return frequencias


# ==========================================
# PISTAS
# ==========================================

def extrair_pistas(texto):

    pistas = []

    vistos = set()

    texto_upper = texto.upper()

    # Formatos aproximados encontrados em
    # páginas ROTAER / AISWEB.
    padroes = [

        # 09/27 1500 X 30 ASP 12/F/B/W/T
        r"\b(\d{2})\s*/\s*(\d{2})"
        r".{0,300}?"
        r"(\d{3,5})\s*[Xx]\s*(\d{2,4})"
        r".{0,150}?"
        r"\b([A-Z0-9]{2,10})\b"
        r".{0,100}?"
        r"(\d{1,3}/[A-Z0-9/]+)",

        # 09 - 27 ... 1500 X 30
        r"\b(\d{2})\s*-\s*(\d{2})"
        r".{0,300}?"
        r"(\d{3,5})\s*[Xx]\s*(\d{2,4})"
        r".{0,150}?"
        r"\b([A-Z0-9]{2,10})\b"
        r".{0,100}?"
        r"(\d{1,3}/[A-Z0-9/]+)",

    ]

    for padrao in padroes:

        encontrados = re.findall(
            padrao,
            texto_upper,
            flags=re.S
        )

        for valores in encontrados:

            if len(valores) != 6:

                continue

            cabeceira_1 = valores[0]
            cabeceira_2 = valores[1]
            comprimento = valores[2]
            largura = valores[3]
            piso = valores[4]
            resistencia = valores[5]

            identificacao = (
                cabeceira_1
                + "/"
                + cabeceira_2
            )

            chave = (
                identificacao,
                comprimento,
                largura,
                piso,
                resistencia
            )

            if chave in vistos:

                continue

            vistos.add(
                chave
            )

            pistas.append({

                "identificacao":
                    identificacao,

                "piso":
                    piso,

                "dimensoes":
                    (
                        comprimento
                        + " x "
                        + largura
                        + " m"
                    ),

                "resistencia":
                    resistencia

            })

    return pistas


# ==========================================
# DISTÂNCIAS DECLARADAS
# ==========================================

def extrair_distancias(texto):

    distancias = []

    vistos = set()

    # Procura conjuntos de cinco números:
    #
    # RWY TORA TODA ASDA LDA
    #
    # Exemplo:
    # 09 1500 1500 1500 1500

    padrao = (
        r"\b(\d{2})\s+"
        r"(\d{3,5})\s+"
        r"(\d{3,5})\s+"
        r"(\d{3,5})\s+"
        r"(\d{3,5})\b"
    )

    encontrados = re.findall(
        padrao,
        texto
    )

    for valores in encontrados:

        if valores in vistos:

            continue

        vistos.add(
            valores
        )

        try:

            rwy = valores[0]

            tora = int(
                valores[1]
            )

            toda = int(
                valores[2]
            )

            asda = int(
                valores[3]
            )

            lda = int(
                valores[4]
            )

        except ValueError:

            continue

        distancias.append({

            "rwy": rwy,

            "tora": tora,

            "toda": toda,

            "asda": asda,

            "lda": lda

        })

    return distancias


# ==========================================
# DATA AISWEB
# ==========================================

def extrair_data(texto):

    padroes = [

        r"ÚLTIMA\s+ATUALIZAÇÃO"
        r"\s*:?\s*"
        r"(\d{2}/\d{2}/\d{4})",

        r"ULTIMA\s+ATUALIZAÇÃO"
        r"\s*:?\s*"
        r"(\d{2}/\d{2}/\d{4})",

        r"ATUALIZAÇÃO"
        r"\s*:?\s*"
        r"(\d{2}/\d{2}/\d{4})",

        r"ATUALIZACAO"
        r"\s*:?\s*"
        r"(\d{2}/\d{2}/\d{4})",

    ]

    texto_upper = texto.upper()

    for padrao in padroes:

        resultado = re.search(
            padrao,
            texto_upper
        )

        if resultado:

            return resultado.group(1)

    return None


# ==========================================
# CONSULTAR AISWEB
# ==========================================

def consultar_aisweb(icao):

    url = (
        "https://aisweb.decea.mil.br/"
        "?codigo="
        + icao
        + "&i=aerodromos"
    )

    status, conteudo = baixar(
        url
    )

    if status < 200 or status >= 300:

        raise RuntimeError(
            "HTTP "
            + str(status)
        )

    texto = limpar_html(
        conteudo
    )

    if not texto:

        raise RuntimeError(
            "Resposta AISWEB vazia"
        )

    texto_upper = texto.upper()

    # ======================================
    # VERIFICAR SE A PÁGINA É DO AERÓDROMO
    # ======================================

    encontrou_icao = bool(
        re.search(
            r"\b"
            + re.escape(icao.upper())
            + r"\b",
            texto_upper
        )
    )

    encontrou_conteudo_aerodromo = any(

        termo in texto_upper

        for termo in [

            "ROTAER",
            "PISTA",
            "FREQUÊNCIA",
            "FREQUENCIA",
            "DISTÂNCIAS DECLARADAS",
            "DISTANCIAS DECLARADAS",
            "AERÓDROMO",
            "AERODROMO",

        ]

    )

    if not encontrou_icao and not encontrou_conteudo_aerodromo:

        raise RuntimeError(
            "Página AISWEB não corresponde "
            "a um aeródromo"
        )

    # ======================================
    # EXTRAÇÃO
    # ======================================

    pistas = extrair_pistas(
        texto
    )

    frequencias = extrair_frequencias(
        texto
    )

    distancias = extrair_distancias(
        texto
    )

    atualizacao = extrair_data(
        texto
    )

    # ======================================
    # RESULTADO
    # ======================================

    resultado = {

        "pistas":
            pistas,

        "frequencias":
            frequencias,

        "distancias_declaradas":
            distancias,

        "atualizacao":
            atualizacao

    }

    # ======================================
    # DIAGNÓSTICO
    # ======================================

    print(
        "  HTTP:",
        status,
        "| pistas:",
        len(pistas),
        "| frequências:",
        len(frequencias),
        "| distâncias:",
        len(distancias),
        "| atualização:",
        atualizacao or "não encontrada"
    )

    return resultado


# ==========================================
# ATUALIZAR DADOS DO AERÓDROMO
# ==========================================

def aplicar_dados_aeroporto(
    aeroporto,
    dados
):

    alterou = False

    # --------------------------------------
    # PISTAS
    # --------------------------------------

    if dados["pistas"]:

        aeroporto["pistas"] = (
            dados["pistas"]
        )

        alterou = True

    # --------------------------------------
    # FREQUÊNCIAS
    # --------------------------------------

    if dados["frequencias"]:

        aeroporto["frequencias"] = (
            dados["frequencias"]
        )

        alterou = True

    # --------------------------------------
    # DISTÂNCIAS
    # --------------------------------------

    if dados[
        "distancias_declaradas"
    ]:

        aeroporto[
            "distancias_declaradas"
        ] = dados[
            "distancias_declaradas"
        ]

        alterou = True

    # --------------------------------------
    # DATA
    # --------------------------------------

    if dados["atualizacao"]:

        aeroporto[
            "ultima_atualizacao_aisweb"
        ] = dados[
            "atualizacao"
        ]

        alterou = True

    elif alterou:

        aeroporto[
            "ultima_atualizacao_aisweb"
        ] = datetime.now(
            timezone.utc
        ).strftime(
            "%Y-%m-%d"
        )

    return alterou


# ==========================================
# MAIN
# ==========================================

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
        "VERSÃO 2.0.0"
    )

    print(
        "========================================"
    )

    print()

    # ======================================
    # BASE EXISTENTE
    # ======================================

    if not BASE.exists():

        raise RuntimeError(
            "data/aeroportos.json "
            "não encontrado."
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
            "aeroportos.json não contém "
            "uma lista."
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

    # ======================================
    # ÍNDICE
    # ======================================

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

    # ======================================
    # SIROS / ANAC
    # ======================================

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

                "icao": icao,

                "pistas": [],

                "frequencias": [],

                "distancias_declaradas": [],

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

    # ======================================
    # CURSOR
    # ======================================

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
        LIMITE - len(
            prioritarios
        )
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

    # ======================================
    # AISWEB
    # ======================================

    print(
        "========================================"
    )

    print(
        "AISWEB / DECEA"
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

    # ======================================
    # CONTADORES
    # ======================================

    consultas = 0

    respostas_ok = 0

    erros = 0

    atualizados = 0

    pistas_atualizadas = 0

    frequencias_atualizadas = 0

    distancias_atualizadas = 0

    sem_dados_adicionais = 0

    # ======================================
    # CONSULTAS
    # ======================================

    for numero, icao in enumerate(
        lote,
        start=1
    ):

        consultas += 1

        print(
            f"[{numero}/{len(lote)}] {icao}"
        )

        try:

            dados = consultar_aisweb(
                icao
            )

            respostas_ok += 1

            aeroporto = indice[
                icao
            ]

            tinha_pistas = bool(
                dados["pistas"]
            )

            tinha_frequencias = bool(
                dados["frequencias"]
            )

            tinha_distancias = bool(
                dados[
                    "distancias_declaradas"
                ]
            )

            alterou = aplicar_dados_aeroporto(
                aeroporto,
                dados
            )

            if tinha_pistas:

                pistas_atualizadas += 1

            if tinha_frequencias:

                frequencias_atualizadas += 1

            if tinha_distancias:

                distancias_atualizadas += 1

            if alterou:

                atualizados += 1

                print(
                    "  ✓ dados atualizados"
                )

            else:

                sem_dados_adicionais += 1

                print(
                    "  • página válida, "
                    "mas nenhum dado adicional "
                    "foi extraído"
                )

        except Exception as erro:

            erros += 1

            print(
                "  ! erro real:",
                erro
            )

            print(
                "    Dados anteriores preservados."
            )

        time.sleep(
            INTERVALO
        )

    # ======================================
    # ORDENAR
    # ======================================

    aeroportos.sort(

        key=lambda aeroporto:
        limpar(
            aeroporto.get(
                "icao",
                ""
            )
        ).upper()

    )

    # ======================================
    # SALVAR BASE
    # ======================================

    BASE.write_text(

        json.dumps(
            aeroportos,
            ensure_ascii=False,
            indent=2
        )
        + "\n",

        encoding="utf-8"

    )

    # ======================================
    # SALVAR CURSOR
    # ======================================

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

    # ======================================
    # VALIDAÇÕES
    # ======================================

    if len(aeroportos) < 7000:

        raise RuntimeError(

            "ERRO CRÍTICO após atualização: "
            "base possui apenas "
            + str(len(aeroportos))
            + " registros."

        )

    if "SSCL" not in indice:

        raise RuntimeError(
            "ERRO CRÍTICO: SSCL "
            "não encontrado."
        )

    if "SBUR" not in indice:

        raise RuntimeError(
            "ERRO CRÍTICO: SBUR "
            "não encontrado."
        )

    # ======================================
    # RESULTADO
    # ======================================

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
        consultas
    )

    print(
        "Respostas HTTP válidas:",
        respostas_ok
    )

    print(
        "Erros reais:",
        erros
    )

    print(
        "Aeródromos atualizados:",
        atualizados
    )

    print(
        "Com pistas:",
        pistas_atualizadas
    )

    print(
        "Com frequências:",
        frequencias_atualizadas
    )

    print(
        "Com distâncias:",
        distancias_atualizadas
    )

    print(
        "Sem dados adicionais:",
        sem_dados_adicionais
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


# ==========================================
# EXECUÇÃO
# ==========================================

if __name__ == "__main__":

    main()
