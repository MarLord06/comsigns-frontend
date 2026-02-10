export function speak(text, lang = 'es-ES') {
  if (!text) return
  try {
    // Cancel any ongoing speech
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    // Optional: set voice/rate/pitch
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    window.speechSynthesis.speak(utterance)
    return utterance
  } catch (err) {
    console.error('TTS error:', err)
  }
}

export function stopSpeaking() {
  try {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
  } catch (err) {
    console.error('TTS stop error:', err)
  }
}
