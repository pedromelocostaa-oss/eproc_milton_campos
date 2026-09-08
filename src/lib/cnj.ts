const varasCodigos = ['3800', '3801', '3802', '3803', '3804', '3805', '3806', '3807'];

let sequenceCounter = parseInt(localStorage.getItem('cnj-sequence') || '100', 10);

function calcDigitosCNJ(nnnnnnn: string, aaaa: string, j: string, tr: string, oooo: string): string {
  const base = `${nnnnnnn}${aaaa}${j}${tr}${oooo}`;
  const r1 = parseInt(base) % 97;
  const r2 = (r1 * 100) % 97;
  const dv = 98 - r2;
  return String(dv).padStart(2, '0');
}

export function generateProcessNumber(varaCode?: string): string {
  sequenceCounter++;
  localStorage.setItem('cnj-sequence', String(sequenceCounter));

  const nnnnnnn = String(sequenceCounter).padStart(7, '0');
  const aaaa = new Date().getFullYear().toString();
  const j = '8';
  const tr = '13';
  const oooo = varaCode || varasCodigos[Math.floor(Math.random() * varasCodigos.length)];

  const dv = calcDigitosCNJ(nnnnnnn, aaaa, j, tr, oooo);
  return `${nnnnnnn}-${dv}.${aaaa}.${j}${tr}.${oooo}`;
}

export function formatProcessNumber(raw: string): string {
  return raw;
}

export function getVaraCodeFromProcess(numero: string): string {
  const parts = numero.split('.');
  return parts[parts.length - 1] || '3800';
}

export { varasCodigos };
