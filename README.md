# Muscle Memory — esqueleto v0.1

App de treino de academia: escolhe o treino do dia, marca o que já fez, ajusta peso na hora, define metas. Vanilla HTML/CSS/JS + Firebase, mesmo padrão do Finn / Plane Aviation.

## O que já funciona neste esqueleto

- **Início**: escolhe o treino do dia (A/B/C/D, ou quantos você criar) → aparece o checklist com peso editável e check de concluído.
- **Treinos**: cria, renomeia e exclui treinos. Dentro de cada um, adiciona exercícios.
- **Busca de exercício**: puxa da base pública [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (~870 exercícios, com foto). Busca por nome, músculo ou equipamento.
- **Boneco com glow no músculo**: ao confirmar um exercício, aparece um diagrama simplificado do corpo com a região muscular destacada em vermelho. **Isso é um placeholder funcional** — desenhei um corpo bem simples em SVG (`js/muscle-map.js`) só pra já entregar a funcionalidade. Quando você tiver a identidade visual pronta, dá pra trocar por ilustrações de verdade sem mexer na lógica.
- **Metas**: lista todo exercício que tem meta de peso definida, com barra de progresso (peso atual / meta).
- Sem login — só funciona no seu celular direto, com Firebase Firestore guardando os dados por trás (auth anônimo automático, sem tela de login).

## Setup antes de rodar

1. **Firebase**: já está configurado (`js/firebase-config.js`) apontando pro projeto `muscle-memory-ac6b9`. Só falta ativar no console: **Firestore Database** (modo produção) e **Authentication → Sign-in method → Anônimo**.
2. **Regras do Firestore** (já que não tem login de verdade, restrinja por usuário autenticado):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

   (Como é uso pessoal seu, isso já resolve — só quem estiver autenticado, mesmo que anonimamente, acessa. Se quiser travar por UID específico depois, dá pra refinar.)

3. **Ícones**: já estão em `assets/icon-192.png` e `assets/icon-512.png`, gerados a partir do teu SVG (fundo preto, "MM" em cinza claro).
4. **GitHub Pages**:
   - Cria o repositório (ex: `muscle-memory`) e sobe todos os arquivos na branch `main` (mesma estrutura, sem alterar caminhos).
   - No repo: **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**.
   - Sua URL fica em `https://SEU_USUARIO.github.io/muscle-memory/` — como todos os caminhos no projeto são relativos (`css/`, `js/`, `assets/`), funciona certinho tanto nessa subpasta quanto em domínio próprio depois.
   - No Firebase Console, em **Authentication → Settings → Authorized domains**, adiciona `SEU_USUARIO.github.io` (senão o login anônimo é bloqueado).

## Próximos passos (depois que o esqueleto estiver validado)

- Histórico de treinos (evolução de carga ao longo do tempo, gráfico tipo Chart.js — já usamos isso no Finn).
- Trocar o boneco placeholder por ilustração real quando a identidade visual (os dois M's) estiver definida.
- Reordenar exercícios dentro do treino (drag and drop, igual fizemos nos aviões do Plane Aviation).
- Notificação/lembrete de treino.
- Duplicar treino (ex: criar "Treino A2" a partir do A).
