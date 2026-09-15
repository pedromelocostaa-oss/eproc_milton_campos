import { supabase } from '@/integrations/supabase/client';

export async function getSignedUrlFor(bucket: 'documentos' | 'evento-documentos', path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function baixarBlobParaComputador(bucket: 'documentos' | 'evento-documentos', path: string, nome: string): Promise<void> {
  const url = await getSignedUrlFor(bucket, path);
  if (!url) {
    alert('Não foi possível baixar o documento.');
    return;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = nome || 'documento';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
