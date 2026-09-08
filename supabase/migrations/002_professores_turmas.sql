-- ⚠️ EXECUTAR MANUALMENTE no Supabase SQL Editor (Settings → SQL Editor → New snippet → colar e Run)
-- Nota: profiles.id é TEXT neste projeto, por isso professor_id é TEXT e usamos auth.uid()::text nas policies.

CREATE TABLE IF NOT EXISTS public.professores_turmas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  turma_id     UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professor_id, turma_id)
);

ALTER TABLE public.professores_turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prof_turmas_read" ON public.professores_turmas
  FOR SELECT USING (
    professor_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()::text AND p.perfil IN ('professor','admin')
    )
  );

CREATE POLICY "prof_turmas_write" ON public.professores_turmas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()::text AND p.perfil IN ('professor','admin')
    )
  );
