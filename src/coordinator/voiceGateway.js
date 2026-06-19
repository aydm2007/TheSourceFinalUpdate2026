class VoiceGateway {
  constructor(isEnabled = true) {
    this.voiceEngineActive = isEnabled;
  }

  async announceAction(textMessage) {
    if (!this.voiceEngineActive) return { status: "DORMANT" };

    try {
      // تأمين الحقل وضمان عدم الانهيار عند القيم الفارغة
      const message = textMessage || "System status optimal";
      const sanitizedText = String(message).replace(/[^a-zA-Z0-9 ]/g, "");

      return {
        status: "SPEECH_DISPATCHED",
        payload: sanitizedText,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { status: "VOICE_FAILED", error: error.message };
    }
  }
}

module.exports = { VoiceGateway };
