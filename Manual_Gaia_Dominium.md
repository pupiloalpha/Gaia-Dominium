# Manual do Jogo: Gaia Dominium

## Índice

- [Visão geral](#visão-geral)
- [Preparação da partida](#preparação-da-partida)
- [Estrutura de cada turno](#estrutura-de-cada-turno)
- [Mapa e regiões](#mapa-e-regiões)
- [Recursos](#recursos)
- [Ações](#ações)
- [Estruturas](#estruturas)
- [Negociações](#negociações)
- [Disputas territoriais](#disputas-territoriais)
- [Eliminação e ressurreição](#eliminação-e-ressurreição)
- [Facções](#facções)
- [Eventos globais](#eventos-globais)
- [Conquistas](#conquistas)
- [Vitória](#vitória)
- [Salvamento](#salvamento)
- [Atalhos e controles](#atalhos-e-controles)

---

## Visão geral

**Gaia Dominium** é um jogo estratégico local para 2 a 4 jogadores. A partida pode combinar jogadores humanos e adversários controlados por IA.

Gaia é formada por uma grade de **25 regiões**, organizadas em 5 linhas e 5 colunas.

O objetivo depende das regras escolhidas no início da partida:

- atingir uma meta de Pontos de Vitória;
- dominar todas as regiões;
- eliminar todas as facções rivais;
- ou terminar a partida quando qualquer uma dessas condições ocorrer.

## Preparação da partida

Antes de iniciar:

1. Informe o nome de cada jogador.
2. Selecione uma das quatro facções.
3. Adicione entre 2 e 4 participantes.
4. Opcionalmente, adicione adversários IA com dificuldade Fácil, Média, Difícil ou Mestre.
5. Configure:
   - meta de 25, 50, 75 ou 100 PV;
   - condição de vitória;
   - ritmo dos eventos.

As facções disponíveis são únicas: cada uma pode ser utilizada por apenas um participante.

Na inicialização da partida:

- cada jogador recebe:
  - 10 Madeira;
  - 5 Pedra;
  - 3 Ouro;
  - 5 Água;
- o mapa recebe biomas e recursos aleatórios;
- são distribuídas **4 regiões iniciais para cada jogador**;
- o turno inicial é definido como `1`;
- o primeiro participante começa na fase de Renda;
- o jogo recebe dois eventos até que o próximo evento seja determinado.

## Estrutura de cada turno

Cada turno possui três fases.

### Fase de Renda

Ao iniciar o turno do jogador:

- as regiões controladas produzem recursos;
- as estruturas produzem seus bônus;
- facções e conquistas podem modificar a renda;
- eventos ativos podem alterar multiplicadores;
- Pontos de Vitória podem ser concedidos por estruturas ou outros efeitos.

O jogador confirma o relatório de renda na modalidade exibida na tela.

Jogadores controlados por IA recebem a renda automaticamente e avançam sem modal.

### Fase de Ações

O jogador possui **2 ações por turno**.

As ações disponíveis são:

- Explorar;
- Dominar;
- Disputar;
- Coletar;
- Construir.

Uma ação válida consume uma unidade de ação. Ações podem ser adicionadas ou removidas por habilidades especiais, como a habilidade dos Mestres das Águas.

### Fase de Negociação

A fase de Negociação permite enviar propostas para outros participantes.

Ela fornece:

- 1 oportunidade de negociação no rodado;
- troca de recursos;
- troca de regiões;
- custo padrão de 1 Ouro;
- possibilidade de efeitos gratuitos dependendo da facção ou evento.

Antes de avançar o turno, o sistema pode perguntar ao jogador humano se deseja responder propostas pendentes.

## Mapa e regiões

A grade contém 25 regiões numeradas internamente de A a Y.

Cada região possui:

- nome;
- bioma;
- recursos disponíveis;
- nível de exploração;
- controlador;
- estruturas construídas.

O nível de exploração varia de 0 a 3:

| Nível | Bônus |
|---|---|
| 0 | Produção padrão |
| 1 | Produção multiplicada por 1,25 |
| 2 | Produção multiplicada por 1,5 |
| 3 | Produção multiplicada por 2,0 |

Nível 3 também concede +1 PV a cada 3 rodadas globais.

A região pode ser:

- neutra;
- controlada pelo jogador atual;
- controlada por outro participante.

## Recursos

### Madeira

Usada principalmente para:

- explorar;
- construir estruturas;
- coletar recursos;
- dominar regiões.

Abundante em regiões florestais.

### Pedra

Usada principalmente para:

- construir estruturas;
- disputas;
- dominação territorial.

Mais comum em florestas temperadas e pântanos.

### Ouro

Usado para:

- negociações;
- construções;
- dominação;
- disputas;
- obtenção de PV por regras especiais.

É abundante em Savanas.

### Água

Usada em:

- exploração;
- construções;
- dominação;
- disputas.

É abundante em florestas tropicais e pântanos.

## Ações

As ações só podem ser realizadas na fase de Ações, exceto negociação.

### Explorar região própria

Custo:

- 1 Madeira;
- 1 Água.

Efeito:

- aumenta o nível de exploração em até 3;
- pode gerar uma descoberta rara de 1 Ouro;
- registra progresso na conquista Explorador.

Explorar não concede PV imediato.

Facções e eventos podem reduzir custos ou conceder bônus adicionais.

### Dominar região neutra

Dominar uma região neutra custa:

- os recursos exibidos no mapa da região;
- 2 PV.

A região passa a pertencer ao jogador e alcança pelo menos o nível de exploração 1.

Dominação não concede PV imediato além da possível conquista territorial.

### Coletar

Custo:

- 1 Madeira.

Requisitos:

- controlar a região;
- região já explorada;
- estar na fase de Ações.

O valor coletado corresponde à quantidade ainda disponível na região.

No nível 3 de exploração:

- a coleta utiliza 75% dos recursos da região;
- em outros níveis utilizável 50%.

Ainda pode haver bônus de:

- eventos;
- conquistas;
- habilidades de facção;
- recursos aleatórios.

Coletar não concede PV imediato.

### Construir

Requisitos:

- região controlada;
- recursos suficientes;
- estrutura ainda não construída na região.

Estruturas têm limite individual por região.

Construir não concede PV por padrão. A conquista Construtor, facções e eventos podem conceder bônus.

### Disputar

A disputa substitui a ação de Explorar quando a região pertence a outro jogador.

O jogador atacante precisa pagar:

- PV;
- Madeira;
- Pedra;
- Ouro;
- Água.

A chance de sucesso começa em 75%.

Modificadores incluem:

- diferença de PV;
- nível de exploração;
- Torre de Vigia;
- conquista da facção defensora;
- habilidade da facção atacante ou defensora.

Em caso de vitória:

- o atacante recebe a região;
- o atacante ganha 1 PV;
- o nível e as estruturas da região são preservados;
- o defensor perde 1 PV, exceto quando existe Torre de Vigia;
- o atacante registra progresso para Senhor da Guerra.

Em caso de derrota:

- o atacante recebe reembolso de 50% dos recursos pagos;
- não recebe reembolso de PV;
- a região defensora aumenta um nível de exploração;
- o defensor não recebe PV automaticamente.

## Estruturas

Somente uma estrutura de cada tipo pode ser construída em uma região.

| Estrutura | Custo | Renda e efeito |
|---|---|---|
| Abrigo | 3 Madeira, 2 Pedra, 1 Ouro | +1 Madeira e +1 Água por turno |
| Torre de Vigia | 2 Madeira, 3 Pedra | +1 PV por turno; protege contra perda de PV na defesa |
| Mercado | 4 Madeira, 1 Pedra, 2 Água | +1 Ouro por turno; reduz negocições |
| Laboratório | 3 Pedra, 2 Ouro, 1 Água | +1 Ouro por turno; descoberta rara mais provável |
| Santuário | 3 Madeira, 2 Ouro, 2 Água | +1 PV por turno; bônus em regiões adjacentes |

Estruturas desativadas por Tempestade não produzem recursos, mas Torres de Vigia e Santuários ainda podem gerar seus PV.

## Negociações

Negociar só está disponível na fase de Negociação.

Uma proposta pode incluir:

- Madeira;
- Pedra;
- Ouro;
- Água;
- regiões controladas pelo emissor;
- solicitação de regiões controladas pelo alvo.

O custo padrão é 1 Ouro.

Se a proposta é enviada:

- o custo é pago;
- uma ação de negociação é consumida;
- a proposta fica pendente até o alvo aceitar ou recusar.

Quando aceita:

- os recursos e regiões são trocados;
- ambos os jogadores recebem 1 PV;
- ambas as negociações são registradas nas conquistas;
- efeitos de facção podem conceder PV adicional.

Negociações não são executadas imediatamente; o alvo precisa responder.

## Disputas territoriais

Disputas territoriais não podem ser iniciadas na primeira rodada.

O custo dinâmico considera:

- nível de exploração da região;
- recursos iniciais do bioma;
- presença de Torre de Vigia;
- eventos ativos;
- bônus da facção atacante.

Uma disputa é confirmada em modal mostrando:

- custo final;
- chance estimada de sucesso;
- modificadores ativos.

## Eliminação e ressurreição

Um jogador é eliminado quando perde todas as regiões controladas.

A eliminação:

- reduz seus PV pela penalidade configurada;
- remove todas as regiões restantes;
- impede a realização de ações normais;
- faz o turno ser pulado.

Eliminados podem dominar uma região neutra para ressuscitar.

Custos de ressurreição:

- 2 PV;
- recursos correspondentes à região escolhida.

Ao ressuscitar:

- o jogador volta ao jogo;
- domina a região neutra;
- sua facção é reativada;
- volta a receber ações nos turnos seguintes.

Se apenas um jogador ativo permanecer, ele vence por eliminação, exceto em regras personalizadas que possam ter terminado anteriormente.

## Facções

Cada facção possui habilidades próprias.

### Guardiões da Floresta

- bônus em regiões Floresta Tropical;
- explorar custa 1 Madeira a menos;
- +25% de produção global de Madeira;
- vantagem de disputa e defesa em florestas tropicais.

### Mestres das Águas

- bônus em regiões Pântano;
- primeira negociação do turno pode ser gratuita;
- explorar região aquática concede uma ação extra;
- coleta em região aquática pode conceder recurso extra;
- vantagem em disputas e defesa em pântanos.

### Construtores da Montanha

- bônus em Savanas;
- construção custa 1 Pedra a menos;
- estruturas concedem 1 PV extra;
- +25% de produção global de Pedra;
- vantagem em disputas e defesa com Torre de Vigia.

### Barões do Comércio

- bônus em Floresta Temperada;
- ouro adicional proporcional às regiões controladas;
- negociações bem-sucedidas podem conceder 1 PV;
- mercados têm 50% de desconto;
- maior chance de encontrar Ouro ao explorar;
- vantagem de disputa e defesa em florestas temperadas.

## Eventos globais

Por padrão, um evento global ocorre a cada 4 rodadas completas.

No modo **Evento a Cada Rodada**, um novo evento é gerado no início de cada rodada.

Eventos podem durar uma ou duas rodadas.

### Exemplos positivos

- Primavera Abundante: +100% Madeira;
- Mercado Aquecido: negociações gratuitas;
- Festival da Colheita: recursos extras ao coletar;
- Era da Exploração: explorar custa 1 Madeira a menos;
- Enchente: produção dos Pântanos em dobro;
- Jazida: +2 Ouro em Savanas.

### Exemplos negativos

- Seca: -50% Água;
- Tempestade: estruturas não produzem recursos;
- Escassez de Pedra: -50% Pedra;
- Tempestade de Areia: Savanas não produzem;
- Depressão Econômica: todos perdem 2 Ouro;
- Inflação: custos territoriais e ações ficam mais caros.

### Eventos mistos ou especiais

- Inverno Rigoroso: Madeira adicional ao coletar;
- Tecnologia: construção concede +1 PV;
- Descoberta Arqueológica: 3 PV para o jogador com menos regiões.

## Conquistas

Conquistas são rastreadas individualmente por jogador.

| Conquista | Requisito | Recompensa |
|---|---|---|
| Explorador | 10 explorações | +1 PV por turno |
| Construtor | 5 estruturas | -1 custo em construções |
| Diplomata | 10 negociações | -1 Ouro em negociações |
| Colecionador | Coletar em 8 regiões diferentes | +1 recurso ao coletar |
| Diversificador | Controlar os 4 biomas | +3 PV |
| Magnata | Acumular 20 de cada recurso | +10% da renda |
| Senhor da Guerra | 5 disputas vencidas | +15% de chance em disputas |
| Conquistador | Controlar 10 regiões | +10% de defesa |
| Vencedor Rápido | Vencer antes do turno 15 | Conquista de vitória |
| Pacifista | Vencer sem negociações | +5 PV |

O requisito Pacifista é avaliado somente no momento da vitória.

## Vitória

### Vitória por PV

O primeiro jogador não eliminado a alcançar a meta configurada vence imediatamente.

### Vitória por Dominação

A partida continua até todas as 25 regiões serem dominadas.

O vencedor é o jogador que controla mais regiões. Empates são resolvidos por maior quantidade de PV.

### Vitória por Eliminação

Vence o último jogador ativo.

### Vitória Mista

A partida termina assim que qualquer condição for alcançada:

- meta de PV;
- 25 regiões dominadas;
- eliminação dos rivais.

Se todos os jogadores forem eliminados, a partida termina sem vencedor.

## Salvamento

A partida usa `LocalStorage`.

Recursos persistidos:

- estado das regiões;
- jogadores;
- recursos;
- PV;
- fase;
- turno;
- eventos;
- conquistas;
- negociações pendentes;
- histórico limitado de ações.

O jogo recebe auto-save a cada 30 segundos.

O gerenciador permite:

- carregar partidas;
- substituir partidas antigas;
- excluir salvamentos individuais;
- migrar dados antigos;
- iniciar uma partida nova.

Saves são específicos do navegador e do domínio em que o jogo foi aberto.

## Atalhos e controles

### Teclas

- `1`: Explorar / Disputar / Dominar;
- `2`: Coletar;
- `3`: Construir;
- `4`: Negociar;
- `5`: Disputar diretamente;
- `Escape`: fechar modais ou cancelar ações;
- `Ctrl + Shift + I`: painel de depuração da IA.

### Mouse

- Clique em uma região para selecioná-la.
- Clique em ação no rodapé para executá-la.
- Use os controles de zoom para aproximar ou afastar o mapa.
- Use o painel lateral para consultar recursos e conquistas.
- Clique no nome de um jogador na barra superior para consultar seu painel.
