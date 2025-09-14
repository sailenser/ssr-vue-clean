//renderToString - это функция из пакета @vue/server-renderer, которая рендерит Vue приложение в HTML строку на сервере.
import { renderToString } from 'vue/server-renderer';
import { createApp } from './app'

export async function render() {
    const { app } = createApp();

    //SSRContext опционально
    const context = {};
    const html = await renderToString(app, context);
    return { html }
}