import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

// Definizione delle forme dei blocchi
type BlockShape = boolean[][];
type BlockType = "normal" | "gold" | "gamecoin";

interface Block {
  shape: BlockShape;
  type: BlockType;
}

interface GameState {
  grid: (BlockType | null)[][];
  availableBlocks: Block[];
  score: number;
  gameOver: boolean;
}

// Definizione delle forme possibili dei blocchi
const BLOCK_SHAPES: BlockShape[] = [
  [[true]], // 1x1
  [[true, true]], // 1x2
  [[true], [true]], // 2x1
  [[true, true], [true, true]], // 2x2
  [[true, true, true]], // 1x3
  [[true], [true], [true]], // 3x1
  [[true, true], [true, false]], // L shape
  [[true, false], [true, true]], // reversed L
];

const GRID_SIZE = 10;

export default function BlockBlast() {
  const [gameState, setGameState] = useState<GameState>({
    grid: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)),
    availableBlocks: [],
    score: 0,
    gameOver: false,
  });

  const { toast } = useToast();

  const collectRewardMutation = useMutation({
    mutationFn: async ({ credits, gamecoins }: { credits: number; gamecoins: number }) => {
      const res = await apiRequest("POST", "/api/collect", {
        credits,
        gamecoins,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Ricompensa ottenuta!",
        description: "Hai completato delle righe e guadagnato ricompense!",
      });
    },
  });

  // Genera un nuovo blocco con tipo casuale
  const generateBlock = (): Block => {
    const randomShape = BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)];
    const type: BlockType = Math.random() > 0.95 
      ? "gamecoin" 
      : Math.random() > 0.8 
        ? "gold" 
        : "normal";

    return { shape: randomShape, type };
  };

  // Genera 3 nuovi blocchi
  const generateNewBlocks = () => {
    const newBlocks = Array(3).fill(null).map(() => generateBlock());
    setGameState(prev => ({ ...prev, availableBlocks: newBlocks }));
  };

  // Verifica se un blocco può essere posizionato in una data posizione
  const canPlaceBlock = (block: Block, row: number, col: number): boolean => {
    for (let i = 0; i < block.shape.length; i++) {
      for (let j = 0; j < block.shape[i].length; j++) {
        if (block.shape[i][j]) {
          const newRow = row + i;
          const newCol = col + j;

          if (newRow >= GRID_SIZE || newCol >= GRID_SIZE) return false;
          if (gameState.grid[newRow][newCol] !== null) return false;
        }
      }
    }
    return true;
  };

  // Posiziona un blocco sulla griglia
  const placeBlock = (blockIndex: number, row: number, col: number) => {
    if (gameState.gameOver) return;

    const block = gameState.availableBlocks[blockIndex];
    if (!block || !canPlaceBlock(block, row, col)) return;

    const newGrid = gameState.grid.map(row => [...row]);

    // Posiziona il blocco
    for (let i = 0; i < block.shape.length; i++) {
      for (let j = 0; j < block.shape[i].length; j++) {
        if (block.shape[i][j]) {
          newGrid[row + i][col + j] = block.type;
        }
      }
    }

    // Rimuovi il blocco usato
    const newBlocks = [...gameState.availableBlocks];
    newBlocks.splice(blockIndex, 1);

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      availableBlocks: newBlocks,
    }));

    checkLines(newGrid);

    // Se non ci sono più blocchi disponibili, genera nuovi blocchi
    if (newBlocks.length === 0) {
      generateNewBlocks();
    }

    // Verifica game over
    checkGameOver();
  };

  // Verifica e rimuove le linee complete
  const checkLines = (grid: (BlockType | null)[][]) => {
    let creditsEarned = 0;
    let gamecoinsEarned = 0;
    let linesCleared = 0;

    // Controlla righe
    for (let i = 0; i < GRID_SIZE; i++) {
      if (grid[i].every(cell => cell !== null)) {
        // Conta le ricompense
        grid[i].forEach(cell => {
          if (cell === "gold") creditsEarned += 5;
          if (cell === "gamecoin") gamecoinsEarned += 1;
        });

        // Pulisci la riga
        grid[i].fill(null);
        linesCleared++;
      }
    }

    // Controlla colonne
    for (let j = 0; j < GRID_SIZE; j++) {
      const column = grid.map(row => row[j]);
      if (column.every(cell => cell !== null)) {
        // Conta le ricompense
        column.forEach(cell => {
          if (cell === "gold") creditsEarned += 5;
          if (cell === "gamecoin") gamecoinsEarned += 1;
        });

        // Pulisci la colonna
        for (let i = 0; i < GRID_SIZE; i++) {
          grid[i][j] = null;
        }
        linesCleared++;
      }
    }

    if (linesCleared > 0) {
      setGameState(prev => ({
        ...prev,
        grid,
        score: prev.score + (linesCleared * 100),
      }));

      if (creditsEarned > 0 || gamecoinsEarned > 0) {
        collectRewardMutation.mutate({ credits: creditsEarned, gamecoins: gamecoinsEarned });
      }
    }
  };

  // Verifica se il gioco è finito
  const checkGameOver = () => {
    const canPlaceAnyBlock = gameState.availableBlocks.some(block => {
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (canPlaceBlock(block, i, j)) return true;
        }
      }
      return false;
    });

    if (!canPlaceAnyBlock) {
      setGameState(prev => ({ ...prev, gameOver: true }));
      toast({
        title: "Game Over!",
        description: `Punteggio finale: ${gameState.score}`,
      });
    }
  };

  // Inizializza il gioco
  const initGame = () => {
    setGameState({
      grid: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)),
      availableBlocks: [],
      score: 0,
      gameOver: false,
    });
    generateNewBlocks();
  };

  useEffect(() => {
    initGame();
  }, []);

  const getBlockColor = (type: BlockType | null): string => {
    switch (type) {
      case "normal":
        return "bg-primary/20";
      case "gold":
        return "bg-yellow-400/20";
      case "gamecoin":
        return "bg-blue-500/20";
      default:
        return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
    }
  };

  const getBlockSymbol = (type: BlockType | null): string => {
    switch (type) {
      case "normal":
        return "⬜";
      case "gold":
        return "✨";
      case "gamecoin":
        return "💎";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex justify-between w-full max-w-xl mb-4">
        <div>
          <p className="text-lg font-semibold">Punteggio: {gameState.score}</p>
          <p className="text-sm text-muted-foreground">Blocchi disponibili: {gameState.availableBlocks.length}</p>
        </div>
        <Button onClick={initGame}>Nuova Partita</Button>
      </div>

      {/* Blocchi disponibili */}
      <div className="flex gap-4 mb-4">
        {gameState.availableBlocks.map((block, blockIndex) => (
          <div key={blockIndex} className="p-2 border rounded">
            <div className="grid grid-flow-row gap-1" style={{ gridTemplateColumns: `repeat(${block.shape[0].length}, 1fr)` }}>
              {block.shape.map((row, i) => (
                row.map((cell, j) => (
                  <div
                    key={`${i}-${j}`}
                    className={`w-6 h-6 ${cell ? getBlockColor(block.type) : 'invisible'}`}
                  >
                    {cell && getBlockSymbol(block.type)}
                  </div>
                ))
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Griglia di gioco */}
      <Card className="p-4">
        <div className="grid grid-cols-10 gap-1">
          {gameState.grid.map((row, i) =>
            row.map((cell, j) => (
              <motion.button
                key={`${i}-${j}`}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${getBlockColor(cell)}`}
                onClick={() => {
                  if (gameState.availableBlocks.length > 0) {
                    placeBlock(0, i, j);
                  }
                }}
                whileHover={{ scale: cell === null && !gameState.gameOver ? 1.1 : 1 }}
                disabled={cell !== null || gameState.gameOver}
              >
                {getBlockSymbol(cell)}
              </motion.button>
            ))
          )}
        </div>
      </Card>

      {gameState.gameOver && (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Game Over!</h3>
          <p className="text-muted-foreground">Punteggio finale: {gameState.score}</p>
          <Button onClick={initGame} className="mt-4">
            Gioca ancora
          </Button>
        </div>
      )}
    </div>
  );
}