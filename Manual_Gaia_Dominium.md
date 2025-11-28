# Manual do Jogo: Gaia Dominium v2.0

## Índice

1. [Visão Geral](#visão-geral)
2. [Componentes do Jogo](#componentes-do-jogo)
3. [Estrutura de Jogo](#estrutura-de-jogo)
4. [Ações Modulares Disponíveis](#ações-modulares-disponíveis)
5. [Mecânica de Negociação (NOVA)](#mecânica-de-negociação-nova)
6. [Mecânica de Renda e Produção](#mecânica-de-renda-e-produção)
7. [Pontos de Vitória](#pontos-de-vitória)
8. [Exemplo de Partida Rápida](#exemplo-de-partida-rápida)
9. [Dicas Estratégicas](#dicas-estratégicas)
10. [Perguntas Frequentes](#perguntas-frequentes)

---

## Visão Geral

**Gaia Dominium** é um jogo de tabuleiro digital estratégico que combina elementos de Eurogames (gerenciamento de recursos, engine building) com Ameritrash (ação dinâmica, interação entre jogadores). Cada jogador controla uma **Facção** buscando expandir seu domínio florestal, gerenciar recursos escassos e acumular **Pontos de Vitória** para conquistar o controle sobre o planeta.

A versão 2.0 introduz uma **nova mecânica de negociação** que permite aos jogadores negociar não apenas recursos, mas também o controle de áreas, criando dinâmicas diplomáticas e estratégicas mais ricas.

---

## Componentes do Jogo

### Elementos Principais

| Componente | Descrição |
| :--- | :--- |
| **Facções** | Cada jogador representa uma facção única com cores distintas (Verde, Azul, Vermelho, Amarelo), possuindo recursos iniciais, renda mensal e contador de Pontos de Vitória. |
| **Mapa Florestal** | Um grid de 5×5 (25 regiões), cada uma com nome identificador, tipo de bioma, controlador e nível de exploração. |
| **Recursos** | Quatro tipos essenciais: Madeira, Pedra, Ouro e Água. |
| **Sistema de Ações** | Cinco ações modulares disponíveis a cada turno do jogador. |

### Recursos Essenciais

| Recurso | Símbolo | Descrição |
| :--- | :---: | :--- |
| **Madeira** | 🌲 | Recurso primário, obtido de regiões florestadas. Usado para construção e recolha. |
| **Pedra** | 🗿 | Utilizada em construções defensivas e estruturas. |
| **Ouro** | 💰 | Recurso premium, necessário para negociações estratégicas. |
| **Água** | 💧 | Recurso vital para produção e desenvolvimento. |

### Tipos de Bioma

| Bioma | Recursos Primários | Bônus |
| :--- | :--- | :--- |
| **Floresta Tropical** | Madeira, Ouro | +1 Madeira/turno, +0.5 Ouro/turno |
| **Floresta Temperada** | Madeira, Pedra | +1.5 Madeira/turno |
| **Savana** | Madeira, Água | +1.5 Madeira/turno, +1 Água/turno |
| **Pântano** | Água, Pedra | +1 Água/turno, +0.5 Pedra/turno |

---

## Estrutura de Jogo

### Preparação

1. Cada jogador escolhe uma **Facção** e recebe:
   - 10 Madeira
   - 5 Pedra
   - 3 Ouro
   - 5 Água
   - 0 Pontos de Vitória

2. O tabuleiro começa com regiões distribuídas entre as facções de forma equilibrada (ou aleatória, conforme configuração).

3. O turno inicial é determinado aleatoriamente.

### Fluxo de Um Turno

Cada turno segue esta sequência obrigatória:

| Fase | Nome | Descrição |
| :--- | :--- | :--- |
| **Fase 1** | **Renda Automática** | O sistema calcula automaticamente a renda baseada em regiões controladas, projetos ativos e bônus de bioma. Recursos são adicionados ao tesouro da facção. |
| **Fase 2** | **Ação Principal** | O jogador clica em um dos 5 botões de ação modular (apenas uma pode ser executada por turno). A ação é imediatamente resolvida e recursos são consumidos/ganhos. |
| **Fase 3** | **Negociação/Interação** | O jogador ativo pode iniciar uma proposta de negociação com qualquer outro jogador, incluindo troca de recursos e/ou controle de áreas. **(NOVA FASE)** |
| **Fase 4** | **Passar Turno** | O botão "Passar Turno" só fica ativo após a ação ser executada. Clicando no botão, o turno passa para o próximo jogador. |

---

## Ações Modulares Disponíveis

Limite de Ações: Cada jogador pode realizar um máximo de 2 ações únicas por turno. Uma ação (Ex: Explorar, Construir, Recolher, Negociar) não pode ser repetida no mesmo turno.
Sequência de Turno: Após realizar 2 ações diferentes, todos os botões de ação são automaticamente bloqueados, exceto o botão Finalizar Turno.

### 1. Explorar

**Custo:** 2 Madeira + 1 Água

**Efeito:**
- Aumenta o nível de exploração de uma região controlada
- Ganha **+1 Ponto de Vitória**
- Desbloqueia produção adicional naquela região
- Próximas colheitas nesta região produzem **+50% de recursos**
- **NOVO:** Há uma chance de **10% de "Descoberta Rara"**, que concede **+1 Ouro** imediatamente

**Quando Usar:** No início do jogo, para preparar regiões para produção máxima. Também útil para descobrir recursos raros.

### 2. Construir

**Custo:** 3 Madeira + 2 Pedra + 1 Ouro

**Efeito:**
- Constrói uma estrutura em uma região controlada
- Ganha **+2 Pontos de Vitória**
- A região passa a gerar **+1 recurso adicional por turno**
- Desbloqueia bônus especiais conforme o tipo de estrutura

**Quando Usar:** Quando você quer ganhar pontos rapidamente e tem recursos suficientes. Estruturas são essenciais para engine building.

### 3. Recolher

**Custo:** 1 Madeira

**Efeito:**
- Colhe recursos de regiões controladas
- Obtém **+2 de cada recurso primário** (Madeira, Pedra, Água)
- Pode obter Ouro se houver estruturas de mineração na região
- Ganha **+1 Ponto de Vitória**

**Quando Usar:** Quando você precisa repor recursos ou está acumulando para ações futuras.

### 4. Negociar

**Custo:** 1 Ouro (reduzido de 2 na v1.0)

**Efeito:**
- **Gatilho da Fase 3 (Negociação/Interação)**
- Permite ao jogador ativo iniciar uma proposta de negociação com outro jogador
- Pode incluir troca de recursos e/ou controle de áreas
- Ganha **+1 Ponto de Vitória** se a negociação for bem-sucedida
- O jogador alvo também ganha **+1 Ponto de Vitória** se aceitar

**Quando Usar:** Para balancear sua composição de recursos, adquirir áreas estratégicas, ou para interações diplomáticas com outros jogadores.

### 5. Finalizar Turno

**Custo:** Nenhum

**Efeito:**
- Passa o turno para o próximo jogador
- Reseta todas as condições para o próximo turno
- Próximo jogador recebe sua renda automática

**Quando Usar:** Sempre, após executar uma ação ou decidir não agir.

---

## Mecânica de Negociação (NOVA)

### Visão Geral

A negociação é agora uma parte central e obrigatória do turno (Fase 3). Após executar uma ação principal (Fase 2), o jogador ativo pode iniciar uma proposta de negociação com qualquer outro jogador.

### Processo de Negociação

#### Passo 1: Iniciação

O jogador ativo (A) seleciona a ação **"Negociar"** (custo: **1 Ouro**).

#### Passo 2: Seleção do Alvo

O jogador A seleciona um jogador alvo (B) para negociar.

#### Passo 3: Proposta

O jogador A propõe uma troca que pode incluir:

- **Recursos:** Troca de qualquer quantidade de Madeira, Pedra, Ouro e Água
- **Áreas:** Troca de controle de uma ou mais regiões

**Exemplos de Negociação:**
- "Ofereço 5 Madeira por 1 Ouro"
- "Ofereço 2 Regiões de Floresta por 10 Madeira"
- "Ofereço 1 Região + 5 Pedra por 3 Ouro"

#### Passo 4: Aceitação/Recusa

O jogador B recebe a proposta e pode:

- **Aceitar:** A troca é efetuada. Ambos os jogadores ganham **+1 Ponto de Vitória** pela negociação bem-sucedida.
- **Recusar:** A troca não é efetuada. Nenhum PV é ganho. O jogador A ainda perde 1 Ouro (custo da ação).

#### Passo 5: Finalização

A negociação é concluída. O jogador A pode agora passar o turno (Fase 4).

### Limitações e Regras

| Regra | Descrição |
| :--- | :--- |
| **Uma negociação por turno** | Apenas uma negociação pode ser iniciada por turno. |
| **Custo obrigatório** | Custa 1 Ouro para iniciar uma negociação, mesmo que seja recusada. |
| **Regiões controladas** | Apenas regiões controladas pelo jogador podem ser oferecidas em negociação. |
| **Recursos suficientes** | Ambos os jogadores devem ter os recursos necessários para a negociação. |
| **Sem negociação forçada** | Nenhum jogador é obrigado a aceitar uma negociação. |


### Estratégia de Negociação

**Para Iniciantes:**
- Use negociações para obter recursos que você precisa urgentemente
- Ofereça regiões menos valiosas para ganhar recursos estratégicos
- Forme alianças temporárias com outros jogadores

**Para Avançados:**
- Bloqueie regiões que outros jogadores precisam, depois negocie por um preço alto
- Use negociações para desestabilizar a liderança
- Crie cadeias de negociação (A negocia com B, B negocia com C)
- Ofereça negociações desfavoráveis para ganhar confiança, depois explore essa confiança

---

## Mecânica de Renda e Produção

### Fórmula de Cálculo

**Renda Total = (Regiões Controladas × Tipo de Bioma) + (Projetos Ativos × Multiplicador)**

Limite de Turnos Passivos: Um jogador pode Finalizar Turno sem realizar nenhuma ação (ação passiva) por no máximo 2 turnos consecutivos.
Penalidade por Passividade: Se um jogador finalizar o turno pela terceira vez consecutiva sem realizar ações, ele receberá um aviso, e o ganho de recursos base de seus Biomas (o ganho de '1' por região) será suspenso no próximo turno como penalidade por inatividade estratégica. A renda gerada por Estruturas não é afetada.


### Exemplos de Cálculo

#### Exemplo 1: Um jogador controla 5 regiões

- 2 regiões de Floresta Tropical (1 Madeira + 0.5 Ouro cada)
- 2 regiões de Savana (1.5 Madeira cada)
- 1 região de Pântano (0.5 Madeira + 1 Água)

**Renda Recebida:**
- Madeira: (2×1) + (2×1.5) + (1×0.5) = 2 + 3 + 0.5 = **5.5 Madeira** (~6 arredondado)
- Ouro: 2×0.5 = **1 Ouro**
- Água: 1×1 = **1 Água**

#### Exemplo 2: Com Projetos Ativos

Mesmo cenário anterior + 1 Projeto de "Floresta Gerenciada" (multiplicador 1.5x para Madeira)

**Nova Renda:**
- Madeira: 6 × 1.5 = **9 Madeira**
- Ouro: **1 Ouro**
- Água: **1 Água**

---

## Pontos de Vitória

Os Pontos de Vitória são ganhos através de:

| Ação | Pontos Ganhos |
| :--- | :---: |
| Explorar uma região | +1 PV |
| Construir uma estrutura | +2 PV |
| Recolher recursos | +1 PV |
| Negociação bem-sucedida (ambos os jogadores) | +1 PV |
| Controlar 50% do mapa | +5 PV |
| Primeira a atingir 3 estruturas | +3 PV |
| Encerrar turno com 15+ recursos | +2 PV |
| **NOVO:** Controlar uma região de cada bioma | +3 PV |

### Objetivo de Vitória

**Primeira facção a atingir 25 Pontos de Vitória vence o jogo.**

---

## Exemplo de Partida Rápida

### Turno 1 – Facção Verde

1. **Renda:** Sistema calcula e adiciona 3 Madeira, 1 Pedra
2. **Recursos Atuais:** 13 Madeira, 6 Pedra, 3 Ouro, 5 Água
3. **Ação:** Clica em "Explorar" → Escolhe uma região → Gasta 2 Madeira + 1 Água
4. **Resultado:** +1 PV, região agora nível 2 de exploração
5. **Negociação:** Oferece 2 Madeira para Azul em troca de 1 Ouro
6. **Resultado da Negociação:** Azul aceita! Verde ganha +1 PV, Azul ganha +1 PV
7. **Recursos Finais:** 11 Madeira, 6 Pedra, 4 Ouro, 4 Água | PV: 2
8. **Passar Turno** → Próximo jogador

### Turno 1 – Facção Azul

1. **Renda:** Sistema calcula e adiciona 2 Madeira, 1 Água
2. **Ação:** Clica em "Recolher" → Ganha +2 de cada recurso primário
3. **Resultado:** +1 PV, recursos aumentados
4. **Negociação:** Oferece 1 Ouro para Verde em troca de 3 Madeira
5. **Resultado da Negociação:** Verde aceita! Ambos ganham +1 PV
6. **Passar Turno** → Próximo jogador

### Turno 2 – Facção Verde

1. **Renda:** Mesma de antes (3 Madeira, 1 Pedra)
2. **Ação:** Clica em "Construir" → Constrói estrutura em região explorada
3. **Custo:** 3 Madeira + 2 Pedra + 1 Ouro
4. **Resultado:** +2 PV, estrutura criada, região agora produz +1 extra
5. **Negociação:** Oferece 1 Região para Amarelo em troca de 5 Pedra
6. **Resultado da Negociação:** Amarelo aceita! Ambos ganham +1 PV
7. **Recursos Finais:** 8 Madeira, 4 Pedra, 2 Ouro, 4 Água | PV: 5
8. **Passar Turno**

*Jogo continua até uma facção atingir 25 PV...*

---

## Dicas Estratégicas

### Para Iniciantes

1. **Explore primeiro:** Comece explorando suas regiões antes de construir, para desbloquear produção máxima.
2. **Equilibre recursos:** Mantenha uma distribuição balanceada entre Madeira, Pedra e Água.
3. **Guarde Ouro:** Ouro é raro e valioso; use-o estrategicamente em negociações.
4. **Passe turno rápido:** Não delay desnecessariamente; a velocidade é importante em jogos multiplayer.
5. **Comece com negociações simples:** Pratique negociações de recursos antes de negociar áreas.

### Para Jogadores Avançados

1. **Engine Building:** Construa múltiplas estruturas em regiões florestadas para multiplicadores cumulativos.
2. **Timing de Projetos:** Ative projetos nos momentos certos para maximizar renda em turnos específicos.
3. **Bloqueio de Regiões:** Explore regiões que outros jogadores precisam, forçando negociações favoráveis.
4. **Conversão Estratégica:** Use a ação Negociar para converter recursos excedentes em scarce resources.
5. **Diplomacia Dinâmica:** Forme alianças temporárias, depois quebre-as quando for vantajoso.
6. **Negociação como Arma:** Use negociações para desestabilizar líderes e fortalecer posições fracas.

---

## Perguntas Frequentes

### Gameplay

**P: Posso mudar de ação após iniciar uma?**
R: Não. Uma vez que você clica em uma ação, ela é executada. Planeje bem antes de clicar.

**P: O que acontece se não tiver recursos suficientes para uma ação?**
R: A ação não pode ser executada. O botão ficará desabilitado até você ter recursos suficientes.

**P: Quanto tempo dura uma partida completa?**
R: Uma partida para 25 PV com 2-4 jogadores leva aproximadamente 30-45 minutos.

### Negociação

**P: Posso negociar com múltiplos jogadores no mesmo turno?**
R: Não. Apenas uma negociação pode ser iniciada por turno.

**P: E se eu oferecer uma negociação e ela for recusada?**
R: Você ainda perde 1 Ouro (custo da ação). A negociação não é efetuada.

**P: Posso negociar áreas que não controlo?**
R: Não. Apenas regiões que você controla podem ser oferecidas em negociação.

**P: Há um limite de quanto posso oferecer em uma negociação?**
R: Não há limite explícito, mas ambos os jogadores devem ter os recursos/áreas oferecidas.

### Futuro

**P: Posso jogar contra a IA?**
R: Na versão atual do MVP, o jogo é multiplayer local. Futuras versões incluirão IA e multiplayer online.

**P: Regiões podem ser conquistadas em combate?**
R: Não nesta versão. Regiões são designadas no início ou negociadas. Versões futuras incluirão conflito.

---

## Mudanças da v1.0 para v2.0

| Aspecto | v1.0 | v2.0 |
| :--- | :--- | :--- |
| **Custo de Negociar** | 2 Ouro | 1 Ouro |
| **Negociação de Áreas** | Não disponível | Disponível |
| **Fase de Negociação** | Opcional | Obrigatória (Fase 3) |
| **PV por Negociação** | +1 (apenas iniciador) | +1 (ambos os jogadores) |
| **Exploração com Risco** | Não | 10% chance de Descoberta Rara |
| **Bônus de Diversidade** | Não | +3 PV por controlar biomas diferentes |

---

## Créditos & Versão

**Gaia Dominium MVP v2.0**

Jogo de estratégia digital com mecânicas de negociação aprimoradas

Desenvolvido para plataforma web interativa

Manual Versão 2.0 – Dezembro 2025

**Melhorias da v2.0:**
- Negociação de áreas implementada
- Fase 3 (Negociação) obrigatória
- Redução do custo de negociação
- Bônus de PV para negociações bem-sucedidas
- Exploração com elemento de risco/recompensa
- Bônus de diversidade de biomas

---

## Apêndice: Guia de Cores e Ícones

### Facções Padrão

| Facção | Cor | Ícone |
| :--- | :---: | :---: |
| Facção 1 | Vermelho | 🦁 |
| Facção 2 | Azul | 🐯 |
| Facção 3 | Verde | 🐻 |
| Facção 4 | Amarelo | 🦊 |

### Recursos

| Recurso | Ícone | Cor |
| :--- | :---: | :--- |
| Madeira | 🌲 | Verde |
| Pedra | 🗿 | Cinza |
| Ouro | 💰 | Amarelo |
| Água | 💧 | Azul |

---

**Divirta-se jogando Gaia Dominium!**
