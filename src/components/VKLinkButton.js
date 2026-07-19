import React, { useEffect, useRef } from 'react';
import { authService } from '../services';
import { errorHandler } from '../utils/errorHandler';

const VKLinkButton = ({ onSuccess, onError }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const loadVK = async () => {
      if (window.VKIDSDK) { initVK(); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@vkid/sdk@2.6.2/dist-sdk/umd/index.js';
      script.async = true;
      script.onload = initVK;
      document.body.appendChild(script);
    };

    const initVK = () => {
      const VKID = window.VKIDSDK;
      if (!VKID) return;

      VKID.Config.init({
        app: 54645408,
        redirectUrl: 'https://easy-bot-app.website.yandexcloud.net',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        appName: 'Easy Bot',
      });

      const oneTap = new VKID.OneTap();
      oneTap.render({
        container: containerRef.current,
        showAlternativeLogin: true,
      });

      oneTap
        .on(VKID.WidgetEvents.ERROR, (e) => {
          errorHandler.log(e, 'VKLinkButton: VK ERROR');
          onError && onError('Ошибка VK виджета');
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload) => {
          try {
            const result = await VKID.Auth.exchangeCode(
              payload.code,
              payload.device_id
            );
            const response = await authService.linkVk(result.id_token);
            if (response.success) {
              onSuccess && onSuccess();
            } else {
              onError && onError(response.error);
            }
          } catch (e) {
            errorHandler.log(e, 'VKLinkButton: VK LINK ERROR');
            onError && onError('Ошибка привязки VK');
          }
        });
    };

    loadVK();
  }, []);

  return <div ref={containerRef} />;
};

export default VKLinkButton;