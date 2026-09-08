import { supabase } from '@/integrations/supabase/client';

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
