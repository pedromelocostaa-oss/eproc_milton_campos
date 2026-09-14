-- ============================================================
-- 005 — Camada de EVENTOS (paralela e retrocompatível)
-- ============================================================
-- ⚠️ EXECUTAR MANUALMENTE no Supabase SQL Editor.
--
-- Esta migration ADICIONA a nova camada de eventos sem alterar
-- nenhuma tabela existente destrutivamente. As tabelas
-- processos/documentos/movimentacoes/intimacoes permanecem
-- intactas — os processos antigos continuam funcionando com o
-- modelo velho.
--
-- Notas de compatibilidade:
--   * profiles.id é TEXT neste projeto → autor_id/corrigido_por
--     são TEXT. Nada de REFERENCES auth.users.
--   * Sem Supabase Auth. RLS habilitada mas permissiva
--     (o mesmo padrão dos demais recursos deste simulador).
--   * processos.estado é uma COLUNA NOVA (default 'ativo').
--     A coluna processos.status EXISTENTE não é alterada.
-- ============================================================


-- ── 1. ENUMs ────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evento_autor_papel') THEN
    CREATE TYPE evento_autor_papel AS ENUM ('aluno', 'professor_juiz', 'sistema');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evento_subtipo') THEN
    CREATE TYPE evento_subtipo AS ENUM (
      'distribuicao', 'intimacao',
      'peticao_inicial', 'emenda_inicial', 'manifestacao', 'cumprimento_despacho',
      'replica', 'contestacao', 'peticao_juntada', 'recurso', 'peticao_generica',
      'despacho', 'decisao', 'sentenca'
    );
  END IF;
END $$;


-- ── 2. Tabela eventos ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eventos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id    UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  numero         INTEGER NOT NULL,
  subtipo        evento_subtipo NOT NULL,
  autor_papel    evento_autor_papel NOT NULL,
  autor_id       TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  titulo         TEXT NOT NULL,
  corpo          TEXT,
  em_resposta_a  UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
  data_evento    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (processo_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_eventos_processo ON public.eventos (processo_id, numero);
CREATE INDEX IF NOT EXISTS idx_eventos_subtipo  ON public.eventos (subtipo);
CREATE INDEX IF NOT EXISTS idx_eventos_autor    ON public.eventos (autor_id);


-- ── 3. Tabela evento_documentos ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.evento_documentos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id      UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  storage_path   TEXT NOT NULL,
  mime_type      TEXT,
  tamanho_bytes  BIGINT,
  ordem          INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evento_documentos_evento
  ON public.evento_documentos (evento_id, ordem);


-- ── 4. Tabela evento_correcoes ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.evento_correcoes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id      UUID NOT NULL UNIQUE REFERENCES public.eventos(id) ON DELETE CASCADE,
  nota           NUMERIC(4,2) CHECK (nota >= 0 AND nota <= 10),
  feedback       TEXT,
  corrigido_por  TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  corrigido_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nota_ou_feedback CHECK (nota IS NOT NULL OR feedback IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_evento_correcoes_evento
  ON public.evento_correcoes (evento_id);


-- ── 5. processos.estado (coluna aditiva, não conflita com status) ──
ALTER TABLE public.processos
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'ativo'
    CHECK (estado IN ('ativo', 'sentenciado', 'baixado'));


-- ── 6. Triggers ─────────────────────────────────────────────

-- 6.1 updated_at automático em eventos (reusa a função existente set_updated_at)
DROP TRIGGER IF EXISTS trg_eventos_updated_at ON public.eventos;
CREATE TRIGGER trg_eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6.2 Auto-numeração de eventos por processo
CREATE OR REPLACE FUNCTION public.auto_numerar_evento()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero), 0) + 1
      INTO NEW.numero
      FROM public.eventos
     WHERE processo_id = NEW.processo_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_numerar_evento ON public.eventos;
CREATE TRIGGER trg_auto_numerar_evento
  BEFORE INSERT ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.auto_numerar_evento();

-- 6.3 Marcar processo como sentenciado quando entra evento de sentença
CREATE OR REPLACE FUNCTION public.marcar_sentenciado_ao_sentenciar()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.subtipo = 'sentenca' THEN
    UPDATE public.processos
       SET estado = 'sentenciado',
           updated_at = now()
     WHERE id = NEW.processo_id
       AND estado <> 'sentenciado';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_marcar_sentenciado ON public.eventos;
CREATE TRIGGER trg_marcar_sentenciado
  AFTER INSERT ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.marcar_sentenciado_ao_sentenciar();


-- ── 7. Storage bucket evento-documentos (separado do documentos legado) ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('evento-documentos', 'evento-documentos', false)
ON CONFLICT (id) DO NOTHING;


-- ── 8. RLS ─────────────────────────────────────────────────
-- Habilitada, com policies permissivas (mesmo padrão dos demais
-- recursos deste simulador — auth acontece em código, não em RLS,
-- porque o app não usa Supabase Auth).

ALTER TABLE public.eventos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_documentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_correcoes   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eventos_all"           ON public.eventos;
DROP POLICY IF EXISTS "evento_documentos_all" ON public.evento_documentos;
DROP POLICY IF EXISTS "evento_correcoes_all"  ON public.evento_correcoes;

CREATE POLICY "eventos_all"           ON public.eventos           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "evento_documentos_all" ON public.evento_documentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "evento_correcoes_all"  ON public.evento_correcoes  FOR ALL USING (true) WITH CHECK (true);

-- Storage policy pro bucket evento-documentos
DROP POLICY IF EXISTS "evento_docs_storage_all" ON storage.objects;
CREATE POLICY "evento_docs_storage_all" ON storage.objects
  FOR ALL
  USING (bucket_id = 'evento-documentos')
  WITH CHECK (bucket_id = 'evento-documentos');
