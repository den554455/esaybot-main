export const errorHandler = {
  log: (error, context = '') => {
    console.error(`[Error] ${context}`, error);
  },

  getMessage: (error) => {
    // Ответ с сервера — самый надёжный источник сообщения.
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    // Нет error.response => сетевая ошибка/таймаут/CORS, а не бизнес-ошибка сервера.
    // error.message в этом случае технический и на английском ("timeout of 10000ms exceeded",
    // "Network Error") — пользователю такое показывать нельзя.
    if (!error?.response) {
      if (error?.code === 'ECONNABORTED') {
        return 'Сервер не отвечает. Попробуйте ещё раз.';
      }
      return 'Проблема с подключением к серверу. Проверьте интернет и попробуйте ещё раз.';
    }

    return error?.message || 'Что-то пошло не так';
  },

  notify: (error, toast) => {
    const message = errorHandler.getMessage(error);
    if (toast) toast.error(message);
  },
};
