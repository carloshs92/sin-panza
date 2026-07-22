// Reconocimiento de voz: espera el comando de arranque en el idioma elegido.
export const VOZ = {
  es: { lang: 'es-ES', re: /\b(ahora|inicio|empezar|empieza|comienza|vamos|ya)\b/i, palabra: '¡ahora!' },
  en: { lang: 'en-US', re: /\b(now|start|go|begin)\b/i, palabra: 'now!' },
  fr: { lang: 'fr-FR', re: /\b(maintenant|commence|commencer|allez|go)\b/i, palabra: 'maintenant !' },
  it: { lang: 'it-IT', re: /\b(adesso|ora|via|vai|inizia)\b/i, palabra: 'adesso!' },
  pl: { lang: 'pl-PL', re: /\b(teraz|start|zaczynamy|dawaj)\b/i, palabra: 'teraz!' },
  tr: { lang: 'tr-TR', re: /(şimdi|başla|hadi)/i, palabra: 'şimdi!' },
  ru: { lang: 'ru-RU', re: /(сейчас|начали|старт|поехали)/i, palabra: 'сейчас!' },
  zh: { lang: 'zh-CN', re: /(现在|开始|走)/, palabra: '开始' },
  hi: { lang: 'hi-IN', re: /(अभी|शुरू|चलो)/, palabra: 'शुरू' },
  ko: { lang: 'ko-KR', re: /(지금|시작|가자)/, palabra: '시작' },
};

export const vozDe = (idioma) => VOZ[idioma] || VOZ.es;

export const soportaVoz = () =>
  typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export function crearEscucha({ idioma = 'es', onComando, onEstado }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  const cfg = vozDe(idioma);
  const rec = new SR();
  rec.lang = cfg.lang;
  rec.continuous = true;
  rec.interimResults = true;

  let activo = false;

  rec.onresult = (ev) => {
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const texto = ev.results[i][0].transcript;
      if (cfg.re.test(texto)) {
        onComando(texto.trim());
        return;
      }
    }
  };

  rec.onstart = () => onEstado?.('escuchando');
  rec.onerror = (ev) => {
    if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
      activo = false;
      onEstado?.('denegado');
    }
  };
  // Chrome corta la sesión cada cierto tiempo: se reinicia sola mientras esté activa
  rec.onend = () => {
    if (activo) {
      try { rec.start(); } catch { /* ya arrancando */ }
    } else {
      onEstado?.('apagado');
    }
  };

  return {
    start() {
      if (activo) return;
      activo = true;
      try { rec.start(); } catch { /* ignore */ }
    },
    stop() {
      activo = false;
      try { rec.stop(); } catch { /* ignore */ }
    },
    get activo() { return activo; },
  };
}
