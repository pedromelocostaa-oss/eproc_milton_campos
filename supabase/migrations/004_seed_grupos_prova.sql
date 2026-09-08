-- ⚠️ EXECUTAR MANUALMENTE no Supabase SQL Editor
-- Cria os 3 logins de grupo para a prova
-- IMPORTANTE: substitua 'TURMA_ID_AQUI' pelo UUID real da turma da matéria da prova
-- (para descobrir: SELECT id, nome FROM public.turmas;)

INSERT INTO public.cadastros_alunos (cpf, nome, email, senha, turma_id, status)
VALUES
  ('111.111.111-01', 'Grupo 1 — Prova', 'grupo1@eproc.sim', 'Prova@2026g1', 'TURMA_ID_AQUI', 'aprovado'),
  ('222.222.222-02', 'Grupo 2 — Prova', 'grupo2@eproc.sim', 'Prova@2026g2', 'TURMA_ID_AQUI', 'aprovado'),
  ('333.333.333-03', 'Grupo 3 — Teste', 'grupo3@eproc.sim', 'Prova@2026g3', 'TURMA_ID_AQUI', 'aprovado')
ON CONFLICT DO NOTHING;
