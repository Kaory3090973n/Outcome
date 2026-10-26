# MAPA DO JOGO OUTCOME (cole isto no início de cada chat novo)

Jogo 2D de cima, em canvas, JavaScript puro. Versão 0.53.2 (atualização nº 104). Online usa PeerJS (CDN). Config em localStorage ('oc_cfg').
O jogo está dividido em 15 arquivos .js (carregados em ordem no index.html; todos compartilham as mesmas variáveis e funções, então ao adicionar um arquivo novo, coloque a tag <script> na ordem certa). Pedir uma mudança: diga o assunto, eu digo qual arquivo/função mandar.

| Arquivo | Tamanho | O que tem (nomes para procurar) |
|---|---|---|
| 01-config-armas.js | 99 KB | constantes `C`, `SLIDE`, `LOW/LOWC`, `shotHit`, `glassHit`, `DIFFS` (dificuldades), `SIL`, `WEAPONS` (stats e desenho das armas), `LEN`, `WKEYS`, `drawSide`, `drawWeapon` |
| 02-estado-audio-personagens.js | 34 KB | `MODES/PTS/LOOTS`, `NET`, `KEYDEFS/KEYS`, `cfg`, ÁUDIO (`sfx*`, `GUN_SND`, `TRACKS`, `LOBBY`, `scheduleStep`, `updateMusic`), `CHARS` e `CSTATS` (personagens), `applyChar`, `saveCfg` |
| 03-input-touch.js | 13 KB | `input`, teclado/mouse, `touchLayout`, `onTouch*`, `drawTouch`, `resize` |
| 04-partida-combate.js | 37 KB | `makeFighter`, `giveWeapon`, `startGame`, `startMatch`, `endRound`, `stepMatch`, `tryPunch`, `damage`, sangue (`BLEED`, `updateBlood`), `kill`, `shoot`, `throwWeapon`, `updateFighter`, `slideCrash`, `collide` |
| 05-ia-cobertura-update.js | 11 KB | `playerIntent`, `botIntent` (IA), `updateBullets`, cobertura (`updateCover`), `updatePlay` |
| 06-desenho-do-mapa.js | 22 KB | `drawFloor`, `DRAW_KIND` (visual dos obstáculos), `drawCrates`, piso (`concreteG`, `gratingG`...), `mapLayer`, `beam` |
| 07-mapas.js | 35 KB | obstáculos novos e `MAPS` (layout de cada mapa) |
| 08-desenho-personagens-hud.js | 36 KB | `drawPickups`, `drawArm`, `drawKnocked`, `drawSlide`, `drawFighter`, `drawFx`, `drawTopRight`, `drawComboMark`, `drawHUD` |
| 09-menus-configurar.js | 35 KB | `button`, `BTN_TIPS`, `menuBg`, `lobbyBg`, `drawLogo`, `drawMenu`, `drawSetupPre`, `startSetup` |
| 10-tutorial-modos-mapas.js | 32 KB | `TUT_STEPS`, `startTutorial`, `drawTutorial`, `drawTrain`, `drawModes`, `drawMaps`, `drawMatchHUD`, `drawMatchEnd` |
| 11-abertura.js | 31 KB | intro: chapéu 3D (`HAT`), `drawMan`, `introScene`, vidro quebrando, `drawIntro` |
| 12-pausa-opcoes-armas-personagens.js | 32 KB | `drawPause`, `drawOptions`, tela ARMAS (`drawPicker`, `weaponPanel`), tela PERSONAGENS (`drawBust`, `charPanel`, `drawChars`) |
| 13-historico.js | 5 KB | `UPDATES` (só a última; a cada atualização a entrada é SUBSTITUÍDA; o canto inferior direito do lobby mostra UPDATES[0].v), `drawLog`, `drawDead` |
| 14-online.js | 71 KB | PeerJS: `createRoom`, `joinRoom`, times, votação (`sel*`), `drawPick`, `netSnap`, `applySnap`, `clientStep`, `drawRoom`, `drawJoin` |
| 15-loop.js | 4 KB | `loop(now)`: escolhe a tela por `state` e roda o jogo |

Também: index.html, style.css, fs.js (tela cheia no celular), icon.js (ícone).
Telas (`state`): intro, menu, modes, train, setup, maps, pick, room, join, chars, info (armas), options, log, play, pause, mend, tutend, dead.

Atalhos: arma → 01 `WEAPONS` (+ som `GUN_SND` no 02) · personagem → 02 `CHARS/CSTATS` · bots → 01 `DIFFS` + 05 `botIntent` · deslize → 01 `SLIDE` + 04 `updateFighter` · mapa → 07 `MAPS` + 06 `DRAW_KIND` · celular → 03 + fs.js · botões → 09 `button`
