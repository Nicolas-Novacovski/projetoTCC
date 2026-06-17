import cors from 'cors'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { env } from './config/env.js'
import { connectToDatabase } from './database/connection.js'
import { ensureSeedData } from './database/seed.js'
import { router } from './routes/index.js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '../dist')

app.use(cors())
app.use(express.json({ limit: '8mb' }))
app.use('/api', router)
app.use(express.static(distPath))

app.get(/^(?!\/api).*/, (_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'))
})

app.use((error, _request, response, _next) => {
  console.error('Erro interno no servidor.', error)

  response.status(500).json({
    status: 'error',
    message: 'Erro interno no servidor.',
    details: error instanceof Error ? error.message : 'Erro desconhecido.',
  })
})

async function bootstrap() {
  await connectToDatabase()
  await ensureSeedData()

  app.get('/api/notificacoes/mural/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    
    try {
        
        const resultado = await db.query(
            `SELECT id_publicacao, titulo, status_moderacao 
             FROM publicacoes_mural 
             WHERE id_autor = $1 AND status_moderacao = 'Aprovado'`,
            [id_usuario]
        );
        
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar status das publicações.' });
    }
});

  app.listen(env.port, () => {
    console.log(`Backend iniciado em http://localhost:${env.port}`)
  })
}



bootstrap().catch((error) => {
  console.error('Falha ao iniciar a aplicacao.', error)
  process.exit(1)
})
