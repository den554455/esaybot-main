import React, { useState, useEffect } from 'react';
import './VoiceInput.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { errorHandler } from '../utils/errorHandler';

const VoiceInput = ({ onResult, onError, buttonOnly = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [supported, setSupported] = useState(true);
  const onResultRef = React.useRef(onResult);
  const onErrorRef = React.useRef(onError);
  const { runIfMounted } = useSafeAsync();

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    // mounted handled by useSafeAsync
    // Проверка поддержки Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupported(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.lang = 'ru-RU';
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResultRef.current) {
        onResultRef.current(transcript);
      }
      runIfMounted(() => setIsListening(false));
    };

    recognitionInstance.onerror = (event) => {
      errorHandler.log(event.error, 'VoiceInput: Speech recognition error');
      if (onErrorRef.current) {
        onErrorRef.current(event.error);
      }
      runIfMounted(() => setIsListening(false));
    };

    recognitionInstance.onend = () => {
      runIfMounted(() => setIsListening(false));
    };

    runIfMounted(() => setRecognition(recognitionInstance));
    return () => {
      try { recognitionInstance.stop && recognitionInstance.stop(); } catch (e) {}
    };
  }, [runIfMounted]);

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        errorHandler.log(error, 'VoiceInput: Error starting recognition');
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  if (!supported) {
    return null;
  }

  if (buttonOnly) {
    return (
      <button
        className={`voice-button ${isListening ? 'listening' : ''}`}
        onClick={isListening ? stopListening : startListening}
        title={isListening ? 'Остановить запись' : 'Голосовой ввод'}
      >
        🎤
      </button>
    );
  }

  return (
    <div className="voice-input">
      <button
        className={`voice-trigger ${isListening ? 'active' : ''}`}
        onClick={isListening ? stopListening : startListening}
      >
        <span className="voice-icon">🎤</span>
        {isListening ? (
          <span className="voice-status">Слушаю... Нажмите для остановки</span>
        ) : (
          <span className="voice-status">Голосовой поиск</span>
        )}
      </button>
      {isListening && (
        <div className="voice-wave">
          <span></span><span></span><span></span><span></span>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;