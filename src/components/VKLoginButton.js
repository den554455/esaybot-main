import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { errorHandler } from '../utils/errorHandler';

const VKLoginButton = () => {
  const containerRef = useRef(null);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  useEffect(() => {
    const loadVK = async () => {
      if (window.VKIDSDK) { initVK(); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
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
        .on(VKID.WidgetEvents.ERROR, (e) => errorHandler.log(e, 'VKLoginButton: VK ERROR'))
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload) => {
          try {
            const result = await VKID.Auth.exchangeCode(
              payload.code,
              payload.device_id
            );

            let firstName = '';
            let lastName = '';
            let avatarUrl = null;

            try {
              const userInfo = await VKID.Auth.userInfo(result.access_token);
              firstName = userInfo?.user?.first_name || '';
              lastName  = userInfo?.user?.last_name  || '';
              avatarUrl = userInfo?.user?.avatar     || null;
            } catch (e) {
              console.warn('VK userInfo failed', e);
            }

            const response = await fetch(
              'https://baronpython554455.pythonanywhere.com/api/auth/vk/exchange',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id_token:   result.id_token,
                  first_name: firstName,
                  last_name:  lastName,
                  avatar_url: avatarUrl,
                }),
              }
            );
            const data = await response.json();

            if (data.success) {
              loginWithToken(data.access_token, data.refresh_token, data.user);
              const role = data.user.role;
              if (role === 'admin') navigate('/admin');
              else if (role === 'master') navigate('/master-panel');
              else navigate('/');
            } else {
              toastError('Ошибка входа через VK: ' + data.error);
            }
          } catch (error) {
            errorHandler.log(error, 'VKLoginButton: VK ERROR');
            toastError('Ошибка соединения с VK');
          }
        });
    };

    loadVK();
  }, []);

  return <div ref={containerRef} />;
};

export default VKLoginButton;