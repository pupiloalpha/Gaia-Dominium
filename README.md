# 🌍 Gaia Dominium

**Gaia Dominium** é um jogo de tabuleiro digital estratégico para 2 a 4 jogadores. Combine gerenciamento de recursos e construção de motores econômicos com ações dinâmicas, disputas territoriais e negociações em tempo real no mesmo dispositivo.

O projeto é uma aplicação web estática desenvolvida com **HTML, CSS e JavaScript puro**, organizada em módulos ES6 e publicada pelo GitHub Pages.

<p align="center">
  <a href="https://pupiloalpha.github.io/Gaia-Dominium/">
    <strong>🎮 Jogar no GitHub Pages</strong>
  </a>
</p>

---

## 🎯 Objetivo

Conquiste o domínio sobre Gaia acumulando **25 Pontos de Vitória (PV)**.

Cada turno permite:

- receber recursos das regiões controladas;
- explorar e recolher materiais;
- construir estruturas;
- negociar com outros jogadores;
- disputar regiões;
- superar eventos ambientais aleatórios;
- desbloquear conquistas.

## ✨ Principais recursos

- Mapa interativo de 25 regiões em uma grade 5×5;
- suporte a partidas locais para 2 a 4 jogadores;
- gerenciamento de Madeira, Pedra, Ouro e Água;
- quatro biomas com rendas e recursos distintos;
- exploração de regiões em até três níveis;
- cinco tipos de estruturas;
- eventos globais temporários;
- conquistas e recompensas;
- negociações entre jogadores;
- oponentes controlados por IA;
- fases de turno, disputa territorial e feedback visual;
- salvamento automático com `LocalStorage`;
- interface adaptada para computadores e dispositivos móveis;
- manual integrado à própria aplicação.

## 🧩 Mecânicas principais

| Elemento | Descrição |
|---|---|
| Recursos | Madeira, Pedra, Ouro e Água são usados em ações e construções |
| Renda | Regiões e estruturas produzem recursos no início do turno |
| Exploração | Melhora a produtividade das regiões controladas |
| Construção | Cria estruturas que ampliam renda e efeitos estratégicos |
| Negociação | Permite trocar recursos ou regiões com outros jogadores |
| Eventos | Modificam temporariamente as condições da partida |
| Conquistas | Registram objetivos alcançados e concedem bônus |
| Vitória | A partida termina quando uma facção alcança 25 PV |

## 🕹️ Como jogar

1. Acesse a [versão publicada](https://pupiloalpha.github.io/Gaia-Dominium/).
2. Adicione de 2 a 4 jogadores.
3. Escolha nomes e ícones para as facções.
4. Inicie a partida.
5. Em cada turno, gerencie renda, ações e negociações.
6. Controle regiões, desenvolva sua economia e acumule pontos de vitória.

A documentação completa está disponível em:

- [Manual do jogo](./Manual_Gaia_Dominium.md)
- [Documentação técnica](./Documentation.md)

## 🚀 Executar localmente

Como o projeto utiliza módulos JavaScript, recomenda-se executar um servidor HTTP local.

```bash
git clone https://github.com/pupiloalpha/Gaia-Dominium.git
cd Gaia-Dominium
python -m http.server 8000
```

Abra `http://localhost:8000` no navegador.

Também é possível hospedar diretamente os arquivos em qualquer serviço compatível com sites estáticos.

## 🛠️ Tecnologias

- HTML5
- CSS3
- JavaScript ES6+
- Módulos JavaScript nativos
- Tailwind CSS via CDN
- LocalStorage
- GitHub Pages

Não é necessário instalar pacotes ou executar um processo de build.

## 📁 Estrutura do projeto

```text
Gaia-Dominium/
├── index.html                 # Estrutura da aplicação
├── style.css                  # Estilos personalizados e responsividade
├── assets/
│   ├── images/                # Imagens e recursos visuais
│   └── videos/                # Recursos em vídeo
└── js/
    ├── main.js                # Inicialização da aplicação
    ├── ai/                    # Gerenciamento e decisões da IA
    ├── logic/                 # Regras, turnos e ações
    ├── state/                 # Estado e configurações do jogo
    ├── ui/                    # Interface e componentes visuais
    └── utils/                 # Utilitários e manual integrado
```

## 💾 Salvamento

A partida é armazenada no navegador por meio do `LocalStorage`.

Os dados podem ser:

- salvos automaticamente;
- carregados ao reabrir o jogo;
- substituídos por uma nova partida;
- removidos pelo sistema de gerenciamento de saves.

Os saves são específicos do navegador e do domínio em que o jogo foi aberto.

## 🤝 Contribuição

Contribuições são bem-vindas.

1. Faça um fork do repositório.
2. Crie uma branch para sua alteração.
3. Implemente e teste a funcionalidade.
4. Abra um Pull Request descrevendo o resultado.

Sugestões de melhorias:

- testes automatizados da lógica do jogo;
- novos biomas e estruturas;
- opções de dificuldade da IA;
- balanceamento adicional;
- persistência de configurações;
- melhorias de acessibilidade;
- suporte a multiplayer remoto.

## 📄 Licença

Nenhuma licença foi definida neste repositório. Entre em contato com o autor antes de reutilizar ou distribuir o código para fins externos.

---

Desenvolvido por [pupiloalpha](https://github.com/pupiloalpha).
