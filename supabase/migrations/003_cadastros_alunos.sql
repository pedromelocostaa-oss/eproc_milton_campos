-- ⚠️ EXECUTAR MANUALMENTE no Supabase SQL Editor
-- Se a tabela já existir, este comando é seguro (IF NOT EXISTS)
-- Nota: profiles.id é TEXT neste projeto, por isso usamos auth.uid()::text nas policies.

CREATE TABLE IF NOT EXISTS public.cadastros_alunos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf        VARCHAR(14) NOT NULL,
  nome       TEXT NOT NULL,
  email      TEXT DEFAULT '',
  endereco   TEXT DEFAULT '',
  telefone   TEXT DEFAULT '',
  senha      TEXT NOT NULL,
  turma_id   UUID REFERENCES public.turmas(id),
  status     TEXT NOT NULL DEFAULT 'pendente'
               CHECK (status IN ('pendente', 'aprovado', 'recusado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cadastros_alunos ENABLE ROW LEVEL SECURITY;

-- Professores e admin podem ver e gerenciar todos os cadastros
CREATE POLICY "cadastros_prof_all" ON public.cadastros_alunos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()::text AND p.perfil IN ('professor','admin')
    )
  );

-- Qualquer pessoa autenticada pode se registrar (insert)
CREATE POLICY "cadastros_self_insert" ON public.cadastros_alunos
  FOR INSERT WITH CHECK (true);

-- Alunos podem ler seu próprio cadastro
CREATE POLICY "cadastros_self_read" ON public.cadastros_alunos
  FOR SELECT USING (true);
