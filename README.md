# Filtro Explorador — Apenas Arquivos Abertos

Esta extensão adiciona uma view chamada "Open Editors Filter" dentro do container Explorer que lista apenas os arquivos atualmente abertos no editor. Também adiciona um botão na barra de título da guia Explorer para ativar/desativar o filtro.

Uso rápido:

- Abra a paleta de comandos e execute `Toggle Open Editors Filter`, ou clique no botão na barra de título da guia Explorer.
- Quando ativado, a view `Open Editors Filter` mostrará apenas os arquivos abertos; clique num item para abrir no editor.

Observações:

- A extensão não altera o conteúdo nativo do painel Files/Explorer — ela adiciona uma view dentro do mesmo container Explorer.
- Esta implementação é simples e evita mexer nas configurações do workspace.
