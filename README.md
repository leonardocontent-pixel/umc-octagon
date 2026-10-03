# UMC — Ultimate Menfe Championship

Pacote inicial do campeonato comercial de outubro de 2026, preparado para GitHub + Vercel + Supabase. A interface abre com dados demonstrativos para revisão visual; os nomes, fotos e valores da tela de demonstração devem ser trocados pelos dados aprovados da operação antes de publicar para os executivos.

## Conceito implementado

- Identidade original UMC / Octagon em grafite, preto e dourado, com linguagem de transmissão esportiva.
- Main Event sempre formado pelos dois primeiros colocados em VGV.
- Três eventos com metas de R$ 2,5 mi, R$ 3,5 mi e R$ 5 mi. O vencedor de cada etapa é quem tiver o maior VGV individual acumulado no momento em que a meta geral for alcançada.
- Categorias por vendas no mês: 1 venda = Peso Leve; 3 = Meio-Pesado; 5 = Peso Pesado.
- Registro de venda com escolha do resultado: Knockout no 1º round (negociação muito rápida), Finalização / Submission (objeções superadas em uma negociação longa) e Vitória por pontos (fechamento no limite do prazo).
- A primeira venda de cada executivo no mês concede R$ 500.
- Perfil de lutador com modalidade, divisão masculina/feminina e campo de foto para o avatar.
- Migration SQL com fighters, equipes, vendas, eventos, vencedores, regra de recompensa, RLS e bucket privado de avatares.

## Rodar localmente

Requer Node.js 20+.

```bash
cp .env.example .env.local
npm install
npm run dev
```

A interface de conceito funciona sem credenciais. `.env.local` está preparado para adicionar as chaves do seu projeto Supabase. O pacote atual ainda usa dados demonstrativos na camada visual; a migration cria o backend seguro, mas as telas não consultam e gravam nele nesta primeira entrega. Faça essa ligação no próximo ciclo de implementação antes de usar dados reais.

## Criar o projeto Supabase

1. Crie ou escolha um projeto Supabase para a UMC.
2. Abra **SQL Editor** e execute `supabase/migrations/202610030001_umc_core.sql`.
3. Em **Authentication → URL Configuration**, defina o domínio da Vercel como Site URL e inclua `https://SEU-DOMINIO.vercel.app/**` e `http://localhost:3000/**` em Redirect URLs quando autenticação for adicionada.
4. Crie o primeiro perfil `admin` em `public.profiles` após cadastrar a conta em Authentication. Não exponha `service_role` no navegador.

A migration não altera tabelas do projeto anterior; ela cria as tabelas com prefixo semântico UMC no schema `public`, e um bucket próprio `fighter-avatars`.

## Publicar pelo GitHub e Vercel

1. Extraia este ZIP e envie o conteúdo da pasta a um repositório GitHub novo.
2. Na Vercel, escolha **Add New → Project**, importe o repositório e mantenha o preset Next.js.
3. Configure as variáveis do `.env.example` em **Settings → Environment Variables**. Use as chaves públicas `Project URL` e `anon`/publishable do Supabase; nunca use `service_role` em `NEXT_PUBLIC_*`.
4. Faça o deploy. A região sugerida está em `gru1`.

## Assets

- `public/assets/umc-mark.svg`: assinatura UMC vetorial original.
- `public/assets/fighter-placeholder.svg`: retrato de substituição para prévia.
- Para inserir os rostos reais, solicite fotos frontais aprovadas dos executivos. O pacote reserva `avatar_path` e o bucket privado para aplicar a foto em avatares dos estilos escolhidos. Nenhuma foto pessoal foi inventada ou incluída.

## Próximas integrações para operação real

- Login e permissões por administrador, gerente e lutador.
- CRUD de executivos e upload com recorte de rosto aplicado a cada arte de lutador masculino/feminino.
- Persistência das vendas e dos tipos de vitória em Supabase, com trilha de auditoria.
- Apuração automática dos R$ 500 da primeira venda mensal e do maior VGV ao atingir cada evento.
- Configuração de meta, período, valores de premiação e gestão de equipes.

## Estrutura

```text
app/                     Next.js App Router e tela UMC responsiva
public/assets/            Logo UMC e retrato placeholder
supabase/migrations/      Schema, RLS, storage e regras do campeonato
.env.example              Modelo para configuração local e Vercel
vercel.json               Região São Paulo
```
