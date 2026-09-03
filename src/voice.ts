/**
 * Voice controller — speech-to-text via Web Speech API,
 * text-to-speech via SpeechSynthesis API.
 * 
 * No external services required — uses browser-native APIs.
 */

export interface VoiceController {
  destroy(): void;
  speak(text: string): void;
  ttsEnabled: boolean;
}

export function initVoiceController(
  button: HTMLButtonElement,
  statusEl: HTMLElement,
  onTranscript: (text: string) => void,
  onAgentSpoken: (text: string) => void,
): VoiceController {
  let isRecording = false;
  let recognition: any = null;
  let ttsEnabled = false;

  // Check browser support
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const speechSynthesis = window.speechSynthesis;

  if (!SpeechRecognition) {
    button.disabled = true;
    button.title = 'Voice input not supported in this browser';
    button.style.opacity = '0.4';
  }

  function startRecording(): void {
    if (!SpeechRecognition) return;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onstart = () => {
      isRecording = true;
      button.classList.add('recording');
      button.textContent = '🔴';
      statusEl.textContent = 'Listening...';
      statusEl.style.color = '#f44';
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim) {
        statusEl.textContent = `Hearing: ${interim}`;
      }
    };

    recognition.onerror = (event: any) => {
      statusEl.textContent = `Voice error: ${event.error}`;
      statusEl.style.color = '#f44';
      stopRecording();
    };

    recognition.onend = () => {
      stopRecording();
      if (finalTranscript.trim()) {
        statusEl.textContent = `Heard: "${finalTranscript.trim()}"`;
        statusEl.style.color = '#4ade80';
        onTranscript(finalTranscript.trim());
      } else {
        statusEl.textContent = '';
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('[Voice] Failed to start recognition:', err);
      statusEl.textContent = 'Failed to start voice input';
    }
  }

  function stopRecording(): void {
    isRecording = false;
    button.classList.remove('recording');
    button.textContent = '🎤';
    if (recognition) {
      try { recognition.stop(); } catch {}
      recognition = null;
    }
  }

  // Hold-to-talk OR click-to-toggle
  let pressTimer: number | null = null;

  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pressTimer = window.setTimeout(() => {
      // Hold detected — start recording
      if (!isRecording) startRecording();
      pressTimer = null;
    }, 200);
  });

  button.addEventListener('pointerup', (e) => {
    e.preventDefault();
    if (pressTimer !== null) {
      // Quick click (not hold)
      clearTimeout(pressTimer);
      pressTimer = null;
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    } else {
      // Was a hold — stop recording on release
      if (isRecording) stopRecording();
    }
  });

  button.addEventListener('pointerleave', () => {
    if (pressTimer !== null) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });

  // Double-click toggles TTS
  button.addEventListener('dblclick', () => {
    ttsEnabled = !ttsEnabled;
    if (ttsEnabled) {
      button.classList.add('tts-active');
      statusEl.textContent = '🔊 Voice responses ON';
      statusEl.style.color = '#4ade80';
    } else {
      button.classList.remove('tts-active');
      statusEl.textContent = '🔇 Voice responses OFF';
      statusEl.style.color = '#888';
      setTimeout(() => { statusEl.textContent = ''; }, 2000);
    }
  });

  function speak(text: string): void {
    if (!ttsEnabled || !speechSynthesis) return;
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    // Strip markdown/formatting for speech
    const clean = text.replace(/[*_#`~\[\]()>|]/g, '').replace(/!\[.*?\]\(.*?\)/g, '').trim();
    if (!clean) return;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    speechSynthesis.speak(utterance);
  }

  return {
    destroy() {
      if (recognition) {
        try { recognition.stop(); } catch {}
        recognition = null;
      }
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
      isRecording = false;
      ttsEnabled = false;
    },
    speak,
    get ttsEnabled() { return ttsEnabled; },
  };
}