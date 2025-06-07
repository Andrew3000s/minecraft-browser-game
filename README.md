# 🏗️ Minecraft Browser Game - Enhanced Edition

Un gioco Minecraft completo e realistico che puoi giocare direttamente nel browser! Costruito con HTML5 Canvas e JavaScript avanzato, ora con illuminazione realistica e funzionalità complete.

## ✨ Nuove Funzionalità (Enhanced Edition)

### 💡 **Sistema di Illuminazione Realistico**
- **Torce Funzionanti**: Le torce ora illuminano realmente l'ambiente durante la notte
- **Lighting Autentico**: Sistema di illuminazione avanzato che rivela i blocchi circostanti
- **Effetti Atmosferici**: Sfarfallio naturale delle torce con luce calda arancione
- **Visibilità Notturna**: Esperienza Minecraft autentica dove le torce sono essenziali

### 📦 **Inventario Espanso Completo**
- **9 Slot Completi**: Inventario pre-caricato con strumenti e blocchi
- **Diamond Pickaxe**: Strumento per mining istantaneo (slot 1)
- **64 Torce**: Per illuminazione estesa (slot 2)
- **Blocchi Vari**: Dirt, Stone, Wood, Sand, Grass, Leaves, Coal (slot 3-9)
- **UI Professionale**: Contatori visivi e icone per ogni oggetto

### 🎮 **Controlli Ottimizzati**
- **Tasto B**: Sistema di drop preciso - lascia cadere 1 blocco per volta
- **Tasto I**: Toggle inventario senza auto-drop
- **Controlli Italiani**: Interfaccia completamente in italiano

## 🎮 Caratteristiche Core

### 🌍 Mondo Procedurale
- Generazione automatica del terreno con colline e valli
- Biomi diversificati con erba, pietra, sabbia e acqua
- Alberi generati proceduralmente
- Minerali sotterranei (carbone, ferro, diamante)
- Mondo di 200x100 blocchi

### 🌅 Ciclo Giorno/Notte Completo
- **Durata Realistica**: 5 minuti per ciclo completo
- **Transizioni Naturali**: Alba e tramonto con colori sfumati
- **Stelle Notturne**: Cielo stellato durante la notte
- **Atmosfera Dinamica**: Colori del cielo che cambiano in tempo reale

### 👤 Sistema Giocatore Avanzato
- Movimento fluido con WASD
- Fisica realistica con gravità
- Salto e movimento in acqua
- Sistema di salute con cuori visuali
- Animazioni di camminata fluide

### 🔨 Sistema di Costruzione Professionale
- **Diamond Pickaxe**: Rompe blocchi istantaneamente (eccetto bedrock)
- **Mining Visivo**: Indicatori progressivi con crepe realistiche
- **Preview Blocchi**: Anteprima semi-trasparente del posizionamento
- **Indicatore Mouse**: Contorno tratteggiato sui blocchi target
- **Range Limitato**: Sistema di reach realistico (150 unità)

### 🎨 Grafica e UI Avanzata
- Rendering pixelato in stile Minecraft autentico
- **Lighting Engine**: Sistema di illuminazione avanzato con composite blending
- **Particle System**: Effetti particellari per rottura blocchi, salti, danni
- **UI Completa**: Salute, inventario, tempo, posizione, FPS
- **Feedback Visivo**: Effetti audio-visivi per ogni azione

## 🕹️ Controlli Completi

| Tasto/Input | Azione |
|-------------|--------|
| **W, A, S, D** | Movimento |
| **Spazio** | Salto |
| **Click Sinistro** | Distruggi blocco |
| **Click Destro** | Piazza blocco |
| **Rotella Mouse** | Cambia blocco attivo |
| **1-9** | Selezione inventario |
| **I** | Mostra/Nascondi inventario |
| **B** | Lascia cadere 1 blocco |
| **C** | Apri crafting |

## 🚀 Come Giocare

1. Apri `index.html` nel tuo browser
2. Attendi il caricamento del mondo
3. Usa WASD per muoverti
4. Click sinistro per distruggere blocchi
5. Click destro per piazzare blocchi
6. Esplora e costruisci!

## 🏗️ Struttura del Progetto

```
minecraft-browser-game/
├── index.html              # File HTML principale
├── README.md              # Questo file
└── src/
    ├── css/
    │   ├── style.css      # Stili base dell'UI
    │   └── game.css       # Stili specifici del gioco
    └── js/
        ├── game.js        # Motore principale del gioco
        ├── player.js      # Sistema del giocatore
        ├── world.js       # Generazione e gestione del mondo
        ├── blocks.js      # Sistema dei blocchi
        ├── input.js       # Gestione input
        └── utils.js       # Funzioni utility
```

## 🧱 Tipi di Blocchi

- **🟫 Terra (Dirt)** - Blocco base per costruzioni
- **🟩 Erba (Grass)** - Superficie naturale
- **⬜ Pietra (Stone)** - Materiale resistente
- **🟤 Legno (Wood)** - Da alberi abbattuti
- **🟢 Foglie (Leaves)** - Decorazione naturale
- **🟨 Sabbia (Sand)** - Blocco granulare
- **⚫ Minerale di Carbone** - Combustibile
- **🟠 Minerale di Ferro** - Metallo prezioso
- **💎 Minerale di Diamante** - Gemma rara

### 🔧 Strumenti Speciali
- **⛏️ Piccone di Diamante** - Strumento avanzato per mining istantaneo
  - Colore ciano distintivo
  - Rompe qualsiasi blocco istantaneamente (eccetto bedrock)
  - Disponibile all'inizio del gioco nel primo slot dell'inventario

## ⚡ Caratteristiche Tecniche

- **Engine**: JavaScript ES6+ con Canvas API
- **Fisica**: Sistema di collisioni personalizzato
- **Rendering**: Ottimizzato con culling della viewport
- **Performance**: 60 FPS target con game loop ottimizzato
- **Memoria**: Gestione efficiente dei blocchi con sparse arrays

## 🆕 Miglioramenti Recenti

### ✨ Nuove Funzionalità
- **🎯 Game Centrato**: Il gioco è ora perfettamente centrato nella finestra del browser per un'esperienza visiva ottimale
- **⛏️ Piccone di Diamante**: Nuovo strumento potente che rompe i blocchi istantaneamente
  - Colore ciano distintivo nell'inventario
  - Mining istantaneo per tutti i blocchi (eccetto bedrock)
  - Disponibile fin dall'inizio nel primo slot
- **💧 Generazione Acqua Migliorata**: L'acqua ora appare correttamente a livello del suolo invece che nel cielo
- **🎯 Indicatore Blocchi**: Contorno tratteggiato bianco mostra chiaramente quale blocco stai puntando
- **👁️ Anteprima Blocchi Migliorata**: I blocchi da piazzare appaiono semi-trasparenti per una migliore visualizzazione

### 🔧 Miglioramenti Tecnici
- Layout CSS ottimizzato con flexbox per centratura perfetta
- Sistema di rendering migliorato per indicatori visivi
- Logica di generazione mondo ottimizzata
- Gestione inventario potenziata con nuovi strumenti

## 🛠️ Funzionalità Avanzate

### Sistema di Fisica
- Gravità realistica
- Collisioni precise
- Resistenza dell'acqua (ora correttamente posizionata a livello del suolo)
- Attrito del terreno

### Generazione del Mondo
- Algoritmo di rumore per terreni naturali
- Posizionamento intelligente degli alberi
- **Acqua migliorata**: Generazione corretta dell'acqua a livello del suolo
- Distribuzione realistica dei minerali
- Spawn sicuro del giocatore

### UI/UX
- Feedback visivo per mining
- **Anteprima blocchi migliorata**: Rendering semi-trasparente
- **Indicatore mouse**: Contorno tratteggiato bianco sui blocchi target
- **Layout centrato**: Game perfettamente centrato nella finestra del browser
- Informazioni contextual
- Design responsive

## 🐛 Debug e Sviluppo

Il gioco include funzionalità di debug:
- Posizione del giocatore in tempo reale
- FPS counter
- Informazioni sui blocchi
- Console JavaScript accessibile tramite `window.game`

## 🔧 Personalizzazione

Puoi facilmente modificare:
- Dimensioni del mondo in `world.js`
- Tipi di blocchi in `blocks.js`
- Controlli in `input.js`
- Stili visuali nei file CSS

## 📱 Compatibilità

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- 📱 Mobile (controlli touch limitati)

## 🚀 Prestazioni

- **Rendering ottimizzato**: Solo i blocchi visibili vengono renderizzati
- **Memoria efficiente**: Sparse array per la gestione dei blocchi vuoti
- **60 FPS target**: Game loop ottimizzato per performance fluide

---

**Divertiti a costruire e esplorare il tuo mondo Minecraft! 🎮**