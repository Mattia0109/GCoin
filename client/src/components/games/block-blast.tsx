import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Definizione delle forme dei blocchi
type BlockShape = boolean[][];
type BlockType = "normal" | "gold" | "gamecoin";

interface Block {
  shape: BlockShape;
  type: BlockType;
  color?: string; // Colore per i blocchi normali
}

interface GameState {
  grid: (BlockType | null)[][];
  gridColors: (string | null)[][]; // Colori della griglia
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

// Colori per i blocchi normali
const BLOCK_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-orange-500",
  "bg-pink-500",
];

const GRID_SIZE = 10;

function DraggableBlock({ block, index }: { block: Block; index: number }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "block",
    item: { block, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-1 border rounded ${isDragging ? 'opacity-50' : ''}`}
      style={{ cursor: 'move' }}
    >
      <div 
        className="grid grid-flow-row" 
        style={{ 
          gridTemplateColumns: `repeat(${block.shape[0].length}, 1fr)`,
        }}
      >
        {block.shape.map((row, i) => (
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className={`w-6 h-6 flex items-center justify-center ${
                cell ? (
                  block.type === "normal" 
                    ? block.color 
                    : block.type === "gold"
                      ? "bg-yellow-400"
                      : "bg-blue-600"
                ) : 'invisible'
              }`}
            >
              {cell && (block.type !== "normal" ? (block.type === "gold" ? "✨" : "💎") : "")}
            </div>
          ))
        ))}
      </div>
    </div>
  );
}

function DroppableCell({ 
  onDrop, 
  row, 
  col, 
  type, 
  color
}: { 
  onDrop: (item: any, row: number, col: number) => void;
  row: number;
  col: number;
  type: BlockType | null;
  color: string | null;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "block",
    drop: (item: any) => onDrop(item, row, col),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`w-8 h-8 flex items-center justify-center ${
        type ? (
          type === "normal" 
            ? color 
            : type === "gold"
              ? "bg-yellow-400"
              : "bg-blue-600"
        ) : 'bg-gray-100 dark:bg-gray-800'
      } ${isOver ? 'opacity-50' : ''}`}
    >
      {type && (type !== "normal" ? (type === "gold" ? "✨" : "💎") : "")}
    </div>
  );
}

export default function BlockBlast() {
  const [gameState, setGameState] = useState<GameState>({
    grid: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)),
    gridColors: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)),
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

  // Genera un nuovo blocco con tipo e colore casuali
  const generateBlock = (): Block => {
    const randomShape = BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)];
    const type: BlockType = Math.random() > 0.95 
      ? "gamecoin" 
      : Math.random() > 0.8 
        ? "gold" 
        : "normal";

    const color = type === "normal" 
      ? BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)]
      : undefined;

    return { shape: randomShape, type, color };
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

  // Gestisce il drop di un blocco
  const handleDrop = (item: { block: Block; index: number }, row: number, col: number) => {
    if (gameState.gameOver) return;
    if (!canPlaceBlock(item.block, row, col)) return;

    const newGrid = gameState.grid.map(row => [...row]);
    const newGridColors = gameState.gridColors.map(row => [...row]);

    // Posiziona il blocco
    for (let i = 0; i < item.block.shape.length; i++) {
      for (let j = 0; j < item.block.shape[i].length; j++) {
        if (item.block.shape[i][j]) {
          newGrid[row + i][col + j] = item.block.type;
          newGridColors[row + i][col + j] = item.block.color || null;
        }
      }
    }

    // Rimuovi il blocco usato
    const newBlocks = [...gameState.availableBlocks];
    newBlocks.splice(item.index, 1);

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      gridColors: newGridColors,
      availableBlocks: newBlocks,
    }));

    checkLines(newGrid, newGridColors);

    // Se non ci sono più blocchi disponibili, genera nuovi blocchi
    if (newBlocks.length === 0) {
      generateNewBlocks();
    }

    // Verifica game over
    checkGameOver(newBlocks);
  };

  // Verifica e rimuove le linee complete
  const checkLines = (grid: (BlockType | null)[][], gridColors: (string | null)[][]) => {
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
        gridColors[i].fill(null);
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
          gridColors[i][j] = null;
        }
        linesCleared++;
      }
    }

    if (linesCleared > 0) {
      setGameState(prev => ({
        ...prev,
        grid,
        gridColors,
        score: prev.score + (linesCleared * 100),
      }));

      if (creditsEarned > 0 || gamecoinsEarned > 0) {
        collectRewardMutation.mutate({ credits: creditsEarned, gamecoins: gamecoinsEarned });
      }
    }
  };

  // Verifica se il gioco è finito
  const checkGameOver = (blocks: Block[]) => {
    const canPlaceAnyBlock = blocks.some(block => {
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
      gridColors: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)),
      availableBlocks: [],
      score: 0,
      gameOver: false,
    });
    generateNewBlocks();
  };

  useEffect(() => {
    initGame();
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col items-center gap-8">
        <div className="flex justify-between w-full max-w-xl mb-4">
          <div>
            <p className="text-lg font-semibold">Punteggio: {gameState.score}</p>
            <p className="text-sm text-muted-foreground">
              Blocchi disponibili: {gameState.availableBlocks.length}
            </p>
          </div>
          <Button onClick={initGame}>Nuova Partita</Button>
        </div>

        {/* Blocchi disponibili */}
        <div className="flex gap-4 mb-4">
          {gameState.availableBlocks.map((block, index) => (
            <DraggableBlock key={index} block={block} index={index} />
          ))}
        </div>

        {/* Griglia di gioco */}
        <Card className="p-4">
          <div className="grid grid-cols-10">
            {gameState.grid.map((row, i) =>
              row.map((cell, j) => (
                <DroppableCell
                  key={`${i}-${j}`}
                  onDrop={handleDrop}
                  row={i}
                  col={j}
                  type={cell}
                  color={gameState.gridColors[i][j]}
                />
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
    </DndProvider>
  );
}