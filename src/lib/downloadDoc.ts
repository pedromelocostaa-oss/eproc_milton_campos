import { supabase } from '@/integrations/supabase/client';

const COMBINING_MARKS = /[̀-ͯ]/g;
const UNSAFE_CHARS = /[^a-zA-Z0-9._-]+/g;

/**
 * Sanitiza um segmento de path para o Supabase Storage.
 * Remove acentos e substitui qualquer caractere não seguro por _.
 * Preserva pontos (usados na extensão do arquivo).
 */
export function sanitizeStorageSegment(s: string): string {
  const normalized = s.normalize('NFD').replace(COMBINING_MARKS, '');
  const cleaned = normalized.replace(UNSAFE_CHARS, '_');
  return cleaned.replace(/^_+|_+$/g, '') || 'arquivo';
}

/**
 * Baixa um arquivo do bucket `documentos` diretamente no computador do usuário.
 * Usa createSignedUrl (funciona em bucket público ou privado).
 * Se o download falhar, tenta abrir a URL assinada em nova aba como fallback.
 */
export async function baixarDocumento(storagePath: string, nomeArquivo: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from('documentos')
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) {
    alert(`Não foi possível baixar o documento.\n\n${error?.message ?? 'URL inválida.'}`);
    return;
  }

  try {
    const res = await fetch(data.signedUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo || 'documento';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }
}
