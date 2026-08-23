// ==========================================
// LeoSpotter
// Integração de fotografias com Supabase
// ==========================================


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const SUPABASE_BUCKET =
    "fotos";


// ==========================================
// NORMALIZAR MATRÍCULA
// ==========================================

function normalizarMatriculaSupabase(matricula) {

    return String(matricula || "")
        .trim()
        .toUpperCase()
        .replace(/-/g, "");

}


// ==========================================
// CLIENTE SUPABASE
// ==========================================

let supabaseClient = null;


// ==========================================
// INICIALIZAR SUPABASE
// ==========================================

function inicializarSupabase() {

    if (
        typeof supabase === "undefined"
    ) {

        console.error(
            "Biblioteca Supabase não carregada."
        );

        return false;

    }


    if (
        typeof SUPABASE_URL === "undefined" ||
        typeof SUPABASE_PUBLISHABLE_KEY === "undefined"
    ) {

        console.error(
            "Configuração do Supabase não encontrada."
        );

        return false;

    }


    try {

        supabaseClient =
            supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );


        console.log(
            "LeoSpotter: Supabase conectado."
        );


        return true;

    } catch (erro) {

        console.error(
            "Erro ao inicializar Supabase:",
            erro
        );

        return false;

    }

}


// ==========================================
// ENVIAR FOTOGRAFIA
// ==========================================

async function enviarFotoSupabase(
    arquivo,
    matricula,
    dataFoto,
    icao,
    observacao
) {

    if (!supabaseClient) {

        throw new Error(
            "Supabase não foi inicializado."
        );

    }


    if (!arquivo) {

        throw new Error(
            "Nenhum arquivo foi informado."
        );

    }


    const matriculaNormalizada =
        normalizarMatriculaSupabase(
            matricula
        );


    const extensao =
        arquivo.name
            .split(".")
            .pop()
            .toLowerCase();


    const nomeArquivo =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}.${extensao}`;


    const caminho =
        `aeronaves/${matriculaNormalizada}/${nomeArquivo}`;


    // ======================================
    // UPLOAD
    // ======================================

    const upload =
        await supabaseClient
            .storage
            .from(SUPABASE_BUCKET)
            .upload(
                caminho,
                arquivo,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType:
                        arquivo.type
                }
            );


    if (upload.error) {

        throw upload.error;

    }


    // ======================================
    // URL PÚBLICA
    // ======================================

    const urlPublica =
        supabaseClient
            .storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(
                caminho
            );


    if (
        !urlPublica ||
        !urlPublica.data
    ) {

        throw new Error(
            "Não foi possível obter a URL da fotografia."
        );

    }


    // ======================================
    // SALVAR REGISTRO NO BANCO
    // ======================================

    const registro = {

        matricula:
            matricula,

        data_foto:
            dataFoto || null,

        icao:
            icao || null,

        observacao:
            observacao || null,

        arquivo_path:
            caminho,

        arquivo_url:
            urlPublica.data.publicUrl

    };


    const resultado =
        await supabaseClient
            .from("fotos")
            .insert(registro)
            .select()
            .single();


    if (resultado.error) {

        // Se o banco falhar, tenta remover
        // o arquivo que acabou de ser enviado.

        await supabaseClient
            .storage
            .from(SUPABASE_BUCKET)
            .remove([
                caminho
            ]);


        throw resultado.error;

    }


    return resultado.data;

}


// ==========================================
// CARREGAR FOTOS DA AERONAVE
// ==========================================

async function carregarFotosSupabase(
    matricula
) {

    if (!supabaseClient) {

        throw new Error(
            "Supabase não foi inicializado."
        );

    }


    const matriculaNormalizada =
        normalizarMatriculaSupabase(
            matricula
        );


    const resultado =
        await supabaseClient
            .from("fotos")
            .select("*")
            .eq(
                "matricula",
                matricula
            )
            .order(
                "data_foto",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );


    if (resultado.error) {

        throw resultado.error;

    }


    return resultado.data || [];

}


// ==========================================
// EXCLUIR FOTOGRAFIA
// ==========================================

async function excluirFotoSupabase(
    foto
) {

    if (!supabaseClient) {

        throw new Error(
            "Supabase não foi inicializado."
        );

    }


    if (!foto || !foto.id) {

        throw new Error(
            "Fotografia inválida."
        );

    }


    // ======================================
    // EXCLUIR ARQUIVO DO STORAGE
    // ======================================

    if (foto.arquivo_path) {

        const removerArquivo =
            await supabaseClient
                .storage
                .from(SUPABASE_BUCKET)
                .remove([
                    foto.arquivo_path
                ]);


        if (
            removerArquivo.error
        ) {

            console.error(
                "Erro ao remover arquivo:",
                removerArquivo.error
            );

        }

    }


    // ======================================
    // EXCLUIR REGISTRO DO BANCO
    // ======================================

    const resultado =
        await supabaseClient
            .from("fotos")
            .delete()
            .eq(
                "id",
                foto.id
            );


    if (resultado.error) {

        throw resultado.error;

    }


    return true;

}
