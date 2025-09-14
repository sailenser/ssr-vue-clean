import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';

//Подгружаем конфиг .env
dotenv.config();

// Constants
const isProductions = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 4587;
const baseUrl = process.env.BASE_URL || '/';
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createExpressServer() {
    const app = express();

    //appType: 'custom' - отключаем собственную логику HTML-обслуживания Vite и делаем собственную
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
        baseUrl: baseUrl
    });

    app.use(vite.middlewares);

    app.use('*all', async (req, res, next) => {
        const url = req.originalUrl

        try {
            // 1. Считываем файл index.html
            let template = fs.readFileSync(
                path.resolve(__dirname, 'index.html'),
                'utf-8',
            );

            //2. Применяем HTML-преобразования Vite, добавляет /@vite для файлов в html в теге <script>
            template = await vite.transformIndexHtml(url, template);

            // 3. Получаем функцию файла результата результата серверной сборки SSR
            const { render } = await vite.ssrLoadModule('/dist-ssr/server/entry-server.js');

            // 4. Делаем рендеринг приложения в формате HTML(т.е. тут только внутрянка то что внутри страницы между body)
            const appHtml = await render(url);

            // 5. Вставка в шаблон HTML-код, созданный приложением.
            const html = template.replace(`<!--ssr-outlet-->`, () => appHtml.html);

            // 6. Отправьте на сервер отрисованный HTML-код.
            res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
        }
        catch (e) {
            vite.ssrFixStacktrace(e)
            next(e)
        }
    })

    app.listen(5173)
}

createExpressServer();