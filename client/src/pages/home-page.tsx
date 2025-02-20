import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import GameMap from "@/components/map/game-map";
import WalletDisplay from "@/components/wallet/wallet-display";
import { Link } from "wouter";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">GameCoinApp</h1>
          <div className="flex items-center gap-4">
            <WalletDisplay />
            <Link href="/game">
              <Button variant="outline">Play Games</Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.username}!</h2>
          <p className="text-muted-foreground">
            Explore the map to find collectibles and earn rewards. Play minigames to earn additional credits!
          </p>
        </div>
        
        <div className="h-[600px] rounded-lg overflow-hidden border">
          <GameMap />
        </div>
      </main>
    </div>
  );
}
