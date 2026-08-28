import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_0wc1bu8';
const TEMPLATE_ID = 'template_fkkmisg';
const PUBLIC_KEY = '2DCtZWC505FAn_72F';

emailjs.init(PUBLIC_KEY);

export async function enviarEmailAprovacao(params: {
  toName: string;
  toEmail: string;
  materia: string;
}): Promise<{ ok: boolean; erro?: string }> {
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_name: params.toName,
      to_email: params.toEmail,
      materia: params.materia,
    });
    return { ok: true };
  } catch (err: any) {
    console.error('EmailJS error:', err);
    return { ok: false, erro: err?.text ?? 'Erro ao enviar e-mail.' };
  }
}
