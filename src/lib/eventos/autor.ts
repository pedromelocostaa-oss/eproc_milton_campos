import { supabase } from '@/integrations/supabase/client';

interface AutorSimples {
  id: string;
  cpf?: string;
  nome_completo?: string;
  nome?: string;
  perfil?: 'aluno' | 'professor' | 'admin';
}

/**
 * eventos.autor_id tem FK para profiles.id. Alunos que vieram de
 * cadastros_alunos podem NÃO ter linha em profiles ainda. Este helper
 * garante que exista um profile mínimo antes de gravar o evento.
 *
 * Zero alteração de dados existentes: só INSERT quando não há linha.
 */
export async function garantirProfileParaAutor(user: AutorSimples | null): Promise<void> {
  if (!user?.id) return;
  const { data: existente } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (existente) return;

  const nome = user.nome_completo || user.nome || 'Aluno';
  const cpf = user.cpf ?? String(user.id);
  const perfil = user.perfil ?? 'aluno';

  await supabase.from('profiles').insert({
    id: user.id,
    cpf,
    nome_completo: nome,
    perfil,
    primeiro_acesso: false,
    ativo: true,
  });
}
