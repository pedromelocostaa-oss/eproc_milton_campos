-- ⚠️ EXECUTAR MANUALMENTE no Supabase SQL Editor
-- Cria os 3 logins de grupo para a prova
-- Usa subquery para pegar automaticamente o id da (única) turma existente,
-- e gen_random_uuid() para o id (caso a coluna não tenha DEFAULT).

INSERT INTO public.cadastros_alunos (id, cpf, nome, email, senha, turma_id, status)
SELECT gen_random_uuid(), v.cpf, v.nome, v.email, v.senha, t.id, 'aprovado'
FROM (VALUES
  ('111.111.111-01', 'Grupo 1 — Prova', 'grupo1@eproc.sim', 'Prova@2026g1'),
  ('222.222.222-02', 'Grupo 2 — Prova', 'grupo2@eproc.sim', 'Prova@2026g2'),
  ('333.333.333-03', 'Grupo 3 — Teste', 'grupo3@eproc.sim', 'Prova@2026g3')
) AS v(cpf, nome, email, senha)
CROSS JOIN (SELECT id FROM public.turmas LIMIT 1) AS t
ON CONFLICT DO NOTHING;
